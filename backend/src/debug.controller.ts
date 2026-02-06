import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('services')
  async getAllServices() {
    try {
      const services = await this.databaseService.service.findMany({
        include: {
          actions: true,
          reactions: true,
        },
      });

      return {
        success: true,
        count: services.length,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          actionsCount: service.actions.length,
          reactionsCount: service.reactions.length,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('spotify')
  async getSpotifyService() {
    try {
      // Test different variations
      const variations = ['spotify', 'Spotify', 'SPOTIFY'];
      const results = {};

      for (const name of variations) {
        const service = await this.databaseService.service.findFirst({
          where: { name },
          include: {
            actions: true,
            reactions: true,
          },
        });
        results[name] = service ? {
          id: service.id,
          name: service.name,
          actionsCount: service.actions.length,
          reactionsCount: service.reactions.length,
        } : null;
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
