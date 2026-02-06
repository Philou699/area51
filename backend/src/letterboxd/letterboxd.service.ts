import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Parser from 'rss-parser';
import { DatabaseService } from '../database/database.service';
import { AreaLogStatus } from '@prisma/client';

interface LetterboxdRSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  filmTitle?: string;
  filmYear?: string;
  memberRating?: string;
  watchedDate?: string;
  rewatch?: string;
}

export interface ParsedLetterboxdActivity {
  type: 'review' | 'diary' | 'watched' | 'list' | 'rating';
  filmTitle: string;
  filmYear?: number;
  rating?: number;
  reviewText?: string;
  watchedDate?: Date;
  letterboxdUrl: string;
  activityDate: Date;
  isRewatch?: boolean;
}

@Injectable()
export class LetterboxdService {
  private readonly logger = new Logger(LetterboxdService.name);
  private readonly parser: Parser;

  constructor(private readonly database: DatabaseService) {
    this.parser = new Parser({
      customFields: {
        item: [
          ['letterboxd:filmTitle', 'filmTitle'],
          ['letterboxd:filmYear', 'filmYear'],
          ['letterboxd:memberRating', 'memberRating'],
          ['letterboxd:watchedDate', 'watchedDate'],
          ['letterboxd:rewatch', 'rewatch'],
        ],
      },
    });
  }

