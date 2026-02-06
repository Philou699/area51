import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../discord/discord.module';
import { GithubApiService } from './github-api.service';

@Module({
  imports: [
    ScheduleModule,
    AuthModule,
    DiscordModule,
  ],
  controllers: [GithubController],
  providers: [GithubService, GithubApiService],
  exports: [GithubService],
})
export class GithubModule {}
