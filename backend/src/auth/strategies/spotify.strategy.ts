import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';
import { DatabaseService } from '../../database/database.service';

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{
    url: string;
  }>;
  followers?: {
    total: number;
  };
}

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(private readonly database: DatabaseService) {
    super({
      authorizationURL: 'https://accounts.spotify.com/authorize',
      tokenURL: 'https://accounts.spotify.com/api/token',
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: process.env.SPOTIFY_CALLBACK_URL || 'http://localhost:8080/auth/spotify/callback',
      scope: [
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
      ].join(' '),
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    // Fetch user profile from Spotify API
    const userProfile = await this.fetchSpotifyProfile(accessToken);
    
    return {
      provider: 'spotify',
      providerId: userProfile.id,
      accessToken,
      refreshToken,
      profile: userProfile,
    };
  }

  private async fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Spotify profile: ${response.status}`);
    }

    return response.json();
  }
}
