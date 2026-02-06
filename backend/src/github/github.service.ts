import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AreaLogStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import {
  DiscordReactionContext,
  DiscordService,
} from '../discord/discord.service';
import {
  GithubApiService,
  GithubApiError,
  GithubTokenUnavailableError,
} from './github-api.service';

export type GithubActionKey = 'new_issue'
  | 'new_pull_request'
  | 'new_release';

interface GithubAreaConfig {
  owner?: string;
  repo?: string;
  [key: string]: unknown;
}

interface GithubActivity {
  dedupKey: string;
  actionKey: GithubActionKey;
  type: 'issue' | 'pull_request' | 'release';
  owner: string;
  repo: string;
  title: string;
  url: string;
  createdAt: Date;
  author?: string;
  number?: number;
  body?: string | null;
  extra?: Record<string, unknown>;
}

interface GithubIssue {
  id: number;
  node_id: string;
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user?: {
    login: string;
  };
  body?: string | null;
  labels?: Array<
    | string
    | {
        name?: string;
      }
  >;
  pull_request?: unknown;
}

interface GithubPullRequest {
  id: number;
  number: number;
  html_url: string;
  title: string;
  created_at: string;
  user?: {
    login: string;
  };
  body?: string | null;
  base?: {
    ref?: string;
  };
  head?: {
    ref?: string;
  };
  draft?: boolean;
  state?: string;
}

interface GithubRelease {
  id: number;
  html_url: string | null;
  tag_name: string;
  name: string | null;
  created_at: string | null;
  published_at: string | null;
  body?: string | null;
  author?: {
    login: string;
  };
  draft?: boolean;
  prerelease?: boolean;
}

