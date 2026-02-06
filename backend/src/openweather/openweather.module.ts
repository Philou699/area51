import { Module } from '@nestjs/common';
import { OpenweatherService } from './openweather.service';
import { OpenweatherController } from './openweather.controller';
import { DatabaseModule } from '../database/database.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [DatabaseModule, DiscordModule],
  providers: [OpenweatherService],
  controllers: [OpenweatherController],
  exports: [OpenweatherService],
})
export class OpenweatherModule {}
