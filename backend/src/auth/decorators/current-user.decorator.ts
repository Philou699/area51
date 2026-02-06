import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

export interface CurrentUserPayload {
  id: number;
  email: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const payload = request.user;

    if (!payload) {
      throw new UnauthorizedException('Aucun jeton d’authentification fourni');
    }

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException('Jeton d’authentification invalide');
    }

    return {
      id: userId,
      email: payload.email,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    };
  },
);
