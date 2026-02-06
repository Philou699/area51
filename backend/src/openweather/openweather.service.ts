import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AreaLogStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { DiscordService } from '../discord/discord.service';

export type OpenweatherActionKey = 'temperature_below_x' | 'weather_condition_is';

interface OpenweatherAreaConfig {
  city?: string;
  threshold?: number; // For temperature_below_x
  condition?: string; // For weather_condition_is
  [key: string]: unknown;
}

export interface WeatherData {
  city: string;
  temperature: number; // in Celsius
  condition: string; // e.g., "Clear", "Rain", "Snow", "Clouds"
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

interface WeatherActivity {
  dedupKey: string;
  actionKey: OpenweatherActionKey;
  city: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

export const OPENWEATHER_SUPPORTED_ACTIONS: OpenweatherActionKey[] = [
  'temperature_below_x',
  'weather_condition_is',
];

@Injectable()
export class OpenweatherService {
  private readonly logger = new Logger(OpenweatherService.name);
  private readonly apiBaseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly apiKey = process.env.OPENWEATHER_API_KEY;

  constructor(
    private readonly database: DatabaseService,
    private readonly discordService: DiscordService,
  ) {
    if (!this.apiKey) {
      this.logger.warn(
        'OPENWEATHER_API_KEY is not set. OpenWeather service will not work properly.',
      );
    }
  }

  /**
   * Poll every 30 seconds for weather updates.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollAllAreas(): Promise<void> {
    this.logger.log('Starting OpenWeather polling...');

    if (!this.apiKey) {
      this.logger.warn('Skipping OpenWeather polling: API key not configured');
      return;
    }

    try {
      const service = await this.database.service.findUnique({
        where: { slug: 'openweather' },
        include: { actions: true },
      });

      if (!service) {
        this.logger.warn('OpenWeather service not found in database');
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
        this.logger.debug('No active OpenWeather areas found');
        return;
      }

      // Group areas by city to minimize API calls
      const areasByCity = new Map<string, typeof areas>();

      for (const area of areas) {
        const config = this.parseConfig(area.actionConfig);
        if (!config?.city) {
          this.logger.warn(
            `Area ${area.id} is missing city configuration`,
          );
          continue;
        }

        const city = config.city.toLowerCase();
        if (!areasByCity.has(city)) {
          areasByCity.set(city, []);
        }
        areasByCity.get(city)!.push(area);
      }

      // Process each unique city
      for (const [city, cityAreas] of areasByCity.entries()) {
        await this.processCity(city, cityAreas, service.id);
      }

      this.logger.log('OpenWeather polling completed');
    } catch (error) {
      this.logger.error(
        `OpenWeather polling failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Fetch current weather data from OpenWeatherMap API
   */
  async fetchCurrentWeather(city: string): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('OpenWeather API key is not configured');
    }

    const url = `${this.apiBaseUrl}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${this.apiKey}`;

