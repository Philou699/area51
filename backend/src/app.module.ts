import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebugController } from './debug.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { AreasModule } from './areas/areas.module';
import { LetterboxdModule } from './letterboxd/letterboxd.module';
import { GithubModule } from './github/github.module';
import { SpotifyModule } from './spotify/spotify.module';
import { ConnectionsModule } from './connections/connections.module';
import { DiscordModule } from './discord/discord.module';
import { OpenweatherModule } from './openweather/openweather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? undefined
          : [join(__dirname, '..', '..', '.env')],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    // TunnelModule, // Désactivé temporairement
    AuthModule,
    UsersModule,
    ServicesModule,
    AreasModule,
    LetterboxdModule,
    GithubModule,
    SpotifyModule,
    ConnectionsModule,
    DiscordModule,
    OpenweatherModule,
  ],
  controllers: [AppController, DebugController],
  providers: [AppService],
})
export class AppModule {}