export const GITHUB_SUPPORTED_ACTIONS: GithubActionKey[] = [
  'new_issue',
  'new_pull_request',
  'new_release',
];

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly recentActivityThresholdMs = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly database: DatabaseService,
    private readonly discordService: DiscordService,
    private readonly githubApi: GithubApiService,
  ) {}

  /**
   * Poll every 30 seconds for GitHub activity.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollAllAreas(): Promise<void> {
    this.logger.log('Starting GitHub polling...');

    try {
      const service = await this.database.service.findUnique({
        where: { slug: 'github' },
        include: { actions: true },
      });

      if (!service) {
        this.logger.warn('GitHub service not found in database');
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
        this.logger.debug('No active GitHub areas found');
        return;
      }

      const areasByUserRepo = new Map<
        string,
        {
          owner: string;
          repo: string;
          userId: number;
          actionAreas: Map<GithubActionKey, typeof areas>;
        }
      >();

      for (const area of areas) {
        const config = this.parseConfig(area.actionConfig);
        if (!config) {
          this.logger.warn(
            `Area ${area.id} is missing owner/repo configuration`,
          );
          continue;
        }

        const actionKey = area.action.key;
        if (!this.isSupportedAction(actionKey)) {
          this.logger.warn(`Unsupported GitHub action key: ${actionKey}`);
          continue;
        }

        const repoKey = `${area.userId}:${config.owner}/${config.repo}`.toLowerCase();
        if (!areasByUserRepo.has(repoKey)) {
          areasByUserRepo.set(repoKey, {
            owner: config.owner,
            repo: config.repo,
            userId: area.userId,
            actionAreas: new Map(),
          });
        }

        const entry = areasByUserRepo.get(repoKey)!;
        if (!entry.actionAreas.has(actionKey)) {
          entry.actionAreas.set(actionKey, []);
        }

        entry.actionAreas.get(actionKey)!.push(area);
      }

      for (const repoEntry of areasByUserRepo.values()) {
        await this.processRepository(
          repoEntry.owner,
          repoEntry.repo,
          repoEntry.actionAreas,
          service.id,
          repoEntry.userId,
        );
      }

      this.logger.log('GitHub polling completed');
    } catch (error) {
      this.logger.error(`GitHub polling failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual fetch for testing purposes.
   */
  async manualFetch(
    owner: string,
    repo: string,
    userId: number,
    actionKey?: GithubActionKey,
  ): Promise<Record<string, GithubActivity[]>> {
    if (actionKey) {
      const activities = await this.fetchActivities(
        owner,
        repo,
        actionKey,
        userId,
      );
      return {
        [actionKey]: activities,
      };
    }

    const [issues, pullRequests, releases] = await Promise.all([
      this.fetchActivities(owner, repo, 'new_issue', userId),
      this.fetchActivities(owner, repo, 'new_pull_request', userId),
      this.fetchActivities(owner, repo, 'new_release', userId),
    ]);

    return {
      new_issue: issues,
      new_pull_request: pullRequests,
      new_release: releases,
    };
  }

  private parseConfig(config: unknown): { owner: string; repo: string } | null {
    if (!config || typeof config !== 'object') {
      return null;
    }

    const typed = config as GithubAreaConfig;
    if (!typed.owner || !typed.repo) {
      return null;
    }

    return {
      owner: String(typed.owner),
      repo: String(typed.repo),
    };
  }

  private isSupportedAction(key: string): key is GithubActionKey {
    return GITHUB_SUPPORTED_ACTIONS.includes(key as GithubActionKey);
  }

  private async processRepository(
    owner: string,
    repo: string,
    actionAreas: Map<GithubActionKey, any[]>,
    serviceId: number,
    userId: number,
  ): Promise<void> {
    this.logger.debug(
      `Processing GitHub repository ${owner}/${repo} for user ${userId}`,
    );

    const cache = new Map<GithubActionKey, GithubActivity[]>();

    const getActivities = async (
      actionKey: GithubActionKey,
    ): Promise<GithubActivity[]> => {
      if (!cache.has(actionKey)) {
        const activities = await this.fetchActivities(
          owner,
          repo,
          actionKey,
          userId,
        );
        cache.set(actionKey, activities);
      }
      return cache.get(actionKey)!;
    };

    for (const [actionKey, areas] of actionAreas.entries()) {
      let activities: GithubActivity[];
      try {
        activities = await getActivities(actionKey);
      } catch (error) {
        await this.handleGithubFetchError(error, areas, owner, repo);
        continue;
      }

      for (const activity of activities) {
        const existingEvent = await this.database.webhookEvent.findUnique({
          where: {
            serviceId_externalId: {
              serviceId,
              externalId: activity.dedupKey,
            },
          },
        });

        if (existingEvent) {
          continue;
        }

        const isRecent = this.isActivityRecent(activity);

        await this.database.webhookEvent.create({
          data: {
            serviceId,
            externalId: activity.dedupKey,
            payload: activity as any,
          },
        });

        if (!isRecent) {
          this.logger.debug(
            `Skipping ${activity.type} ${activity.dedupKey} created at ${activity.createdAt.toISOString()} (older than ${this.recentActivityThresholdMs / 60000} minutes)`,
          );
          continue;
        }

        await this.processActivityForAreas(areas, activity, serviceId);
      }
    }
  }

  private matchesActionCriteria(
    activity: GithubActivity,
    actionKey: GithubActionKey,
    config: GithubAreaConfig,
  ): boolean {
    switch (actionKey) {
      case 'new_issue':
      case 'new_pull_request':
      case 'new_release':
        return true;
      default:
        return false;
    }
  }

  private async handleGithubFetchError(
    error: unknown,
    areas: any[],
    owner: string,
    repo: string,
  ): Promise<void> {
    const message =
      error instanceof GithubTokenUnavailableError || error instanceof GithubApiError
        ? error.message
        : error instanceof Error
        ? error.message
        : 'Erreur inconnue lors de la récupération GitHub.';

    this.logger.error(
      `Failed to fetch GitHub data for ${owner}/${repo}: ${message}`,
    );

    for (const area of areas) {
      await this.database.areaLog.create({
        data: {
          areaId: area.id,
          status: AreaLogStatus.failure,
          error: message,
        },
      });
    }
  }

  private async processActivityForAreas(
    areas: any[],
    activity: GithubActivity,
    serviceId: number,
  ): Promise<void> {
    for (const area of areas) {
      const config = this.parseConfig(area.actionConfig);
      if (!config) {
        continue;
      }

      const matches = this.matchesActionCriteria(
        activity,
        area.action.key as GithubActionKey,
        area.actionConfig as GithubAreaConfig,
      );

      if (!matches) {
        continue;
      }

      try {
        await this.executeReaction(area, activity);
        await this.database.areaLog.create({
          data: {
            areaId: area.id,
            status: AreaLogStatus.success,
            payload: activity as any,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to execute reaction for area ${area.id}: ${error.message}`,
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

  private async executeReaction(area: any, activity: GithubActivity) {
    const reactionConfig = area.reactionConfig || {};
    const reactionServiceSlug = area.reaction?.service?.slug;

    if (reactionServiceSlug === 'discord') {
      const context = this.buildDiscordReactionContext(area, activity);
      await this.discordService.executeReaction(
        area.reaction.key,
        reactionConfig,
        context,
      );
      return;
    }

    switch (area.reaction.key) {
      case 'send_webhook':
        await this.sendWebhook(reactionConfig, activity);
        break;
      case 'log_activity':
        this.logger.warn(
          `Reaction log_activity is deprecated. Area ${area.id} should be migrated to a supported reaction.`,
        );
        this.logActivity(reactionConfig, activity);
        break;
      default:
        this.logger.warn(`Unknown reaction type: ${area.reaction.key}`);
    }
  }

  private buildDiscordReactionContext(
    area: any,
    activity: GithubActivity,
  ): DiscordReactionContext {
    return {
      source: 'github',
      areaId: area.id,
      activity: {
        actionKey: activity.actionKey,
        type: activity.type,
        owner: activity.owner,
        repo: activity.repo,
        repoUrl: `https://github.com/${activity.owner}/${activity.repo}`,
        title: activity.title,
        url: activity.url,
        author: activity.author ?? null,
        number: activity.number ?? null,
        body: activity.body ?? null,
        createdAt: activity.createdAt.toISOString(),
      },
      raw: activity,
    };
  }

  private async sendWebhook(
    config: any,
    activity: GithubActivity,
  ): Promise<void> {
    if (!config?.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    const isDiscordWebhook =
      typeof config.webhookUrl === 'string' &&
      config.webhookUrl.includes('discord') &&
      config.webhookUrl.includes('/api/webhooks');

    let payload: any;

    if (isDiscordWebhook) {
      const color =
        activity.type === 'issue'
          ? 0x0969da
          : activity.type === 'pull_request'
          ? 0x58a6ff
          : 0x2ea043;

      const description =
        config.includeBody === false || !activity.body
          ? undefined
          : this.truncate(activity.body, 1024);

      const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        {
          name: '📁 Repository',
          value: `${activity.owner}/${activity.repo}`,
          inline: true,
        },
        {
          name: '👤 Auteur',
          value: activity.author ?? 'Inconnu',
          inline: true,
        },
      ];

      if (activity.number !== undefined) {
        fields.push({
          name: '🔢 Numéro',
          value: `#${activity.number}`,
          inline: true,
        });
      }

      if (activity.extra?.tag) {
        fields.push({
          name: '🏷️ Tag',
          value: String(activity.extra.tag),
          inline: true,
        });
      }

      if (activity.extra?.draft !== undefined) {
        fields.push({
          name: '📝 Brouillon',
          value: activity.extra.draft ? 'Oui' : 'Non',
          inline: true,
        });
      }

      payload = {
        username: 'GitHub Bot',
        avatar_url:
          'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        embeds: [
          {
            title:
              activity.type === 'issue'
                ? 'Nouvelle issue'
                : activity.type === 'pull_request'
                ? 'Nouvelle pull request'
                : 'Nouvelle release',
            url: activity.url,
            description,
            color,
            fields,
            footer: {
              text: `GitHub · ${activity.actionKey}`,
              icon_url:
                'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            },
            timestamp: activity.createdAt.toISOString(),
          },
        ],
      };
    } else {
      payload = {
        repository: `${activity.owner}/${activity.repo}`,
        type: activity.type,
        actionKey: activity.actionKey,
        title: activity.title,
        url: activity.url,
        createdAt: activity.createdAt.toISOString(),
        author: activity.author,
        number: activity.number,
        body: config.includeBody === false ? undefined : activity.body,
        metadata: activity.extra,
      };
    }

    try {
      this.logger.debug(
        `Sending GitHub webhook payload: ${JSON.stringify(payload, null, 2)}`,
      );

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Webhook returned status ${response.status}: ${errorText}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
      throw error;
    }
  }

  private logActivity(config: any, activity: GithubActivity) {
    const logLevel =
      typeof config?.logLevel === 'string' ? config.logLevel : 'info';

    const message = [
      'GitHub reaction log_activity triggered',
      `${activity.owner}/${activity.repo}`,
      `${activity.type}${activity.number ? ` #${activity.number}` : ''}`,
      `-> ${activity.title}`,
    ].join(' - ');

    switch (logLevel) {
      case 'debug':
        this.logger.debug(message);
        this.logger.debug(
          `GitHub activity payload: ${JSON.stringify(
            {
              url: activity.url,
              author: activity.author,
              createdAt: activity.createdAt?.toISOString(),
              extra: activity.extra,
            },
            null,
            2,
          )}`,
        );
        break;
      case 'verbose':
        this.logger.verbose(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength - 3)}...`;
  }

  private isActivityRecent(activity: GithubActivity): boolean {
    if (!activity.createdAt) {
      return true;
    }

    const now = Date.now();
    const createdAt = activity.createdAt.getTime();
    return now - createdAt <= this.recentActivityThresholdMs;
  }

  private async fetchActivities(
    owner: string,
    repo: string,
    actionKey: GithubActionKey,
    userId: number,
  ): Promise<GithubActivity[]> {
    switch (actionKey) {
      case 'new_issue':
        return this.fetchIssues(owner, repo, userId);
      case 'new_pull_request':
        return this.fetchPullRequests(owner, repo, userId);
      case 'new_release':
        return this.fetchReleases(owner, repo, userId);
      default:
        return [];
    }
  }

  private async fetchIssues(
    owner: string,
    repo: string,
    userId: number,
  ): Promise<GithubActivity[]> {
    const url = `/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc&per_page=20`;
    const items = await this.githubApi.request<GithubIssue[]>({
      userId,
      url,
      context: `issues list for ${owner}/${repo}`,
    });

    return (items ?? [])
      .filter((item) => !item.pull_request)
      .map((item) => ({
        dedupKey: `github:${owner}/${repo}:issue:${item.id}`,
        actionKey: 'new_issue' as const,
        type: 'issue' as const,
        owner,
        repo,
        title: item.title,
        url: item.html_url,
        createdAt: new Date(item.created_at),
        author: item.user?.login,
        number: item.number,
        body: item.body ?? null,
        extra: {
          labels: (item.labels ?? []).map((label) =>
            typeof label === 'string' ? label : label?.name,
          ),
        },
      }));
  }

  private async fetchPullRequests(
    owner: string,
    repo: string,
    userId: number,
  ): Promise<GithubActivity[]> {
    const url = `/repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=20`;
    const items = await this.githubApi.request<GithubPullRequest[]>({
      userId,
      url,
      context: `pull request list for ${owner}/${repo}`,
    });

    return (items ?? []).map((item) => ({
      dedupKey: `github:${owner}/${repo}:pull:${item.id}`,
      actionKey: 'new_pull_request' as const,
      type: 'pull_request' as const,
      owner,
      repo,
      title: item.title,
      url: item.html_url,
      createdAt: new Date(item.created_at),
      author: item.user?.login,
      number: item.number,
      body: item.body ?? null,
      extra: {
        base: item.base?.ref,
        head: item.head?.ref,
        draft: item.draft ?? false,
        state: item.state,
      },
    }));
  }

  private async fetchReleases(
    owner: string,
    repo: string,
    userId: number,
  ): Promise<GithubActivity[]> {
    const url = `/repos/${owner}/${repo}/releases?per_page=20`;
    const items = await this.githubApi.request<GithubRelease[]>({
      userId,
      url,
      context: `releases list for ${owner}/${repo}`,
    });

    return (items ?? []).map((item) => ({
      dedupKey: `github:${owner}/${repo}:release:${item.id}`,
      actionKey: 'new_release' as const,
      type: 'release' as const,
      owner,
      repo,
      title: item.name || item.tag_name,
      url:
        item.html_url ??
        `https://github.com/${owner}/${repo}/releases/tag/${encodeURIComponent(item.tag_name)}`,
      createdAt: new Date(item.published_at || item.created_at || Date.now()),
      author: item.author?.login,
      number: undefined,
      body: item.body ?? null,
      extra: {
        tag: item.tag_name,
        draft: item.draft ?? false,
        prerelease: item.prerelease ?? false,
      },
    }));
  }

}
