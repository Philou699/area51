import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  ValidationPipe,
  Optional,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OAuth2Service } from './oauth2.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  TooManyRequestsResponseDto,
  UnauthorizedResponseDto,
} from './dto/login-response.dto';
import { RateLimitService } from './rate-limit.service';
import { GoogleOAuthDto } from './dto/google-oauth.dto';
import { UsersService } from '../users/users.service';
import { AuthConfigService } from './auth.config';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Identifiants invalides';
const TOO_MANY_REQUESTS_MESSAGE = 'Trop de tentatives de connexion. Réessayez plus tard.';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitService: RateLimitService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly authConfigService: AuthConfigService,
    @Optional() private readonly oauth2Service?: OAuth2Service,
  ) {}

  /**
   * Register a new user
   * POST /auth/register
  */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau compte utilisateur',
    description:
      'Crée un utilisateur avec l’e-mail et le mot de passe fournis, puis émet les jetons d’accès et de rafraîchissement.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Utilisateur enregistré avec succès',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'La validation a échoué pour les données fournies',
    type: ValidationErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Un compte existe déjà pour cette adresse e-mail',
    type: ErrorResponseDto,
  })
  async register(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RegisterResponseDto> {
    this.logger.log(`Tentative d’inscription pour l’e-mail : ${registerDto.email}`);

    const user = await this.authService.register(registerDto);
    const tokens = await this.authService.generateTokens(user);
    this.authService.setRefreshTokenCookie(response, tokens.refreshToken);
    const loginPayload = this.authService.buildLoginResponse(user, tokens);

    return {
      message: 'Utilisateur créé avec succès',
      ...loginPayload,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authentifier un utilisateur par e-mail et mot de passe',
    description:
      'Valide les identifiants, émet les jetons d’accès/de rafraîchissement et positionne le cookie de rafraîchissement.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'La validation des identifiants fournis a échoué',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiTooManyRequestsResponse({ type: TooManyRequestsResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const email = loginDto.email;
    const clientIp = this.extractClientIp(request);

    const status = await this.rateLimitService.evaluate(email, clientIp);

    if (status.isLocked) {
      this.logger.warn('Tentative de connexion alors que le compte est verrouillé', {
        email,
        clientIp,
        lockTtlSeconds: status.lockTtlSeconds,
      });
      await this.authService.enforceUnauthorizedDelay();
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (status.isRateLimited) {
      this.logger.warn('Quota de tentatives dépassé avant vérification des identifiants', {
        email,
        clientIp,
      });
      throw new HttpException(
        TOO_MANY_REQUESTS_MESSAGE,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.authService.validateUser(email, loginDto.password);

    if (!user) {
      const failureOutcome = await this.rateLimitService.registerFailure(email, clientIp);
      this.logger.warn('Échec de la tentative de connexion', {
        email,
        clientIp,
        rateLimited: failureOutcome.rateLimited,
        lockDurationSeconds: failureOutcome.lockDurationSeconds,
      });

      await this.authService.enforceUnauthorizedDelay();

      if (failureOutcome.rateLimited) {
        throw new HttpException(
          TOO_MANY_REQUESTS_MESSAGE,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    await this.rateLimitService.reset(email, clientIp);

    const tokens = await this.authService.generateTokens(user);
    this.authService.setRefreshTokenCookie(response, tokens.refreshToken);

    this.logger.log('Authentification réussie', { email, userId: user.id });

    return this.authService.buildLoginResponse(user, tokens);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Révoquer le cookie de jeton de rafraîchissement',
    description: 'Supprime le cookie de rafraîchissement de la réponse et consigne la déconnexion.',
  })
  @ApiNoContentResponse({ description: 'Déconnexion effectuée' })
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    this.authService.clearRefreshTokenCookie(response);
    this.logger.log('Déconnexion réussie');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({
    summary: 'Renouveler un jeton d’accès à l’aide du cookie de rafraîchissement',
    description:
      'Valide le jeton de rafraîchissement et émet un nouveau couple access/refresh tout en mettant à jour le cookie.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const payload = request.user as JwtPayload | undefined;
    if (!payload?.sub) {
      throw new UnauthorizedException('Utilisateur non authentifié.');
    }

    const userId = Number.parseInt(payload.sub, 10);
    const user = Number.isNaN(userId)
      ? null
      : await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    const tokens = await this.authService.generateTokens(user);
    this.authService.setRefreshTokenCookie(response, tokens.refreshToken);

    return this.authService.buildLoginResponse(user, tokens);
  }

  @Post('oauth2/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authentifier via Google OAuth',
    description:
      'Échange un jeton Google ID contre des jetons applicatifs. Requiert la configuration du service OAuth2.',
  })
  @ApiBody({ type: GoogleOAuthDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({
    description: 'Google OAuth n’est pas configuré ou le jeton fourni est invalide',
    type: ErrorResponseDto,
  })
  async loginWithGoogleOAuth(
    @Body(new ValidationPipe({ whitelist: true })) body: GoogleOAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    if (!this.oauth2Service) {
      this.logger.error('Tentative de Google OAuth alors que la configuration est absente.');
      throw new BadRequestException('Google OAuth n’est pas configuré.');
    }

    const user = await this.oauth2Service.loginWithGoogle(body.token);
    const tokens = await this.authService.generateTokens(user);
    this.authService.setRefreshTokenCookie(response, tokens.refreshToken);

    this.logger.log('Connexion Google OAuth réussie', { userId: user.id });

    return this.authService.buildLoginResponse(user, tokens);
  }

  /**
   * Start Spotify OAuth flow
   */
  @Get('spotify')
  async spotifyAuth(
    @Query('token') token: string,
    @Req() request: Request, 
    @Res() response: Response
  ): Promise<void> {
    let userId: number;

    if (token) {
      // Token passed as query parameter (from frontend)
      try {
        const payload = this.jwtService.verify(token, {
          publicKey: this.authConfigService.accessPublicKey,
          algorithms: ['RS256'],
          issuer: this.authConfigService.jwtIssuer,
          audience: this.authConfigService.jwtAudience,
        }) as { sub: string };
        userId = parseInt(payload.sub, 10);
      } catch (error) {
        this.logger.error('Invalid token in Spotify auth request', error);
        response.redirect(`${process.env.FRONTEND_URL}/connections?error=invalid_token`);
        return;
      }
    } else {
      // Try to get from JWT guard (if user is authenticated via header)
      const user = request.user as { id: number } | undefined;
      if (!user) {
        response.redirect(`${process.env.FRONTEND_URL}/connections?error=not_authenticated`);
        return;
      }
      userId = user.id;
    }

    const spotifyAuthUrl = this.buildSpotifyAuthUrl(userId);
    response.redirect(spotifyAuthUrl);
  }

  /**
   * Handle Spotify OAuth callback
   */
  @Get('spotify/callback')
  async spotifyCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    if (error) {
      this.logger.error(`Spotify OAuth error: ${error}`);
      response.redirect(`${process.env.FRONTEND_URL}/connections?error=spotify_auth_failed`);
      return;
    }

    if (!code) {
      this.logger.error('Spotify OAuth callback missing authorization code');
      response.redirect(`${process.env.FRONTEND_URL}/connections?error=missing_code`);
      return;
    }

    try {
      // Extract userId from state parameter
      const userId = this.extractUserIdFromState(state);
      if (!userId) {
        this.logger.error('Invalid state parameter - cannot extract user ID');
        response.redirect(`${process.env.FRONTEND_URL}/connections?error=invalid_state`);
        return;
      }

      // Exchange code for tokens
      const tokens = await this.exchangeSpotifyCode(code);
      
      // Get user info from Spotify
      const spotifyUser = await this.fetchSpotifyUser(tokens.access_token);
      
      this.logger.log(`Spotify callback received for user ${userId}`);

      // Store Spotify connection
      await this.usersService.upsertProviderAccount({
        userId: userId,
        provider: 'spotify',
        providerUserId: spotifyUser.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      });

      this.logger.log(`Spotify account connected for user ${userId}`);
      response.redirect(`${process.env.FRONTEND_URL}/connections?success=spotify_connected`);
    } catch (error) {
      this.logger.error(`Spotify OAuth callback error: ${error.message}`);
      response.redirect(`${process.env.FRONTEND_URL}/connections?error=connection_failed`);
    }
  }

  private buildSpotifyAuthUrl(userId: number): string {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_CALLBACK_URL || 'http://localhost:8080/auth/spotify/callback';
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'user-library-modify',
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-follow-read',
      'user-follow-modify',
    ].join(' ');

    // Include userId in state for OAuth callback
    const state = `${userId}_${Math.random().toString(36).substring(7)}`;
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  private extractUserIdFromState(state: string): number | null {
    if (!state) return null;
    
    const parts = state.split('_');
    if (parts.length < 2) return null;
    
    const userId = parseInt(parts[0], 10);
    return isNaN(userId) ? null : userId;
  }

  private async exchangeSpotifyCode(code: string): Promise<any> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_CALLBACK_URL || 'http://localhost:8080/auth/spotify/callback';

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Spotify token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  private async fetchSpotifyUser(accessToken: string): Promise<any> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify user fetch failed: ${response.status}`);
    }

    return response.json();
  }

  private extractClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
      const [firstIp] = forwardedFor.split(',');
      if (firstIp) {
        return firstIp.trim();
      }
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }

    return request.ip ?? request.socket.remoteAddress ?? 'unknown';
  }
}
