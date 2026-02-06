import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  GithubService,
  GithubActionKey,
  GITHUB_SUPPORTED_ACTIONS,
} from './github.service';
import {
  GithubApiError,
  GithubTokenUnavailableError,
} from './github-api.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GithubPollingResponseDto,
  GithubTestResponseDto,
} from './dto/github-response.dto';
import { UnauthorizedResponseDto } from '../auth/dto/login-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('github')
@ApiBearerAuth()
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(JwtAuthGuard)
  @Get('test')
  @ApiOperation({ summary: 'Tester la récupération GitHub pour un dépôt' })
  @ApiQuery({
    name: 'owner',
    required: true,
    description: 'Organisation ou utilisateur GitHub',
  })
  @ApiQuery({
    name: 'repo',
    required: true,
    description: 'Nom du dépôt',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Clé d’action optionnelle pour filtrer le résultat',
    enum: GITHUB_SUPPORTED_ACTIONS,
  })
  @ApiOkResponse({
    description: 'Récupération manuelle effectuée avec succès',
    type: GithubTestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Paramètres manquants ou action non prise en charge',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async testRepository(
    @Req() request: Request,
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('action') action?: string,
  ): Promise<GithubTestResponseDto> {
    if (!owner || !repo) {
      throw new BadRequestException('Les paramètres "owner" et "repo" sont obligatoires.');
    }

    if (action && !GITHUB_SUPPORTED_ACTIONS.includes(action as GithubActionKey)) {
      throw new BadRequestException(
        `Clé d’action invalide. Valeurs acceptées : ${GITHUB_SUPPORTED_ACTIONS.join(', ')}`,
      );
    }

    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);

    const actionKey = action as GithubActionKey | undefined;
    let data;
    try {
      data = await this.githubService.manualFetch(
        owner,
        repo,
        userId,
        actionKey,
      );
    } catch (error) {
      if (error instanceof GithubTokenUnavailableError) {
        throw new BadRequestException(
          'Aucun compte GitHub valide n’est associé à votre profil. Reconnectez GitHub puis réessayez.',
        );
      }
      if (error instanceof GithubApiError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return {
      owner,
      repo,
      fetchedAt: new Date().toISOString(),
      result: data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('poll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déclencher manuellement le polling GitHub pour toutes les areas' })
  @ApiOkResponse({
    description: 'Polling lancé avec succès',
    type: GithubPollingResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async triggerPolling(): Promise<GithubPollingResponseDto> {
    await this.githubService.pollAllAreas();
    return { message: 'Polling GitHub lancé avec succès' };
  }
}
