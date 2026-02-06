import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CompleteDiscordDto } from './dto/complete-discord.dto';
import {
  ConnectionsListResponseDto,
  GithubAuthorizeResponseDto,
  DiscordAuthorizeResponseDto,
  DiscordConnectionResponseDto,
  DiscordGuildListResponseDto,
  DiscordChannelListResponseDto,
} from './dto/connection-response.dto';
import { UnauthorizedResponseDto } from '../auth/dto/login-response.dto';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto';
import { ProviderAccountAlreadyConnectedError } from './connections.service';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
export class ConnectionsController {
  private readonly logger = new Logger(ConnectionsController.name);

  constructor(private readonly connectionsService: ConnectionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('github/start')
  @ApiOperation({
    summary: 'Initier la connexion OAuth GitHub',
    description:
      'Génère une URL d’autorisation et un paramètre state pour connecter l’utilisateur authentifié à GitHub.',
  })
  @ApiOkResponse({
    description: 'URL d’autorisation générée avec succès',
    type: GithubAuthorizeResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async startGithub(
    @Req() request: Request,
  ): Promise<GithubAuthorizeResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    const frontendOrigin =
      request.get('x-frontend-origin') ?? undefined;
    return this.connectionsService.startGithubConnection(
      userId,
      frontendOrigin,
    );
  }

  @Get('github/callback')
  @ApiOperation({
    summary: 'Callback OAuth GitHub',
    description:
      'Ferme la fenêtre contextuelle GitHub et informe la page principale du succès ou de l’erreur.',
  })
  @ApiOkResponse({
    description: 'Réponse HTML notifiant la fenêtre principale',
  })
  async githubCallback(
    @Req() request: Request,
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ): Promise<void> {
    const redirectOrigin =
      state && typeof state === 'string'
        ? this.connectionsService.getStateRedirectOrigin(
            state,
            'github',
          )
        : undefined;

    if (!code || !state) {
      return this.redirectToFrontendOAuthResult(response, request, {
        provider: 'github',
        status: 'error',
        reason: 'invalid_request',
        redirectOrigin,
      });
    }

    try {
      await this.connectionsService.completeGithubConnection(code, state);
      return this.redirectToFrontendOAuthResult(response, request, {
        provider: 'github',
        status: 'success',
        redirectOrigin,
      });
    } catch (error) {
      if (error instanceof ProviderAccountAlreadyConnectedError) {
        return this.redirectToFrontendOAuthResult(response, request, {
          provider: 'github',
          status: 'error',
          reason: 'already_linked',
          redirectOrigin,
        });
      }

      this.logger.error(
        `GitHub callback failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.redirectToFrontendOAuthResult(response, request, {
        provider: 'github',
        status: 'error',
        reason: 'server_error',
        redirectOrigin,
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('github')
  @ApiOperation({
    summary: 'Déconnecter GitHub',
    description: 'Révoque le token puis supprime la connexion GitHub.',
  })
  @ApiOkResponse({ description: 'Connexion GitHub supprimée.' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async disconnectGithub(
    @Req() request: Request,
  ): Promise<{ success: boolean }> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    await this.connectionsService.disconnectGithubAccount(userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('discord')
  @ApiOperation({
    summary: 'Déconnecter Discord',
    description: 'Supprime la connexion Discord pour l’utilisateur authentifié.',
  })
  @ApiOkResponse({ description: 'Connexion Discord supprimée.' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async disconnectDiscord(
    @Req() request: Request,
  ): Promise<{ success: boolean }> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    await this.connectionsService.disconnectDiscordAccount(userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('spotify')
  @ApiOperation({
    summary: 'Déconnecter Spotify',
    description: 'Supprime la connexion Spotify pour l’utilisateur authentifié.',
  })
  @ApiOkResponse({ description: 'Connexion Spotify supprimée.' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async disconnectSpotify(
    @Req() request: Request,
  ): Promise<{ success: boolean }> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    await this.connectionsService.disconnectSpotifyAccount(userId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('discord/start')
  @ApiOperation({
    summary: 'Initier la connexion OAuth Discord',
    description:
      'Génère une URL d’autorisation pour installer le bot et autoriser l’accès aux serveurs de l’utilisateur.',
  })
  @ApiOkResponse({
    description: 'URL Discord générée',
    type: DiscordAuthorizeResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async startDiscord(
    @Req() request: Request,
  ): Promise<DiscordAuthorizeResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    return this.connectionsService.startDiscordConnection(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('discord/complete')
  @ApiOperation({
    summary: 'Finaliser la connexion Discord',
    description:
      'Échange le code contre un jeton utilisateur, vérifie le serveur sélectionné et enregistre la connexion.',
  })
  @ApiBody({ type: CompleteDiscordDto })
  @ApiOkResponse({
    description: 'Compte Discord connecté avec succès',
    type: DiscordConnectionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'State invalide ou code refusé par Discord',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorResponseDto) },
        { $ref: getSchemaPath(ErrorResponseDto) },
      ],
    },
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async completeDiscord(
    @Req() request: Request,
    @Body(new ValidationPipe({ transform: true }))
    body: CompleteDiscordDto,
  ): Promise<DiscordConnectionResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    return this.connectionsService.completeDiscordConnection(
      userId,
      body.code,
      body.state,
      body.guildId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('discord/guilds')
  @ApiOperation({
    summary: 'Lister les serveurs Discord connectés',
    description:
      "Renvoie les guildes (serveurs) sur lesquels l'utilisateur a autorisé le bot.",
  })
  @ApiOkResponse({
    description: 'Liste des guildes Discord accessibles',
    type: DiscordGuildListResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async listDiscordGuilds(
    @Req() request: Request,
  ): Promise<DiscordGuildListResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    const guilds = await this.connectionsService.listDiscordGuilds(userId);
    return { guilds };
  }

  @UseGuards(JwtAuthGuard)
  @Get('discord/guilds/:guildId/channels')
  @ApiOperation({
    summary: 'Lister les canaux Discord d’un serveur',
    description:
      'Renvoie les canaux textuels où le bot peut écrire ou réagir pour le serveur sélectionné.',
  })
  @ApiOkResponse({
    description: 'Canaux Discord disponibles',
    type: DiscordChannelListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Serveur Discord inconnu ou non autorisé',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorResponseDto) },
        { $ref: getSchemaPath(ErrorResponseDto) },
      ],
    },
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async listDiscordChannels(
    @Req() request: Request,
    @Param('guildId') guildId: string,
  ): Promise<DiscordChannelListResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    const channels = await this.connectionsService.listDiscordChannels(
      userId,
      guildId,
    );
    return { channels };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Lister les fournisseurs externes connectés par l’utilisateur',
  })
  @ApiOkResponse({
    description: 'Statut de connexion actuel pour chaque fournisseur',
    type: ConnectionsListResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async listConnections(
    @Req() request: Request,
  ): Promise<ConnectionsListResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    const connections =
      await this.connectionsService.getConnectionStatuses(userId);
    return {
      connections: connections.map((connection) => ({
        provider: connection.provider,
        connected: connection.connected,
        connectedAt: connection.connectedAt ?? null,
        details: connection.details ?? null,
      })),
    };
  }
  private redirectToFrontendOAuthResult(
    res: Response,
    request: Request,
    payload: {
      provider: string;
      status: 'success' | 'error';
      reason?: string;
      redirectOrigin?: string;
    },
  ): void {
    const targetOrigin =
      payload.redirectOrigin ??
      this.getFrontendTargets(request).origin;
    const resultUrl = new URL('/connections/github/result', targetOrigin);
    resultUrl.searchParams.set('provider', payload.provider);
    resultUrl.searchParams.set('status', payload.status);
    if (payload.reason) {
      resultUrl.searchParams.set('reason', payload.reason);
    }
    res.redirect(resultUrl.toString());
  }

  private getFrontendTargets(
    request: Request,
  ): { origin: string; connectionsUrl: string } {
    const configured = process.env.FRONTEND_URL;
    const fallbackOrigin = `${request.protocol}://${request.get('host')}`;

    if (configured) {
      const url = new URL(configured);
      return {
        origin: url.origin,
        connectionsUrl: new URL('/connections', url).toString(),
      };
    }

    return {
      origin: fallbackOrigin,
      connectionsUrl: `${fallbackOrigin}/connections`,
    };
  }
}
