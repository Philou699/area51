import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { DatabaseService } from '../database/database.service';
import * as fs from 'fs';
import * as path from 'path';

interface TunnelInfo {
  name: string;
  port: number;
  url?: string;
  process?: ChildProcess;
}

@Injectable()
export class TunnelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TunnelService.name);
  private tunnels: Map<string, TunnelInfo> = new Map();
  private ngrokPath: string;
  private configPath: string;

  constructor(private readonly databaseService: DatabaseService) {
    this.ngrokPath = path.join(process.cwd(), '..', 'ngrok');
    this.configPath = path.join(process.cwd(), '..', 'ngrok.yml');
  }

  async onModuleInit() {
    this.logger.log('Initializing Tunnel Service...');
    
    // Vérifier si les tunnels sont activés
    const enableTunnels = process.env.ENABLE_TUNNELS === 'true';
    
    if (enableTunnels) {
      this.logger.log('Tunnels enabled, starting setup...');
      await this.setupNgrok();
      await this.startTunnels();
    } else {
      this.logger.log('Tunnels disabled via ENABLE_TUNNELS environment variable');
    }
  }

  async onModuleDestroy() {
    this.logger.log('Stopping all tunnels...');
    await this.stopAllTunnels();
  }

  private async setupNgrok() {
    // Vérifier si ngrok est disponible
    const ngrokArchive = path.join(process.cwd(), '..', 'ngrok-v3-stable-linux-amd64.tgz');
    
    if (!fs.existsSync(this.ngrokPath) && fs.existsSync(ngrokArchive)) {
      this.logger.log('Extracting ngrok...');
      await this.extractNgrok(ngrokArchive);
    }

    // Créer le fichier de configuration ngrok
    await this.createNgrokConfig();
  }

  private async extractNgrok(archivePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-xzf', archivePath, '-C', path.dirname(this.ngrokPath)]);
      
      tar.on('close', (code) => {
        if (code === 0) {
          // Rendre ngrok exécutable
          fs.chmodSync(this.ngrokPath, '755');
          this.logger.log('Ngrok extracted successfully');
          resolve();
        } else {
          reject(new Error(`Failed to extract ngrok: ${code}`));
        }
      });
    });
  }

  private async createNgrokConfig() {
    const config = `
version: "2"
authtoken: ${process.env.NGROK_AUTHTOKEN || ''}
tunnels:
  backend:
    proto: http
    addr: 8080
  frontend:
    proto: http
    addr: 8081
`;

    fs.writeFileSync(this.configPath, config);
    this.logger.log('Ngrok config created');
  }

  private async startTunnels() {
    const tunnelsToStart = [
      { name: 'backend', port: 8080 },
      { name: 'frontend', port: 8081 }
    ];

    for (const tunnel of tunnelsToStart) {
      await this.startTunnel(tunnel.name, tunnel.port);
    }

    // Attendre un peu que les tunnels se lancent
    setTimeout(() => {
      this.updateTunnelUrls();
    }, 5000);
  }

  private async startTunnel(name: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Starting ${name} tunnel on port ${port}...`);

      const process = spawn(this.ngrokPath, [
        'http',
        `--config=${this.configPath}`,
        `--name=${name}`,
        port.toString()
      ]);

      const tunnelInfo: TunnelInfo = {
        name,
        port,
        process
      };

      process.stdout?.on('data', (data) => {
        const output = data.toString();
        this.logger.debug(`${name} tunnel output: ${output}`);
        
        // Extraire l'URL du tunnel depuis la sortie ngrok
        const urlMatch = output.match(/https:\/\/[\w-]+\.ngrok-free\.app/);
        if (urlMatch) {
          tunnelInfo.url = urlMatch[0];
          this.logger.log(`${name} tunnel URL: ${tunnelInfo.url}`);
          if (tunnelInfo.url) {
            this.updateEnvironmentUrls(name, tunnelInfo.url);
          }
        }
      });

      process.stderr?.on('data', (data) => {
        this.logger.error(`${name} tunnel error: ${data.toString()}`);
      });

      process.on('close', (code) => {
        this.logger.warn(`${name} tunnel closed with code ${code}`);
        // Redémarrer le tunnel après 5 secondes
        setTimeout(() => {
          this.startTunnel(name, port);
        }, 5000);
      });

      this.tunnels.set(name, tunnelInfo);
      resolve();
    });
  }

  private async updateTunnelUrls() {
    try {
      // Obtenir les URLs des tunnels via l'API ngrok
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('http://localhost:4040/api/tunnels');
      const data = await response.json() as any;

      if (data.tunnels) {
        for (const tunnel of data.tunnels) {
          const tunnelInfo = this.tunnels.get(tunnel.name);
          if (tunnelInfo && tunnel.public_url) {
            tunnelInfo.url = tunnel.public_url;
            this.logger.log(`Updated ${tunnel.name} URL: ${tunnel.public_url}`);
            await this.updateEnvironmentUrls(tunnel.name, tunnel.public_url);
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to update tunnel URLs:', error);
    }
  }

  private async updateEnvironmentUrls(tunnelName: string, url: string) {
    try {
      // Mettre à jour les URLs dans la base de données pour les callbacks OAuth
      if (tunnelName === 'backend') {
        await this.updateOAuthCallbacks(url);
      }
      
      // Vous pouvez aussi stocker les URLs dans la base de données
      await this.databaseService.upsertTunnelUrl(tunnelName, url);
      
    } catch (error) {
      this.logger.error('Failed to update environment URLs:', error);
    }
  }

  private async updateOAuthCallbacks(backendUrl: string) {
    // Mettre à jour les variables d'environnement OAuth en temps réel
    process.env.SPOTIFY_CALLBACK_URL = `${backendUrl}/auth/spotify/callback`;
    process.env.GITHUB_OAUTH_REDIRECT_URI = `${backendUrl.replace('8080', '8081')}/connections/github/callback`;
    
    this.logger.log(`Updated OAuth callbacks: Spotify=${process.env.SPOTIFY_CALLBACK_URL}`);
  }

  async getTunnelUrl(name: string): Promise<string | undefined> {
    const tunnel = this.tunnels.get(name);
    return tunnel?.url;
  }

  async getAllTunnels(): Promise<Array<{ name: string; port: number; url?: string }>> {
    return Array.from(this.tunnels.values()).map(tunnel => ({
      name: tunnel.name,
      port: tunnel.port,
      url: tunnel.url
    }));
  }

  private async stopAllTunnels() {
    for (const [name, tunnel] of this.tunnels) {
      if (tunnel.process) {
        this.logger.log(`Stopping ${name} tunnel...`);
        tunnel.process.kill();
      }
    }
    this.tunnels.clear();
  }

  async restartTunnel(name: string): Promise<void> {
    const tunnel = this.tunnels.get(name);
    if (tunnel) {
      if (tunnel.process) {
        tunnel.process.kill();
      }
      await this.startTunnel(name, tunnel.port);
    }
  }
}
