import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TunnelService } from '../tunnel/tunnel.service';

@Injectable()
export class OAuthUpdateService {
  private readonly logger = new Logger(OAuthUpdateService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tunnelService: TunnelService,
  ) {}

  async updateOAuthUrls() {
    try {
      const backendUrl = await this.tunnelService.getTunnelUrl('backend');
      const frontendUrl = await this.tunnelService.getTunnelUrl('frontend');

      if (backendUrl && frontendUrl) {
        // Mettre à jour les URLs Spotify
        const spotifyCallbackUrl = `${backendUrl}/auth/spotify/callback`;
        process.env.SPOTIFY_CALLBACK_URL = spotifyCallbackUrl;

        // Mettre à jour les URLs GitHub
        const githubRedirectUri = `${frontendUrl}/connections/github/callback`;
        process.env.GITHUB_OAUTH_REDIRECT_URI = githubRedirectUri;
        process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI = githubRedirectUri;

        // Mettre à jour l'URL du frontend
        process.env.FRONTEND_URL = frontendUrl;

        this.logger.log(`OAuth URLs updated:`);
        this.logger.log(`- Spotify callback: ${spotifyCallbackUrl}`);
        this.logger.log(`- GitHub redirect: ${githubRedirectUri}`);
        this.logger.log(`- Frontend URL: ${frontendUrl}`);

        return {
          success: true,
          urls: {
            backend: backendUrl,
            frontend: frontendUrl,
            spotifyCallback: spotifyCallbackUrl,
            githubRedirect: githubRedirectUri,
          },
        };
      } else {
        this.logger.warn('Tunnel URLs not available yet');
        return { success: false, message: 'Tunnel URLs not available' };
      }
    } catch (error) {
      this.logger.error('Failed to update OAuth URLs:', error);
      return { success: false, error: error.message };
    }
  }

  getCurrentUrls() {
    return {
      spotifyCallback: process.env.SPOTIFY_CALLBACK_URL,
      githubRedirect: process.env.GITHUB_OAUTH_REDIRECT_URI,
      frontendUrl: process.env.FRONTEND_URL,
    };
  }
}
