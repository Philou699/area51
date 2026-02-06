import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CompleteDiscordDto {
  @ApiProperty({
    example: '1Zf9X2...',
    description: 'Code d’autorisation retourné par Discord',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    example: '0a7f599e-62a3-4b35-bc1c-374c4511eddf',
    description: 'Valeur state émise lors du démarrage du flux',
  })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({
    required: false,
    example: '123456789012345678',
    description:
      'Identifiant du serveur (guild) sélectionné pendant l’autorisation',
  })
  @IsOptional()
  @IsString()
  guildId?: string;
}
