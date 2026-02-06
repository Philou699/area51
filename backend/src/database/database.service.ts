import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Méthode pour stocker/mettre à jour les URLs des tunnels
  async upsertTunnelUrl(tunnelName: string, url: string) {
    // Vous pouvez utiliser une table dédiée ou stocker dans les métadonnées
    // Pour l'instant, on utilise une approche simple avec des variables d'environnement
    // En production, vous pourriez avoir une table `tunnel_urls`
    
    // Simuler le stockage - en réalité vous pourriez avoir:
    // return this.tunnelUrl.upsert({
    //   where: { name: tunnelName },
    //   update: { url },
    //   create: { name: tunnelName, url }
    // });
    
    console.log(`Tunnel ${tunnelName} URL updated to: ${url}`);
  }

  // Méthode pour récupérer l'URL d'un tunnel
  async getTunnelUrl(tunnelName: string): Promise<string | null> {
    // En production, récupérer depuis la base de données
    // return this.tunnelUrl.findUnique({ where: { name: tunnelName } });
    
    // Pour l'instant, retourner null (sera géré par le service tunnel)
    return null;
  }
}
