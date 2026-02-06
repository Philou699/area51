import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AreaLogStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { DiscordService } from '../discord/discord.service';

export type SpotifyActionKey =
  | 'new_liked_song'
  | 'new_playlist_track'
  | 'now_playing_changed'
  | 'new_top_artist'
  | 'new_playlist_created';

export type SpotifyReactionKey =
  | 'add_to_playlist'
  | 'like_song'
  | 'create_playlist'
  | 'follow_artist'
  | 'send_webhook';

interface SpotifyAreaConfig {
  playlistId?: string;
  artistId?: string;
  trackId?: string;
  [key: string]: unknown;
}

interface SpotifyActivity {
  dedupKey: string;
  actionKey: SpotifyActionKey;
  type: 'track' | 'playlist' | 'artist' | 'playing';
  data: {
    id: string;
    name: string;
    uri?: string;
    external_urls?: {
      spotify: string;
    };
    artists?: Array<{
      id: string;
      name: string;
    }>;
    album?: {
      id: string;
      name: string;
      images: Array<{
        url: string;
      }>;
    };
    playlist?: {
      id: string;
      name: string;
      description?: string;
    };
  };
  timestamp: Date;
  userId: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
    }>;
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  tracks: {
    total: number;
  };
}

interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  genres: string[];
}

export const SPOTIFY_SUPPORTED_ACTIONS: SpotifyActionKey[] = [
  'new_liked_song',
  'new_playlist_track',
  'now_playing_changed',
  'new_top_artist',
  'new_playlist_created',
];

