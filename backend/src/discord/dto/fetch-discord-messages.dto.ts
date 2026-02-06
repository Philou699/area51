import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class FetchDiscordMessagesDto {
  @ApiProperty({
    example: '123456789012345678',
    description: 'Identifiant du salon dont il faut récupérer les messages (obligatoire).',
  })
  @IsString()
  @IsNotEmpty()
  channelId!: string;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
    description: 'Nombre maximum de messages à récupérer (1-50)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
