import { Module } from '@nestjs/common';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';
import { DatabaseModule } from '../database/database.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [DatabaseModule, DiscordModule],
  controllers: [SpotifyController],
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
