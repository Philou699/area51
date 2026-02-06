import { Controller, Get, Post, Param } from '@nestjs/common';
import { TunnelService } from './tunnel.service';
import { OAuthUpdateService } from './oauth-update.service';

@Controller('tunnels')
export class TunnelController {
  constructor(
    private readonly tunnelService: TunnelService,
    private readonly oauthUpdateService: OAuthUpdateService,
  ) {}

  @Get()
  async getAllTunnels() {
    return this.tunnelService.getAllTunnels();
  }

  @Get(':name')
  async getTunnelUrl(@Param('name') name: string) {
    const url = await this.tunnelService.getTunnelUrl(name);
    return { name, url };
  }

  @Post(':name/restart')
  async restartTunnel(@Param('name') name: string) {
    await this.tunnelService.restartTunnel(name);
    return { message: `Tunnel ${name} restarted` };
  }

  @Get('oauth/urls')
  async getOAuthUrls() {
    return this.oauthUpdateService.getCurrentUrls();
  }

  @Post('oauth/update')
  async updateOAuthUrls() {
    return this.oauthUpdateService.updateOAuthUrls();
  }

  @Get('status')
  async getTunnelStatus() {
    const tunnels = await this.tunnelService.getAllTunnels();
    const oauthUrls = this.oauthUpdateService.getCurrentUrls();
    
    return {
      tunnels,
      oauth: oauthUrls,
      timestamp: new Date().toISOString(),
    };
  }
}
