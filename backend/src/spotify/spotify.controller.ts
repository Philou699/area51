import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  /**
   * Manual polling endpoint for testing
   */
  @Get('poll')
  @UseGuards(JwtAuthGuard)
  async manualPoll(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.spotifyService.manualPollUser(userId);
  }

  /**
   * Get user's Spotify profile info
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.spotifyService.getUserProfile(userId);
  }

  /**
   * Get user's playlists
   */
  @Get('playlists')
  @UseGuards(JwtAuthGuard)
  async getPlaylists(@Req() req: Request): Promise<any[]> {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.spotifyService.getUserPlaylists(userId);
  }

  /**
   * Get user's currently playing track
   */
  @Get('now-playing')
  @UseGuards(JwtAuthGuard)
  async getNowPlaying(@Req() req: Request) {
    const userId = req.user?.['sub'];
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.spotifyService.getCurrentlyPlaying(userId);
  }

  /**
   * Manual trigger for Spotify polling (for testing)
   */
  @Get('trigger-poll')
  async triggerManualPoll() {
    try {
      await this.spotifyService.pollAllAreas();
      return {
        success: true,
        message: 'Manual Spotify polling triggered successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