export const SPOTIFY_SUPPORTED_REACTIONS: SpotifyReactionKey[] = [
  'add_to_playlist',
  'like_song',
  'create_playlist',
  'follow_artist',
  'send_webhook',
];

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly spotifyApiBaseUrl = 'https://api.spotify.com/v1';

  constructor(
    private readonly database: DatabaseService,
    private readonly discordService: DiscordService,
  ) {}

  /**
   * Poll for Spotify activity - automated every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollAllAreas(): Promise<void> {
    this.logger.log('Starting Spotify polling...');

    try {
      const service = await this.database.service.findUnique({
        where: { slug: 'spotify' },
        include: { actions: true },
      });

      if (!service) {
        this.logger.warn('Spotify service not found in database');
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
        this.logger.debug('No active Spotify areas found');
        return;
      }

      // Group areas by user to avoid duplicate API calls
      const areasByUser = new Map<number, typeof areas>();
      for (const area of areas) {
        const userId = area.userId;
        if (!areasByUser.has(userId)) {
          areasByUser.set(userId, []);
        }
        areasByUser.get(userId)!.push(area);
      }

      for (const [userId, userAreas] of areasByUser.entries()) {
        await this.processUserAreas(userId, userAreas, service.id);
      }

      this.logger.log('Spotify polling completed');
    } catch (error) {
      this.logger.error(`Spotify polling failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual polling for testing
   */
  async manualPollUser(userId: number): Promise<any> {
    const service = await this.database.service.findUnique({
      where: { slug: 'spotify' },
    });

    if (!service) {
      throw new Error('Spotify service not found');
    }

    const areas = await this.database.area.findMany({
      where: {
        userId,
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
      },
    });

    return this.processUserAreas(userId, areas, service.id);
  }

  /**
   * Get user's Spotify profile
   */
  async getUserProfile(userId: number): Promise<any> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('No valid Spotify access token found');
    }

    const response = await this.makeSpotifyRequest('/me', accessToken);
    return response;
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(userId: number): Promise<SpotifyPlaylist[]> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('No valid Spotify access token found');
    }

    const response = await this.makeSpotifyRequest('/me/playlists?limit=50', accessToken);
    return response?.items || [];
  }

  /**
   * Get currently playing track
   */
  async getCurrentlyPlaying(userId: number): Promise<any> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('No valid Spotify access token found');
    }

    try {
      const response = await this.makeSpotifyRequest('/me/player/currently-playing', accessToken);
      return response;
    } catch (error) {
      // 204 No Content is normal when nothing is playing
      if (error.message.includes('204')) {
        return null;
      }
      throw error;
    }
  }

  private async processUserAreas(
    userId: number,
    areas: any[],
    serviceId: number,
  ): Promise<void> {
    this.logger.debug(`Processing Spotify areas for user ${userId}`);

    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      this.logger.warn(`No valid Spotify access token for user ${userId}`);
      return;
    }

    // Group areas by action type
    const actionAreasMap = new Map<SpotifyActionKey, any[]>();
    for (const area of areas) {
      const actionKey = area.action.key as SpotifyActionKey;
      if (SPOTIFY_SUPPORTED_ACTIONS.includes(actionKey)) {
        if (!actionAreasMap.has(actionKey)) {
          actionAreasMap.set(actionKey, []);
        }
        actionAreasMap.get(actionKey)!.push(area);
      }
    }

    // Process each action type
    for (const [actionKey, actionAreas] of actionAreasMap.entries()) {
      const activities = await this.fetchActivitiesByAction(userId, actionKey, accessToken);
      
      for (const activity of activities) {
        // Check if already processed
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

        // Store webhook event
        await this.database.webhookEvent.create({
          data: {
            serviceId,
            externalId: activity.dedupKey,
            payload: activity as any,
          },
        });

        // Execute reactions for matching areas
        for (const area of actionAreas) {
          if (this.matchesActionCriteria(activity, actionKey, area.actionConfig)) {
            try {
              await this.executeReaction(area, activity, accessToken);
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
      }
    }
  }

  private async fetchActivitiesByAction(
    userId: number,
    actionKey: SpotifyActionKey,
    accessToken: string,
  ): Promise<SpotifyActivity[]> {
    switch (actionKey) {
      case 'new_liked_song':
        return this.fetchLikedSongs(userId, accessToken);
      case 'new_playlist_track':
        return this.fetchPlaylistTracks(userId, accessToken);
      case 'now_playing_changed':
        return this.fetchCurrentPlaying(userId, accessToken);
      case 'new_top_artist':
        return this.fetchTopArtists(userId, accessToken);
      case 'new_playlist_created':
        return this.fetchUserPlaylists(userId, accessToken);
      default:
        return [];
    }
  }

  private async fetchLikedSongs(userId: number, accessToken: string): Promise<SpotifyActivity[]> {
    try {
      const response = await this.makeSpotifyRequest('/me/tracks?limit=20&offset=0', accessToken);
      
      if (!response?.items) {
        return [];
      }

      return response.items.map((item: any) => ({
        dedupKey: `spotify:${userId}:liked:${item.track.id}`,
        actionKey: 'new_liked_song' as const,
        type: 'track' as const,
        data: {
          id: item.track.id,
          name: item.track.name,
          uri: item.track.uri,
          external_urls: item.track.external_urls,
          artists: item.track.artists,
          album: item.track.album,
        },
        timestamp: new Date(item.added_at),
        userId,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch liked songs: ${error.message}`);
      return [];
    }
  }

  private async fetchPlaylistTracks(userId: number, accessToken: string): Promise<SpotifyActivity[]> {
    // Cette méthode nécessiterait de surveiller des playlists spécifiques
    // Pour l'instant, retournons un array vide
    return [];
  }

  private async fetchCurrentPlaying(userId: number, accessToken: string): Promise<SpotifyActivity[]> {
    try {
      const response = await this.getCurrentlyPlaying(userId);
      
      if (!response?.item) {
        return [];
      }

      return [{
        dedupKey: `spotify:${userId}:playing:${response.item.id}:${Date.now()}`,
        actionKey: 'now_playing_changed' as const,
        type: 'playing' as const,
        data: {
          id: response.item.id,
          name: response.item.name,
          uri: response.item.uri,
          external_urls: response.item.external_urls,
          artists: response.item.artists,
          album: response.item.album,
        },
        timestamp: new Date(),
        userId,
      }];
    } catch (error) {
      this.logger.error(`Failed to fetch currently playing: ${error.message}`);
      return [];
    }
  }

  private async fetchTopArtists(userId: number, accessToken: string): Promise<SpotifyActivity[]> {
    try {
      const response = await this.makeSpotifyRequest('/me/top/artists?limit=10&time_range=short_term', accessToken);
      
      if (!response?.items) {
        return [];
      }

      return response.items.map((artist: any, index: number) => ({
        dedupKey: `spotify:${userId}:top_artist:${artist.id}:${new Date().toISOString().split('T')[0]}`,
        actionKey: 'new_top_artist' as const,
        type: 'artist' as const,
        data: {
          id: artist.id,
          name: artist.name,
          uri: artist.uri,
          external_urls: artist.external_urls,
        },
        timestamp: new Date(),
        userId,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch top artists: ${error.message}`);
      return [];
    }
  }

  private async fetchUserPlaylists(userId: number, accessToken: string): Promise<SpotifyActivity[]> {
    try {
      const response = await this.makeSpotifyRequest('/me/playlists?limit=50', accessToken);
      
      if (!response?.items) {
        return [];
      }

      // Filtrer seulement les playlists créées par l'utilisateur (pas celles qu'il suit)
      const userPlaylists = response.items.filter((playlist: any) => 
        playlist.owner && playlist.owner.id && playlist.collaborative === false
      );

      return userPlaylists.map((playlist: any) => ({
        dedupKey: `spotify:${userId}:playlist:${playlist.id}`,
        actionKey: 'new_playlist_created' as const,
        type: 'playlist' as const,
        data: {
          id: playlist.id,
          name: playlist.name,
          uri: playlist.uri,
          external_urls: playlist.external_urls,
          playlist: {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
          },
        },
        timestamp: new Date(),
        userId,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch user playlists: ${error.message}`);
      return [];
    }
  }

  private matchesActionCriteria(
    activity: SpotifyActivity,
    actionKey: SpotifyActionKey,
    config: SpotifyAreaConfig,
  ): boolean {
    // Ici vous pouvez ajouter des filtres basés sur la config
    // Par exemple, filtrer par artiste, genre, etc.
    return true;
  }

  private async executeReaction(
    area: any,
    activity: SpotifyActivity,
    accessToken: string,
  ): Promise<void> {
    const reactionConfig = area.reactionConfig || {};
    const reactionKey = area.reaction.key as SpotifyReactionKey;
    const reactionServiceSlug = area.reaction?.service?.slug;

    if (reactionServiceSlug === 'discord') {
      await this.discordService.executeReaction(
        reactionKey,
        reactionConfig,
        {
          source: 'spotify',
          areaId: area.id,
          activity: {
            actionKey: activity.actionKey,
            type: activity.type,
            name: activity.data.name,
            url: activity.data.external_urls?.spotify ?? null,
            artists: activity.data.artists?.map((artist) => ({
              id: artist.id,
              name: artist.name,
            })),
            album: activity.data.album
              ? {
                  id: activity.data.album.id,
                  name: activity.data.album.name,
                  image: activity.data.album.images?.[0]?.url ?? null,
                }
              : null,
            playlist: activity.data.playlist ?? null,
            timestamp: activity.timestamp.toISOString(),
          },
          raw: activity,
        },
      );
      return;
    }

    switch (reactionKey) {
      case 'add_to_playlist':
        await this.addToPlaylist(reactionConfig, activity, accessToken);
        break;
      case 'like_song':
        await this.likeSong(reactionConfig, activity, accessToken);
        break;
      case 'create_playlist':
        await this.createPlaylist(reactionConfig, activity, accessToken);
        break;
      case 'follow_artist':
        await this.followArtist(reactionConfig, activity, accessToken);
        break;
      case 'send_webhook':
        await this.sendWebhook(reactionConfig, activity);
        break;
      default:
        this.logger.warn(`Unknown Spotify reaction type: ${reactionKey}`);
    }
  }

  private async addToPlaylist(config: any, activity: SpotifyActivity, accessToken: string): Promise<void> {
    if (!config.playlistId) {
      throw new Error('Playlist ID is required');
    }

    if (activity.type !== 'track') {
      throw new Error('Can only add tracks to playlist');
    }

    const trackUri = activity.data.uri;
    if (!trackUri) {
      throw new Error('Track URI is required');
    }

    await this.makeSpotifyRequest(
      `/playlists/${config.playlistId}/tracks`,
      accessToken,
      'POST',
      {
        uris: [trackUri],
      }
    );
  }

  private async likeSong(config: any, activity: SpotifyActivity, accessToken: string): Promise<void> {
    if (activity.type !== 'track') {
      throw new Error('Can only like tracks');
    }

    await this.makeSpotifyRequest(
      `/me/tracks`,
      accessToken,
      'PUT',
      {
        ids: [activity.data.id],
      }
    );
  }

  private async createPlaylist(config: any, activity: SpotifyActivity, accessToken: string): Promise<void> {
    const playlistName = config.playlistName || `New Playlist - ${new Date().toISOString()}`;
    const description = config.description || 'Created by AREA automation';

    const userProfile = await this.makeSpotifyRequest('/me', accessToken);
    const userId = userProfile.id;

    await this.makeSpotifyRequest(
      `/users/${userId}/playlists`,
      accessToken,
      'POST',
      {
        name: playlistName,
        description,
        public: config.public || false,
      }
    );
  }

  private async followArtist(config: any, activity: SpotifyActivity, accessToken: string): Promise<void> {
    if (activity.type !== 'artist' && !activity.data.artists) {
      throw new Error('Artist information is required');
    }

    let artistId: string;
    if (activity.type === 'artist') {
      artistId = activity.data.id;
    } else if (activity.data.artists && activity.data.artists.length > 0) {
      artistId = activity.data.artists[0].id;
    } else {
      throw new Error('No artist ID found');
    }

    await this.makeSpotifyRequest(
      `/me/following?type=artist&ids=${artistId}`,
      accessToken,
      'PUT'
    );
  }

  private async sendWebhook(config: any, activity: SpotifyActivity): Promise<void> {
    if (!config.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    const isDiscordWebhook = config.webhookUrl.includes('discord') && config.webhookUrl.includes('/api/webhooks');

    let payload: any;

    if (isDiscordWebhook) {
      const embed = this.createDiscordEmbed(activity);
      payload = {
        username: 'Spotify Bot',
        avatar_url: 'https://developer.spotify.com/assets/branding-guidelines/icon1@2x.png',
        embeds: [embed],
      };
    } else {
      payload = {
        service: 'spotify',
        action: activity.actionKey,
        type: activity.type,
        data: activity.data,
        timestamp: activity.timestamp.toISOString(),
      };
    }

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
  }

  private createDiscordEmbed(activity: SpotifyActivity): any {
    const colors = {
      track: 0x1db954, // Spotify green
      playlist: 0x1ed760,
      artist: 0x191414,
      playing: 0x1db954,
    };

    let title: string;
    let description: string;
    let fields: any[] = [];

    switch (activity.actionKey) {
      case 'new_liked_song':
        title = '💚 Nouvelle chanson aimée';
        description = `**${activity.data.name}**`;
        if (activity.data.artists) {
          fields.push({
            name: '🎤 Artiste(s)',
            value: activity.data.artists.map(a => a.name).join(', '),
            inline: true,
          });
        }
        if (activity.data.album) {
          fields.push({
            name: '💿 Album',
            value: activity.data.album.name,
            inline: true,
          });
        }
        break;

      case 'now_playing_changed':
        title = '🎵 Lecture en cours';
        description = `**${activity.data.name}**`;
        if (activity.data.artists) {
          fields.push({
            name: '🎤 Artiste(s)',
            value: activity.data.artists.map(a => a.name).join(', '),
            inline: true,
          });
        }
        break;

      case 'new_top_artist':
        title = '⭐ Nouvel artiste top';
        description = `**${activity.data.name}**`;
        break;

      case 'new_playlist_created':
        title = '📝 Nouvelle playlist créée';
        description = `**${activity.data.name}**`;
        if (activity.data.playlist?.description) {
          fields.push({
            name: '📋 Description',
            value: activity.data.playlist.description,
            inline: false,
          });
        }
        break;

      default:
        title = '🎵 Activité Spotify';
        description = activity.data.name;
    }

    return {
      title,
      description,
      color: colors[activity.type] || colors.track,
      fields,
      footer: {
        text: 'Spotify',
        icon_url: 'https://developer.spotify.com/assets/branding-guidelines/icon1@2x.png',
      },
      timestamp: activity.timestamp.toISOString(),
      url: activity.data.external_urls?.spotify,
    };
  }

  private async getValidAccessToken(userId: number): Promise<string | null> {
    const providerAccount = await this.database.providerAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'spotify',
        },
      },
    });

    if (!providerAccount) {
      return null;
    }

    // Check if token is expired
    if (providerAccount.expiresAt && providerAccount.expiresAt <= new Date()) {
      // Try to refresh token
      if (providerAccount.refreshToken) {
        try {
          const newTokens = await this.refreshSpotifyToken(providerAccount.refreshToken);
          
          // Update database with new tokens
          await this.database.providerAccount.update({
            where: {
              id: providerAccount.id,
            },
            data: {
              accessToken: newTokens.access_token,
              expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
              refreshToken: newTokens.refresh_token || providerAccount.refreshToken,
            },
          });

          return newTokens.access_token;
        } catch (error) {
          this.logger.error(`Failed to refresh Spotify token: ${error.message}`);
          return null;
        }
      }
      return null;
    }

    return providerAccount.accessToken;
  }

  private async refreshSpotifyToken(refreshToken: string): Promise<any> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify client credentials not configured');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    return response.json();
  }

  private async makeSpotifyRequest(
    endpoint: string,
    accessToken: string,
    method: string = 'GET',
    body?: any,
  ): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.spotifyApiBaseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 204) {
        return null; // No content
      }
      const errorText = await response.text();
      throw new Error(`Spotify API error: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return null;
  }
}
