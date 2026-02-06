import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class OAuth2Service {
  private readonly logger = new Logger(OAuth2Service.name);
  private googleClient: OAuth2Client;

  constructor(private readonly usersService: UsersService) {
    // Initialize Google OAuth2 client
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  /**
   * Verify Google OAuth2 token and return user profile
   * @param token - Google OAuth2 token
   * @returns Google user profile
   */
  async verifyGoogleToken(token: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Jeton Google invalide');
      }

      return {
        sub: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
      };
    } catch (error) {
      this.logger.error('Échec de la vérification du jeton Google :', error);
      throw new UnauthorizedException('Jeton Google invalide');
    }
  }

  /**
   * Login or register user with Google OAuth2
   * @param token - Google OAuth2 token
   * @returns User without password hash
   */
  async loginWithGoogle(token: string): Promise<User> {
    const googleProfile = await this.verifyGoogleToken(token);
    
    this.logger.log(`Tentative Google OAuth2 pour : ${googleProfile.email}`);

    // Check if user already exists
    let user = await this.usersService.findByEmail(googleProfile.email);

    if (!user) {
      // Create new user if doesn't exist
      this.logger.log(`Création d’un nouvel utilisateur pour le compte Google : ${googleProfile.email}`);
      user = await this.usersService.create({
        email: googleProfile.email,
        passwordHash: '', // No password for OAuth2 users
      });

      // Create provider account record
      await this.usersService.createProviderAccount({
        userId: user.id,
        provider: 'google',
        providerUserId: googleProfile.sub,
        accessToken: token,
        refreshToken: null,
        expiresAt: null,
      });
    } else {
      // Update existing provider account or create if doesn't exist
      await this.usersService.upsertProviderAccount({
        userId: user.id,
        provider: 'google',
        providerUserId: googleProfile.sub,
        accessToken: token,
        refreshToken: null,
        expiresAt: null,
      });
    }

    this.logger.log(`Connexion Google OAuth2 réussie pour l’utilisateur ID ${user.id}`);

    return user;
  }
}
