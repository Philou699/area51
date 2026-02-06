import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AreaLogStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

export type DiscordActionKey =
  | 'new_channel_message'
  | 'message_contains_keyword'
  | 'message_with_attachment';

export interface DiscordReactionContext {
  source: string;
  activity?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  areaId?: number;
  raw?: unknown;
}

interface DiscordActionConfig {
  guildId: string;
  channelId: string;
  allowBots: boolean;
  allowedUserIds: string[];
  keywords: string[];
  allowedContentTypes: string[];
  requireImage: boolean;
}

interface DiscordAttachmentSummary {
  id: string;
  url: string;
  filename: string | null;
  contentType: string | null;
  size: number | null;
}

interface DiscordMessageActivity {
  id: string;
  channelId: string;
  guildId: string | null;
  content: string;
  author: {
    id: string | null;
    username: string | null;
    globalName: string | null;
    displayName: string | null;
    isBot: boolean;
  };
  attachments: DiscordAttachmentSummary[];
  mentions: string[];
  createdAt: string;
  url: string;
  raw: unknown;
}

interface DiscordAreaEntry {
  area: any;
  config: DiscordActionConfig;
}

interface ChannelBucket {
  channelId: string;
  actionAreas: Map<DiscordActionKey, DiscordAreaEntry[]>;
}

interface DiscordChannelInfo {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private readonly apiBaseUrl = 'https://discord.com/api/v10';

  constructor(private readonly database: DatabaseService) {}

  /**
   * Periodically poll Discord channels for new activity.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollAllAreas(): Promise<void> {
    if (!this.getBotToken()) {
      this.logger.warn(
        'DISCORD_BOT_TOKEN is not configured. Skipping Discord polling.',
      );
      return;
    }

    try {
      const service = await this.database.service.findUnique({
        where: { slug: 'discord' },
        include: { actions: true },
      });

      if (!service) {
        this.logger.warn('Discord service not found in database');
        return;
      }

      const areas = await this.database.area.findMany({
        where: {
          enabled: true,
          action: {
            serviceId: service.id,
          },
        },
        include: {
          action: true,
          reaction: {
            include: {
              service: true,
            },
          },
          user: true,
        },
      });

      if (areas.length === 0) {
        this.logger.debug('No active Discord areas found');
        return;
      }

      const buckets = this.groupAreasByChannel(areas);

      for (const bucket of buckets.values()) {
        await this.processChannelBucket(bucket, service.id);
      }
    } catch (error) {
      this.logger.error(
        `Discord polling failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Execute a Discord reaction. Exposed so other services (e.g. GitHub)
   * can trigger Discord side-effects.
   */
  async executeReaction(
    reactionKey: string,
    config: Record<string, unknown>,
    context: DiscordReactionContext,
  ): Promise<void> {
    switch (reactionKey) {
      case 'send_channel_message':
        await this.handleSendChannelMessage(config, context);
        return;
      case 'create_thread':
        await this.handleCreateThread(config, context);
        return;
      default:
        throw new Error(`Unsupported Discord reaction key: ${reactionKey}`);
    }
  }

  /**
   * Helper used by the controller to send a simple message.
   */
  async sendPlainMessage(
    channelId: string,
    content: string,
    options?: {
      mentionUserIds?: string[];
      mentionRoleIds?: string[];
    },
  ): Promise<{ messageId: string }> {
    const body: Record<string, unknown> = {
      content,
    };

    const mentionUserIds = options?.mentionUserIds ?? [];
    const mentionRoleIds = options?.mentionRoleIds ?? [];

    if (mentionUserIds.length || mentionRoleIds.length) {
      body.allowed_mentions = {
        parse: [] as string[],
        users: mentionUserIds,
        roles: mentionRoleIds,
      };
      const mentionTokens = [
        ...mentionUserIds.map((id) => `<@${id}>`),
        ...mentionRoleIds.map((id) => `<@&${id}>`),
      ];
      body.content = `${mentionTokens.join(' ')} ${content}`.trim();
    }

    const response = await this.createMessage(channelId, body);
    return { messageId: response.id };
  }