  /**
   * Fetch RSS feed for a Letterboxd user
   */
  async fetchUserActivity(username: string): Promise<LetterboxdRSSItem[]> {
    const feedUrl = `https://letterboxd.com/${username}/rss/`;

    try {
      this.logger.debug(`Fetching RSS feed for user: ${username}`);
      const feed = await this.parser.parseURL(feedUrl);
      return feed.items as unknown as LetterboxdRSSItem[];
    } catch (error) {
      this.logger.error(
        `Failed to fetch RSS feed for ${username}: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Parse RSS item to structured activity
   */
  private parseActivity(item: LetterboxdRSSItem): ParsedLetterboxdActivity {
    const title = item.title || '';
    const filmTitle = item.filmTitle || '';
    const filmYear = item.filmYear
      ? parseInt(item.filmYear, 10)
      : undefined;
    const rating = item.memberRating
      ? parseFloat(item.memberRating)
      : undefined;
    const watchedDate = item.watchedDate
      ? new Date(item.watchedDate)
      : undefined;
    const isRewatch = item.rewatch === 'Yes';
    const reviewText = item.contentSnippet || item.content || '';

    // Determine activity type
    let type: ParsedLetterboxdActivity['type'] = 'watched';
    if (title.includes('review')) {
      type = 'review';
    } else if (title.includes('list')) {
      type = 'list';
    } else if (watchedDate) {
      type = 'diary';
    } else if (rating) {
      type = 'rating';
    }

    return {
      type,
      filmTitle,
      filmYear,
      rating,
      reviewText: reviewText.trim(),
      watchedDate,
      letterboxdUrl: item.link || '',
      activityDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      isRewatch,
    };
  }

  /**
   * Check if activity matches action criteria
   */
  private matchesActionCriteria(
    activity: ParsedLetterboxdActivity,
    actionKey: string,
    config: any,
  ): boolean {
    switch (actionKey) {
      case 'new_review':
        return activity.type === 'review' && !!activity.reviewText;

      case 'new_diary_entry':
        return activity.type === 'diary' && !!activity.watchedDate;

      case 'film_watched':
        return (
          (activity.type === 'watched' || activity.type === 'diary') &&
          !!activity.watchedDate
        );

      case 'new_list':
        return activity.type === 'list';

      case 'film_rated':
        if (!activity.rating) return false;
        if (config.minRating && activity.rating < config.minRating) {
          return false;
        }
        return true;

      default:
        return false;
    }
  }

  /**
   * Execute reaction for an area
   */
  private async executeReaction(
    area: any,
    activity: ParsedLetterboxdActivity,
  ): Promise<void> {
    const reactionConfig = area.reactionConfig || {};

    switch (area.reaction.key) {
      case 'send_webhook':
        await this.sendWebhook(reactionConfig, activity);
        break;

      case 'log_activity':
        this.logActivity(reactionConfig, activity);
        break;

      default:
        this.logger.warn(`Unknown reaction type: ${area.reaction.key}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(
    config: any,
    activity: ParsedLetterboxdActivity,
  ): Promise<void> {
    if (!config.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    // Check if webhook URL is for Discord
    const isDiscordWebhook = config.webhookUrl.includes('discord') && config.webhookUrl.includes('/api/webhooks');

    let payload: any;

    if (isDiscordWebhook) {
      // Format for Discord webhook with embeds
      const stars = activity.rating ? '⭐'.repeat(Math.floor(activity.rating)) : '';
      const halfStar = activity.rating && activity.rating % 1 !== 0 ? '½' : '';
      const ratingText = activity.rating ? `${stars}${halfStar} (${activity.rating}/5)` : 'Pas de note';

      const fields: any[] = [
        {
          name: '🎬 Film',
          value: activity.filmYear
            ? `${activity.filmTitle} (${activity.filmYear})`
            : activity.filmTitle || 'Titre inconnu',
          inline: false,
        },
        {
          name: '⭐ Note',
          value: ratingText,
          inline: true,
        },
        {
          name: '📅 Type',
          value: activity.type === 'diary' ? 'Journal'
                : activity.type === 'review' ? 'Critique'
                : activity.type === 'watched' ? 'Vu'
                : activity.type === 'list' ? 'Liste'
                : activity.type === 'rating' ? 'Note'
                : activity.type,
          inline: true,
        },
      ];

      if (activity.watchedDate) {
        fields.push({
          name: '📆 Date de visionnage',
          value: new Date(activity.watchedDate).toLocaleDateString('fr-FR'),
          inline: true,
        });
      }

      if (activity.isRewatch) {
        fields.push({
          name: '🔁 Statut',
          value: 'Revu',
          inline: true,
        });
      }

      if (config.includeReview !== false && activity.reviewText) {
        // Limiter la critique à 1024 caractères (limite Discord)
        const reviewPreview = activity.reviewText.length > 1024
          ? activity.reviewText.substring(0, 1021) + '...'
          : activity.reviewText;

        fields.push({
          name: '💬 Critique',
          value: reviewPreview,
          inline: false,
        });
      }

      payload = {
        username: 'Letterboxd Bot',
        avatar_url: 'https://a.ltrbxd.com/logos/letterboxd-logo-h-neg-rgb.png',
        embeds: [
          {
            title: `Nouvelle activité Letterboxd`,
            url: activity.letterboxdUrl,
            color: 0x00D735, // Letterboxd green
            fields: fields,
            footer: {
              text: 'Letterboxd',
              icon_url: 'https://a.ltrbxd.com/logos/letterboxd-logo-v-neg-rgb.png',
            },
            timestamp: activity.activityDate.toISOString(),
          },
        ],
      };
    } else {
      // Default format for generic webhooks
      payload = {
        type: activity.type,
        film: {
          title: activity.filmTitle,
          year: activity.filmYear,
          rating: activity.rating,
          url: activity.letterboxdUrl,
        },
        review: config.includeReview !== false ? activity.reviewText : undefined,
        watchedDate: activity.watchedDate,
        activityDate: activity.activityDate,
        isRewatch: activity.isRewatch,
      };
    }

    try {
      // Log payload for debugging
      this.logger.debug(
        `Sending webhook payload: ${JSON.stringify(payload, null, 2)}`,
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
        throw new Error(`Webhook returned status ${response.status}: ${errorText}`);
      }

      this.logger.debug(
        `Webhook sent successfully to ${config.webhookUrl} for ${activity.filmTitle}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log activity to console
   */
  private logActivity(
    config: any,
    activity: ParsedLetterboxdActivity,
  ): void {
    const logLevel = config.logLevel || 'info';
    const message = `Letterboxd Activity: ${activity.type} - ${activity.filmTitle} (${activity.filmYear}) ${activity.rating ? `★${activity.rating}` : ''}`;

    switch (logLevel) {
      case 'debug':
        this.logger.debug(message);
        break;
      case 'verbose':
        this.logger.verbose(message);
        break;
      default:
        this.logger.log(message);
    }
  }

  /**
   * Poll all active Letterboxd areas (runs every 30 seconds).
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollAllUserFeeds(): Promise<void> {
    this.logger.log('Starting Letterboxd RSS polling...');

    try {
      // Get Letterboxd service
      const service = await this.database.service.findUnique({
        where: { slug: 'letterboxd' },
        include: {
          actions: true,
        },
      });

      if (!service) {
        this.logger.warn('Letterboxd service not found in database');
        return;
      }

      // Get all active areas with Letterboxd actions
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

      this.logger.log(`Found ${areas.length} active Letterboxd areas`);

      // Group areas by username to avoid duplicate fetches
      const areasByUsername = new Map<string, typeof areas>();
      for (const area of areas) {
        const config = area.actionConfig as any;
        if (!config?.username) {
          this.logger.warn(`Area ${area.id} is missing username configuration`);
          continue;
        }

        const username = config.username;
        if (!areasByUsername.has(username)) {
          areasByUsername.set(username, []);
        }
        areasByUsername.get(username)!.push(area);
      }

      // Process each unique username
      for (const [username, userAreas] of areasByUsername.entries()) {
        await this.processUserFeed(username, userAreas, service.id);
      }

      this.logger.log('Letterboxd RSS polling completed');
    } catch (error) {
      this.logger.error(`RSS polling failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Process RSS feed for a specific user
   */
  private async processUserFeed(
    username: string,
    areas: any[],
    serviceId: number,
  ): Promise<void> {
    this.logger.debug(`Processing feed for user: ${username}`);

    const items = await this.fetchUserActivity(username);

    if (items.length === 0) {
      this.logger.debug(`No items found for ${username}`);
      return;
    }

    for (const item of items) {
      if (!item.link) continue;

      // Check if already processed (deduplication)
      const exists = await this.database.webhookEvent.findUnique({
        where: {
          serviceId_externalId: {
            serviceId,
            externalId: item.link,
          },
        },
      });

      if (exists) {
        continue; // Already processed
      }

      // Parse activity
      const activity = this.parseActivity(item);

      // Store webhook event
      await this.database.webhookEvent.create({
        data: {
          serviceId,
          externalId: item.link,
          payload: activity as any,
        },
      });

      // Check each area to see if it matches
      for (const area of areas) {
        const config = area.actionConfig as any;
        const matches = this.matchesActionCriteria(
          activity,
          area.action.key,
          config,
        );

        if (matches) {
          this.logger.log(
            `Triggering area ${area.id}: ${area.name} for ${activity.filmTitle}`,
          );

          try {
            await this.executeReaction(area, activity);

            // Log success
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

            // Log failure
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
    }
  }

  /**
   * Manual trigger for testing
   */
  async manualPoll(username: string): Promise<ParsedLetterboxdActivity[]> {
    const items = await this.fetchUserActivity(username);
    return items.map((item) => this.parseActivity(item));
  }
}