    try {
      this.logger.debug(`Fetching weather for city: ${city}`);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenWeather API returned status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();

      return {
        city: data.name || city,
        temperature: Math.round(data.main.temp * 10) / 10, // Round to 1 decimal
        condition: data.weather[0]?.main || 'Unknown',
        description: data.weather[0]?.description || 'Unknown',
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch weather for ${city}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Manual fetch for testing purposes
   */
  async manualFetch(city: string): Promise<WeatherData> {
    return this.fetchCurrentWeather(city);
  }

  private parseConfig(config: unknown): OpenweatherAreaConfig | null {
    if (!config || typeof config !== 'object') {
      return null;
    }

    const typed = config as OpenweatherAreaConfig;
    if (!typed.city) {
      return null;
    }

    return typed;
  }

  private async processCity(
    city: string,
    areas: any[],
    serviceId: number,
  ): Promise<void> {
    this.logger.debug(`Processing weather for city: ${city}`);

    try {
      const weather = await this.fetchCurrentWeather(city);

      // Create a unique identifier for this weather snapshot
      const timestamp = weather.timestamp.getTime();
      const dedupKey = `openweather:${city.toLowerCase()}:${timestamp}`;

      // Check if we already processed this exact snapshot
      const existingEvent = await this.database.webhookEvent.findUnique({
        where: {
          serviceId_externalId: {
            serviceId,
            externalId: dedupKey,
          },
        },
      });

      if (existingEvent) {
        this.logger.debug(`Weather snapshot already processed for ${city}`);
        return;
      }

      // Store the weather event
      await this.database.webhookEvent.create({
        data: {
          serviceId,
          externalId: dedupKey,
          payload: weather as any,
        },
      });

      // Check each area to see if it matches
      for (const area of areas) {
        const config = this.parseConfig(area.actionConfig);
        if (!config) {
          continue;
        }

        const matches = this.matchesActionCriteria(
          weather,
          area.action.key as OpenweatherActionKey,
          config,
        );

        if (matches) {
          this.logger.log(
            `Triggering area ${area.id}: ${area.name} for ${weather.city} - ${weather.temperature}°C, ${weather.condition}`,
          );

          const activity: WeatherActivity = {
            dedupKey,
            actionKey: area.action.key as OpenweatherActionKey,
            city: weather.city,
            temperature: weather.temperature,
            condition: weather.condition,
            description: weather.description,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            timestamp: weather.timestamp,
          };

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
    } catch (error) {
      this.logger.error(
        `Failed to process city ${city}: ${error.message}`,
      );
    }
  }

  private matchesActionCriteria(
    weather: WeatherData,
    actionKey: OpenweatherActionKey,
    config: OpenweatherAreaConfig,
  ): boolean {
    switch (actionKey) {
      case 'temperature_below_x':
        if (config.threshold === undefined) {
          this.logger.warn('temperature_below_x: threshold not configured');
          return false;
        }
        return weather.temperature < config.threshold;

      case 'weather_condition_is':
        if (!config.condition) {
          this.logger.warn('weather_condition_is: condition not configured');
          return false;
        }
        // Case-insensitive comparison
        return (
          weather.condition.toLowerCase() === config.condition.toLowerCase()
        );

      default:
        return false;
    }
  }

  private async executeReaction(area: any, activity: WeatherActivity) {
    const reactionConfig = area.reactionConfig || {};
    const reactionServiceSlug = area.reaction?.service?.slug;

    if (reactionServiceSlug === 'discord') {
      await this.discordService.executeReaction(
        area.reaction.key,
        reactionConfig,
        {
          source: 'openweather',
          areaId: area.id,
          activity: {
            city: activity.city,
            temperature: activity.temperature,
            condition: activity.condition,
            description: activity.description,
            humidity: activity.humidity,
            windSpeed: activity.windSpeed,
            timestamp: activity.timestamp.toISOString(),
          },
          raw: activity,
        },
      );
      return;
    }

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

  private async sendWebhook(
    config: any,
    activity: WeatherActivity,
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
      // Discord-specific formatting with embeds
      const color =
        activity.temperature < 10
          ? 0x3498db // Blue for cold
          : activity.temperature < 25
          ? 0x2ecc71 // Green for mild
          : 0xe74c3c; // Red for hot

      const tempEmoji = activity.temperature < 10 ? '❄️' : activity.temperature < 25 ? '🌤️' : '🔥';
      const conditionEmoji = this.getConditionEmoji(activity.condition);

      const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        {
          name: '🌡️ Température',
          value: `${tempEmoji} ${activity.temperature}°C`,
          inline: true,
        },
        {
          name: '☁️ Conditions',
          value: `${conditionEmoji} ${activity.description}`,
          inline: true,
        },
        {
          name: '💧 Humidité',
          value: `${activity.humidity}%`,
          inline: true,
        },
        {
          name: '💨 Vent',
          value: `${activity.windSpeed} m/s`,
          inline: true,
        },
      ];

      payload = {
        username: 'OpenWeather Bot',
        avatar_url: 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png',
        embeds: [
          {
            title: `🌍 Météo à ${activity.city}`,
            color,
            fields,
            footer: {
              text: 'OpenWeatherMap',
              icon_url:
                'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png',
            },
            timestamp: activity.timestamp.toISOString(),
          },
        ],
      };
    } else {
      // Generic webhook format
      payload = {
        city: activity.city,
        temperature: activity.temperature,
        temperatureUnit: 'Celsius',
        condition: activity.condition,
        description: activity.description,
        humidity: activity.humidity,
        windSpeed: activity.windSpeed,
        timestamp: activity.timestamp.toISOString(),
        actionKey: activity.actionKey,
      };
    }

    try {
      this.logger.debug(
        `Sending OpenWeather webhook payload: ${JSON.stringify(payload, null, 2)}`,
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

      this.logger.debug(
        `Webhook sent successfully for ${activity.city}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
      throw error;
    }
  }

  private logActivity(config: any, activity: WeatherActivity) {
    const logLevel = config?.logLevel ?? 'info';
    const message = `OpenWeather: ${activity.city} - ${activity.temperature}°C, ${activity.condition}`;

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

  private getConditionEmoji(condition: string): string {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm'))
      return '⛈️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist'))
      return '🌫️';
    if (conditionLower.includes('drizzle')) return '🌦️';
    return '🌤️';
  }
}