  /**
   * Helper used by the controller to fetch recent messages.
   */
  async fetchRecentMessages(
    channelId: string,
    limit = 10,
  ): Promise<DiscordMessageActivity[]> {
    const raw = await this.discordFetch<any[]>(
      `/channels/${channelId}/messages?limit=${Math.min(limit, 50)}`,
      {
        method: 'GET',
      },
    );

    return raw
      .map((message) => this.mapMessageToActivity(message))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  private groupAreasByChannel(areas: any[]): Map<string, ChannelBucket> {
    const buckets = new Map<string, ChannelBucket>();

    for (const area of areas) {
      const actionKey = area.action.key as DiscordActionKey;
      if (!this.isSupportedAction(actionKey)) {
        this.logger.warn(`Unsupported Discord action key: ${actionKey}`);
        continue;
      }

      const config = this.parseActionConfig(area.actionConfig);
      if (!config) {
        this.logger.warn(
          `Skipping area ${area.id}: invalid or missing Discord action configuration`,
        );
        continue;
      }

      if (!buckets.has(config.channelId)) {
        buckets.set(config.channelId, {
          channelId: config.channelId,
          actionAreas: new Map<DiscordActionKey, DiscordAreaEntry[]>(),
        });
      }

      const bucket = buckets.get(config.channelId)!;
      if (!bucket.actionAreas.has(actionKey)) {
        bucket.actionAreas.set(actionKey, []);
      }

      bucket.actionAreas.get(actionKey)!.push({ area, config });
    }

    return buckets;
  }

  private async processChannelBucket(
    bucket: ChannelBucket,
    serviceId: number,
  ): Promise<void> {
    const messages = await this.fetchRecentMessages(bucket.channelId, 50);

    for (const [actionKey, entries] of bucket.actionAreas.entries()) {
      for (const activity of messages) {
        const dedupKey = `${actionKey}:${activity.id}`;
        const existing = await this.database.webhookEvent.findUnique({
          where: {
            serviceId_externalId: {
              serviceId,
              externalId: dedupKey,
            },
          },
        });

        if (existing) {
          continue;
        }

        await this.database.webhookEvent.create({
          data: {
            serviceId,
            externalId: dedupKey,
            payload: activity as any,
          },
        });

        await this.processMessageForAreas(entries, activity, actionKey);
      }
    }
  }

  private async processMessageForAreas(
    entries: DiscordAreaEntry[],
    activity: DiscordMessageActivity,
    actionKey: DiscordActionKey,
  ): Promise<void> {
    for (const entry of entries) {
      const { area, config } = entry;

      if (!this.matchesActionCriteria(activity, actionKey, config)) {
        continue;
      }

      try {
        await this.executeAreaReaction(area, activity);
        await this.database.areaLog.create({
          data: {
            areaId: area.id,
            status: AreaLogStatus.success,
            payload: activity as any,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to execute Discord reaction for area ${area.id}: ${error.message}`,
        );
        await this.database.areaLog.create({
          data: {
            areaId: area.id,
            status: AreaLogStatus.failure,
            payload: activity as any,
            error: error.message,
          },
        });
      }
    }
  }

  private async executeAreaReaction(
    area: any,
    activity: DiscordMessageActivity,
  ): Promise<void> {
    const reactionConfig = area.reactionConfig || {};
    const reactionServiceSlug = area.reaction?.service?.slug;

    if (reactionServiceSlug !== 'discord') {
      this.logger.warn(
        `Area ${area.id} reaction service ${reactionServiceSlug} is not supported by DiscordService`,
      );
      return;
    }

    await this.executeReaction(area.reaction.key, reactionConfig, {
      source: 'discord',
      activity: activity as unknown as Record<string, unknown>,
      raw: activity.raw,
      areaId: area.id,
    });
  }

  private parseActionConfig(config: unknown): DiscordActionConfig | null {
    if (!config || typeof config !== 'object') {
      return null;
    }

    const typed = config as Record<string, unknown>;
    const guildId = this.ensureString(typed.guildId);
    if (!guildId) {
      return null;
    }
    const channelId = this.ensureString(typed.channelId);
    if (!channelId) {
      return null;
    }

    const allowBots = Boolean(typed.allowBots);
    const allowedUserIds = Array.isArray(typed.allowedUserIds)
      ? typed.allowedUserIds
          .map((id) => this.ensureString(id))
          .filter((id): id is string => Boolean(id))
      : [];
    const keywords = Array.isArray(typed.keywords)
      ? typed.keywords
          .map((keyword) => this.ensureString(keyword))
          .filter((keyword): keyword is string => Boolean(keyword))
      : [];
    const allowedContentTypes = Array.isArray(typed.allowedContentTypes)
      ? typed.allowedContentTypes
          .map((value) => this.ensureString(value))
          .filter((value): value is string => Boolean(value))
      : [];
    const requireImage = Boolean(typed.requireImage);

    return {
      guildId,
      channelId,
      allowBots,
      allowedUserIds,
      keywords,
      allowedContentTypes,
      requireImage,
    };
  }

  private matchesActionCriteria(
    activity: DiscordMessageActivity,
    actionKey: DiscordActionKey,
    config: DiscordActionConfig,
  ): boolean {
    if (!config.allowBots && activity.author.isBot) {
      return false;
    }

    if (activity.guildId && config.guildId !== activity.guildId) {
      return false;
    }

    if (
      config.allowedUserIds.length > 0 &&
      (!activity.author.id ||
        !config.allowedUserIds.includes(activity.author.id))
    ) {
      return false;
    }

    switch (actionKey) {
      case 'new_channel_message':
        return true;

      case 'message_contains_keyword':
        if (config.keywords.length === 0) {
          return false;
        }
        return config.keywords.some((keyword) =>
          activity.content.toLowerCase().includes(keyword.toLowerCase()),
        );

      case 'message_with_attachment':
        if (activity.attachments.length === 0) {
          return false;
        }

        if (config.requireImage) {
          const hasImage = activity.attachments.some(
            (attachment) =>
              attachment.contentType?.toLowerCase().startsWith('image/') ??
              false,
          );
          if (!hasImage) {
            return false;
          }
        }

        if (config.allowedContentTypes.length > 0) {
          return activity.attachments.some((attachment) =>
            attachment.contentType
              ? config.allowedContentTypes.some((mime) =>
                  attachment.contentType!.toLowerCase().includes(
                    mime.toLowerCase(),
                  ),
                )
              : false,
          );
        }

        return true;
    }
  }

  private async handleSendChannelMessage(
    config: Record<string, unknown>,
    context: DiscordReactionContext,
  ): Promise<void> {
    const channelId =
      this.ensureString(config.channelId) ??
      this.resolveChannelIdFromContext(context);

    if (!channelId) {
      throw new Error(
        'Discord channelId is required for send_channel_message reaction',
      );
    }

    const template = this.ensureString(config.contentTemplate);
    const content = template
      ? this.renderTemplate(template, context)
      : this.renderTemplate('New event: {{activity.title}}', context);

    if (!content.trim()) {
      throw new Error(
        'Discord send_channel_message template resolved to an empty message',
      );
    }

    const mentionRoleIds = Array.isArray(config.mentionRoleIds)
      ? config.mentionRoleIds
          .map((value) => this.ensureString(value))
          .filter((value): value is string => Boolean(value))
      : [];

    const mentionUserIds = Array.isArray(config.mentionUserIds)
      ? config.mentionUserIds
          .map((value) => this.ensureString(value))
          .filter((value): value is string => Boolean(value))
      : [];

    const mentionTokens = [
      ...mentionUserIds.map((id) => `<@${id}>`),
      ...mentionRoleIds.map((id) => `<@&${id}>`),
    ];

    const messageBody: Record<string, unknown> = {
      content: mentionTokens.length
        ? `${mentionTokens.join(' ')} ${content}`.trim()
        : content,
    };

    if (mentionRoleIds.length || mentionUserIds.length) {
      messageBody.allowed_mentions = {
        parse: [] as string[],
        users: mentionUserIds,
        roles: mentionRoleIds,
      };
    }

    await this.createMessage(channelId, messageBody);
  }

  private async handleCreateThread(
    config: Record<string, unknown>,
    context: DiscordReactionContext,
  ): Promise<void> {
    const channelId =
      this.ensureString(config.channelId) ??
      this.resolveChannelIdFromContext(context);

    if (!channelId) {
      throw new Error(
        'Discord channelId is required for create_thread reaction',
      );
    }

    const threadNameTemplate =
      this.ensureString(config.threadNameTemplate) ??
      'Nouveau fil {{activity.title}}';
    const threadName = this.ensureNonEmpty(
      this.renderTemplate(threadNameTemplate, context).slice(0, 100),
      'threadNameTemplate',
    );

    const archiveDuration = this.normalizeArchiveDuration(
      config.autoArchiveDuration,
    );

    const body: Record<string, unknown> = {
      name: threadName,
      auto_archive_duration: archiveDuration,
      type: 11, // GUILD_PUBLIC_THREAD
    };

    const thread = await this.discordFetch<{ id: string }>(
      `/channels/${channelId}/threads`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );

    const starterTemplate = this.ensureString(
      config.starterMessageTemplate,
    );
    if (starterTemplate) {
      const starterMessage = this.renderTemplate(
        starterTemplate,
        context,
      ).trim();
      if (starterMessage) {
        await this.createMessage(thread.id, {
          content: starterMessage,
        });
      }
    }
  }

  private normalizeArchiveDuration(value: unknown): number {
    const allowed = new Set([60, 1440, 4320, 10080]);
    if (typeof value === 'number' && allowed.has(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && allowed.has(parsed)) {
        return parsed;
      }
    }
    return 1440;
  }

  private mapMessageToActivity(message: any): DiscordMessageActivity {
    const guildId = message.guild_id ?? null;
    const channelId = message.channel_id;
    const createdAt = message.timestamp ?? message.edited_timestamp;
    const author = message.author ?? {};

    const attachments: DiscordAttachmentSummary[] = Array.isArray(
      message.attachments,
    )
      ? message.attachments.map((attachment: any) => ({
          id: String(attachment.id),
          url: this.ensureString(attachment.url) ?? '',
          filename: this.ensureString(attachment.filename),
          contentType: this.ensureString(attachment.content_type),
          size:
            typeof attachment.size === 'number'
              ? attachment.size
              : attachment.size
              ? Number(attachment.size)
              : null,
        }))
      : [];

    const mentions: string[] = Array.isArray(message.mentions)
      ? message.mentions
          .map((mention: any) => this.ensureString(mention.id))
          .filter((value): value is string => Boolean(value))
      : [];

    return {
      id: String(message.id),
      channelId: String(channelId),
      guildId: guildId ? String(guildId) : null,
      content: this.ensureString(message.content) ?? '',
      author: {
        id: this.ensureString(author.id),
        username: this.ensureString(author.username),
        globalName: this.ensureString(author.global_name),
        displayName: this.ensureString(author.display_name),
        isBot: Boolean(author.bot),
      },
      attachments,
      mentions,
      createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
      url: this.buildMessageUrl(guildId, channelId, message.id),
      raw: message,
    };
  }

  private buildMessageUrl(
    guildId: string | null,
    channelId: string,
    messageId: string,
  ): string {
    if (guildId) {
      return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
    }
    return `https://discord.com/channels/@me/${channelId}/${messageId}`;
  }

  private async createMessage(
    channelId: string,
    body: Record<string, unknown>,
  ): Promise<any> {
    return this.discordFetch(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private resolveChannelIdFromContext(
    context: DiscordReactionContext,
  ): string | undefined {
    const activityChannel = this.ensureString(
      context.activity?.channelId ?? context.activity?.channel_id,
    );
    return activityChannel ?? undefined;
  }

  private renderTemplate(
    template: string,
    context: DiscordReactionContext,
  ): string {
    const data = {
      activity: context.activity ?? {},
      defaults: context.defaults ?? {},
      raw: context.raw ?? {},
      context,
    };

    return template.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, path: string) => {
      const value = path.split('.').reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in acc) {
          return (acc as Record<string, unknown>)[key];
        }
        return undefined;
      }, data as unknown);

      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    });
  }

  private ensureString(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return null;
  }

  private ensureNonEmpty(value: string, field: string): string {
    if (!value || !value.trim()) {
      throw new Error(
        `Discord reaction template "${field}" resolved to an empty value`,
      );
    }
    return value;
  }

  private isSupportedAction(key: string): key is DiscordActionKey {
    return (
      key === 'new_channel_message' ||
      key === 'message_contains_keyword' ||
      key === 'message_with_attachment'
    );
  }

  private getBotToken(): string | null {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token || token.trim().length === 0) {
      return null;
    }
    return token;
  }

  private async discordFetch<T>(
    path: string,
    init: RequestInit,
    parseResponse = true,
  ): Promise<T> {
    const token = this.getBotToken();
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }

    const headers: Record<string, string> = {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    };

    if (init.headers) {
      Object.assign(headers, init.headers as Record<string, string>);
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 204 || !parseResponse) {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Discord API error (${response.status}): ${text || response.statusText}`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return undefined as any;
    }

    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T);

    if (!response.ok) {
      throw new Error(
        `Discord API error (${response.status}): ${
          typeof data === 'object' && data && 'message' in (data as any)
            ? (data as any).message
            : response.statusText
        }`,
      );
    }

    return data;
  }

  async listGuildChannels(guildId: string): Promise<DiscordChannelInfo[]> {
    const channels = await this.discordFetch<
      Array<{
        id: string;
        name: string;
        type: number;
        parent_id?: string | null;
      }>
    >(`/guilds/${guildId}/channels`, {
      method: 'GET',
    });

    return channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parentId:
        channel.parent_id !== undefined && channel.parent_id !== null
          ? String(channel.parent_id)
          : null,
    }));
  }
}
