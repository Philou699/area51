import { Module } from '@nestjs/common';
import { TunnelService } from './tunnel.service';
import { TunnelController } from './tunnel.controller';
import { OAuthUpdateService } from './oauth-update.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TunnelController],
  providers: [TunnelService, OAuthUpdateService],
  exports: [TunnelService, OAuthUpdateService],
})
export class TunnelModule {}
