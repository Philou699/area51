import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DiscordService } from './discord.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FetchDiscordMessagesDto } from './dto/fetch-discord-messages.dto';
import { DiscordMessagePreviewDto } from './dto/discord-message-preview.dto';
import { SendDiscordMessageDto } from './dto/send-discord-message.dto';

@ApiTags('discord')
@ApiBearerAuth()
@Controller('discord')
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}

  @UseGuards(JwtAuthGuard)
  @Get('test/messages')
  @ApiOperation({
    summary: 'Récupérer les derniers messages d’un salon',
    description:
      'Retourne jusqu’à 50 messages récents pour le salon indiqué. Nécessite la variable DISCORD_BOT_TOKEN dans la configuration.',
  })
  @ApiOkResponse({
    description: 'Messages récents du salon',
    type: DiscordMessagePreviewDto,
    isArray: true,
  })
  async getRecentMessages(
    @Query() query: FetchDiscordMessagesDto,
  ): Promise<DiscordMessagePreviewDto[]> {
    const limit = query.limit ?? 10;
    return this.discordService.fetchRecentMessages(query.channelId, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post('test/send-message')
  @ApiOperation({
    summary: 'Envoyer un message dans un salon Discord',
    description:
      'Envoie un message texte simple via le bot configuré. Utile pour tester manuellement l’intégration Discord.',
  })
  @ApiOkResponse({
    description: 'Message envoyé avec succès',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string' },
      },
    },
  })
  async sendMessage(
    @Body() dto: SendDiscordMessageDto,
  ): Promise<{ messageId: string }> {
    return this.discordService.sendPlainMessage(dto.channelId, dto.content, {
      mentionUserIds: dto.mentionUserIds,
      mentionRoleIds: dto.mentionRoleIds,
    });
  }
}
