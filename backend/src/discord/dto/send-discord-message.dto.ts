import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendDiscordMessageDto {
  @ApiProperty({
    example: '123456789012345678',
    description: 'Identifiant du salon cible (snowflake)',
  })
  @IsString()
  @IsNotEmpty()
  channelId!: string;

  @ApiProperty({
    example: 'Message envoyé automatiquement par Area !',
    description: 'Contenu texte brut du message (2000 caractères max.)',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @ApiProperty({
    required: false,
    description: 'Liste optionnelle d’identifiants d’utilisateurs à mentionner',
    example: ['123456789012345678'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionUserIds?: string[];

  @ApiProperty({
    required: false,
    description: 'Liste optionnelle d’identifiants de rôles à mentionner',
    example: ['987654321987654321'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionRoleIds?: string[];
}
