import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import type { AboutResponseDto } from './app/dto/about-response.dto';

@Injectable()
export class AppService {
  constructor(private readonly database: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }


  async getAbout(): Promise<AboutResponseDto> {
    const currentTime = Math.floor(Date.now() / 1000);

    // Fetch services dynamically from database
    const services = await this.database.service.findMany({
      where: { enabled: true },
      include: {
        actions: {
          orderBy: { key: 'asc' },
        },
        reactions: {
          orderBy: { key: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedServices = services.map((service) => ({
      name: service.slug,
      actions: service.actions.map((action) => ({
        name: action.key,
        description: action.description || '',
      })),
      reactions: service.reactions.map((reaction) => ({
        name: reaction.key,
        description: reaction.description || '',
      })),
    }));
    return {
      client: {
        host: '127.0.0.1',
      },
      server: {
        current_time: currentTime,
        services: formattedServices,
      },
    };
  }
}
