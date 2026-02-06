import { Injectable, Logger } from '@nestjs/common';
import type { CookieOptions } from 'express';

interface UnauthorizedDelayRange {
  min: number;
  max: number;
}

const DEFAULT_ACCESS_TOKEN_EXPIRES = 600; // 10 minutes
const DEFAULT_REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 7; // 7 days
const DEFAULT_RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes
const DEFAULT_RATE_LIMIT_MAX = 5;
const DEFAULT_LOCK_DURATIONS = [60, 300, 1800]; // seconds
const LOCK_COUNT_TTL_SECONDS = 24 * 60 * 60; // 24 hours

@Injectable()
export class AuthConfigService {
  private readonly logger = new Logger(AuthConfigService.name);
  private readonly env: NodeJS.ProcessEnv;

  readonly accessPrivateKey: string;
  readonly accessPublicKey: string;
  readonly refreshPrivateKey: string;
  readonly refreshPublicKey: string;

  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;

  readonly authRateLimitWindowSeconds: number;
  readonly authRateLimitMaxAttempts: number;

  readonly redisUrl: string | null;
  readonly cookieDomain?: string;
  readonly nodeEnv: string;
  readonly cookieSameSite: 'strict' | 'none';
  readonly refreshCookieOptions: CookieOptions;
  readonly jwtIssuer: string;
  readonly jwtAudience: string;
  readonly lockDurationsSeconds: readonly number[];
  readonly lockCounterTtlSeconds: number = LOCK_COUNT_TTL_SECONDS;
  readonly unauthorizedDelayRangeMs: UnauthorizedDelayRange = { min: 120, max: 180 };

  constructor() {
    this.env = process.env;

    this.nodeEnv = this.env.NODE_ENV ?? 'development';

    this.accessPrivateKey = this.requirePem('JWT_ACCESS_PRIVATE_KEY');
    this.accessPublicKey = this.requirePem('JWT_ACCESS_PUBLIC_KEY');
    this.refreshPrivateKey = this.requirePem('JWT_REFRESH_PRIVATE_KEY');
    this.refreshPublicKey = this.requirePem('JWT_REFRESH_PUBLIC_KEY');

    this.accessTokenTtlSeconds = this.parseDuration(
      this.env.JWT_ACCESS_EXPIRES,
      DEFAULT_ACCESS_TOKEN_EXPIRES,
    );
    this.refreshTokenTtlSeconds = this.parseDuration(
      this.env.JWT_REFRESH_EXPIRES,
      DEFAULT_REFRESH_TOKEN_EXPIRES,
    );

    this.authRateLimitWindowSeconds = this.parseInteger(
      this.env.AUTH_RATE_LIMIT_WINDOW,
      DEFAULT_RATE_LIMIT_WINDOW,
    );
    this.authRateLimitMaxAttempts = this.parseInteger(
      this.env.AUTH_RATE_LIMIT_MAX,
      DEFAULT_RATE_LIMIT_MAX,
    );

    this.redisUrl = this.env.REDIS_URL ?? null;
    this.cookieDomain = this.env.COOKIE_DOMAIN ?? undefined;
    this.cookieSameSite = this.resolveSameSite();

    this.jwtIssuer = this.env.JWT_ISSUER ?? 'api.example.com';
    this.jwtAudience = this.env.JWT_AUDIENCE ?? 'web';

    this.lockDurationsSeconds = DEFAULT_LOCK_DURATIONS;

    this.refreshCookieOptions = {
      httpOnly: true,
      secure: this.nodeEnv === 'production',
      sameSite: this.cookieSameSite,
      path: '/auth/refresh',
      maxAge: this.refreshTokenTtlSeconds * 1000,
      domain: this.cookieDomain,
    };
  }

  private requirePem(variable: string): string {
    const value = this.env[variable];
    if (!value) {
      throw new Error(`${variable} is required but was not provided`);
    }

    return value.includes('\\n') ? value.replace(/\\n/g, '\n').trim() : value.trim();
  }

  private parseDuration(value: string | undefined, fallbackSeconds: number): number {
    if (!value) {
      return fallbackSeconds;
    }

    const trimmed = value.trim();
    const durationPattern = /^(\d+)([smhd])?$/i;
    const match = durationPattern.exec(trimmed);

    if (!match) {
      this.logger.warn(`Invalid duration value "${value}", falling back to ${fallbackSeconds}s`);
      return fallbackSeconds;
    }

    const amount = Number(match[1]);
    const unit = match[2]?.toLowerCase();

    switch (unit) {
      case 'd':
        return amount * 60 * 60 * 24;
      case 'h':
        return amount * 60 * 60;
      case 'm':
        return amount * 60;
      case 's':
      case undefined:
        return amount;
      default:
        this.logger.warn(`Unsupported duration unit "${unit}", using fallback ${fallbackSeconds}s`);
        return fallbackSeconds;
    }
  }

  private parseInteger(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      this.logger.warn(`Invalid integer value "${value}", using fallback ${fallback}`);
      return fallback;
    }

    return parsed;
  }

  private resolveSameSite(): 'strict' | 'none' {
    const configuredValue = this.env.COOKIE_SAMESITE?.toLowerCase();
    if (configuredValue === 'none' || configuredValue === 'strict') {
      return configuredValue;
    }
    if (configuredValue && configuredValue !== 'strict') {
      this.logger.warn(
        `Unsupported COOKIE_SAMESITE value "${configuredValue}", defaulting to "strict"`,
      );
    }

    return 'strict';
  }
}
