import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthConfigService } from '../auth.config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly authConfig: AuthConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtRefreshStrategy.extractTokenFromCookie,
      ]),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: authConfig.refreshPublicKey,
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
      passReqToCallback: true,
    });
  }

  validate(_req: Request, payload: JwtPayload): JwtPayload {
    return payload;
  }

  private static extractTokenFromCookie(request: Request): string | null {
    if (!request) {
      return null;
    }

    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === 'refresh_token') {
        return rest.length > 0 ? decodeURIComponent(rest.join('=')) : null;
      }
    }

    return null;
  }
}
