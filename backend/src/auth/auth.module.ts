import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthConfigService } from './auth.config';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RateLimitService } from './rate-limit.service';
import { OAuth2Service } from './oauth2.service';

const oauthProviders =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [OAuth2Service]
    : [];

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [],
      useFactory: () => {
        const authConfig = new AuthConfigService();
        return {
          privateKey: authConfig.accessPrivateKey,
          publicKey: authConfig.accessPublicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: `${authConfig.accessTokenTtlSeconds}s`,
            issuer: authConfig.jwtIssuer,
            audience: authConfig.jwtAudience,
          },
          verifyOptions: {
            algorithms: ['RS256'],
            issuer: authConfig.jwtIssuer,
            audience: authConfig.jwtAudience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthConfigService,
    RateLimitService,
    ...oauthProviders,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, ...oauthProviders],
})
export class AuthModule {}
