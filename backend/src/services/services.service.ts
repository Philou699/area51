import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ServicesService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Return all enabled services with their actions and reactions.
   */
  async findAvailable(userId?: number) {
    const servicesPromise = this.database.service.findMany({
      where: { enabled: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      include: {
        actions: {
          orderBy: [{ key: 'asc' }],
        },
        reactions: {
          orderBy: [{ key: 'asc' }],
        },
      },
    });

    const [services, providerAccounts] = await Promise.all([
      servicesPromise,
      userId
        ? this.database.providerAccount.findMany({
            where: { userId },
          })
        : Promise.resolve([]),
    ]);

    const connectedProviders = new Set(
      providerAccounts.map((account) => account.provider),
    );

    return services.map((service) => {
      const providerKey = this.mapSlugToProvider(service.slug);
      const requiresConnection = Boolean(providerKey);
      const isConnected =
        !requiresConnection ||
        (providerKey ? connectedProviders.has(providerKey) : false);

      return {
        id: service.id,
        slug: service.slug,
        name: service.name,
        requiresConnection,
        connected: isConnected,
        actions: service.actions.map((action) => ({
          id: action.id,
          key: action.key,
          description: action.description,
          configSchema: action.configSchema,
        })),
        reactions: service.reactions.map((reaction) => ({
          id: reaction.id,
          key: reaction.key,
          description: reaction.description,
          configSchema: reaction.configSchema,
        })),
      };
    });
  }

  private mapSlugToProvider(slug: string): string | null {
    switch (slug) {
      case 'github':
        return 'github';
      case 'spotify':
        return 'spotify';
      default:
        return null;
    }
  }
}
