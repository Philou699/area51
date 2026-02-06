import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { createHash, pbkdf2, randomBytes } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { AuthConfigService } from './auth.config';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
  payload: JwtPayload;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;
  
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = await pbkdf2Async(password, salt, 10000, 64, 'sha512');
    return `${salt}:${hash.toString('hex')}`;
  }
  
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = await pbkdf2Async(password, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  }
  private fallbackPasswordHashPromise: Promise<string> | null = null;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authConfig: AuthConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const email = this.normalizeEmail(registerDto.email);
    const password = registerDto.password;

    this.logger.log(`Tentative d’inscription`, { email });

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Inscription refusée : e-mail déjà utilisé`, { email });
      throw new ConflictException('Un utilisateur existe déjà avec cet e-mail');
    }

    try {
      const passwordHash = await this.hashPassword(password);
      const user = await this.usersService.create({
        email,
        passwordHash,
      });

      this.logger.log(`Utilisateur inscrit avec succès`, { userId: user.id });

      return user;
    } catch (error) {
      this.logger.error(`Échec de l’inscription`, { email, error });
      throw new InternalServerErrorException("Impossible d’inscrire l’utilisateur");
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);
    const isPasswordValid = await this.safeVerifyPassword(
      user?.passwordHash ?? null,
      password,
    );

    if (!user || !isPasswordValid) {
      this.logger.warn(`Échec de l’authentification`, { email: normalizedEmail });
      return null;
    }

    if (this.isInactive(user)) {
      this.logger.warn(`Authentification bloquée : compte inactif`, {
        email: normalizedEmail,
      });
      return null;
    }

    if (this.isBanned(user)) {
      this.logger.warn(`Authentification bloquée : compte suspendu`, {
        email: normalizedEmail,
      });
      return null;
    }

    return user;
  }

  async generateTokens(user: User): Promise<GeneratedTokens> {
    const jwtId = randomUUID();
    const roles = this.resolveRoles(user);
    const subject = String(user.id);

    const payload: JwtPayload = {
      sub: subject,
      email: user.email,
      roles,
      jti: jwtId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        algorithm: 'RS256',
        privateKey: this.authConfig.accessPrivateKey,
        expiresIn: this.authConfig.accessTokenTtlSeconds,
        issuer: this.authConfig.jwtIssuer,
        audience: this.authConfig.jwtAudience,
      }),
      this.jwtService.signAsync(payload, {
        algorithm: 'RS256',
        privateKey: this.authConfig.refreshPrivateKey,
        expiresIn: this.authConfig.refreshTokenTtlSeconds,
        issuer: this.authConfig.jwtIssuer,
        audience: this.authConfig.jwtAudience,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: this.authConfig.accessTokenTtlSeconds,
      refreshExpiresInSeconds: this.authConfig.refreshTokenTtlSeconds,
      payload,
    };
  }

  async revokeRefreshTokens(_userId: number, _jti: string): Promise<void> {
    // Placeholder for refresh token revocation logic when rotation is implemented.
    return;
  }

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, this.authConfig.refreshCookieOptions);
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      ...this.authConfig.refreshCookieOptions,
      maxAge: 0,
    });
  }

  buildLoginResponse(
    user: User,
    tokens: GeneratedTokens,
  ): {
    access_token: string;
    expires_in: number;
    token_type: 'Bearer';
    user: {
      id: string;
      email: string;
      roles: string[];
    };
  } {
    return {
      access_token: tokens.accessToken,
      expires_in: tokens.expiresInSeconds,
      token_type: 'Bearer',
      user: {
        id: this.serializeUserId(user.id),
        email: user.email,
        roles: this.resolveRoles(user),
      },
    };
  }

  async enforceUnauthorizedDelay(): Promise<void> {
    const { min, max } = this.authConfig.unauthorizedDelayRangeMs;
    const delta = Math.max(max - min, 0);
    const delay = min + (delta > 0 ? Math.floor(Math.random() * (delta + 1)) : 0);
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private async safeVerifyPassword(hash: string | null, password: string): Promise<boolean> {
    const hashToVerify =
      hash ?? (await this.getFallbackPasswordHash());

    try {
      return await this.verifyPassword(password, hashToVerify);
    } catch (error) {
      this.logger.error('Password verification failed', { error });
      return false;
    }
  }

  private async getFallbackPasswordHash(): Promise<string> {
    if (!this.fallbackPasswordHashPromise) {
      this.fallbackPasswordHashPromise = this.hashPassword(randomUUID());
    }

    return this.fallbackPasswordHashPromise;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isInactive(user: User): boolean {
    return 'isActive' in user ? (user as unknown as { isActive?: boolean }).isActive === false : false;
  }

  private isBanned(user: User): boolean {
    return 'isBanned' in user ? (user as unknown as { isBanned?: boolean }).isBanned === true : false;
  }

  private resolveRoles(user: User): string[] {
    if ('roles' in user) {
      const rawRoles = (user as unknown as { roles?: string[] | null }).roles;
      if (Array.isArray(rawRoles) && rawRoles.length > 0) {
        return rawRoles.map((role) => String(role));
      }
    }

    return ['user'];
  }

  private serializeUserId(id: number | string): string {
    return typeof id === 'string' ? id : String(id);
  }
}
