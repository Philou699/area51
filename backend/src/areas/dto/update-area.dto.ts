import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAreaDto {
  @ApiProperty({
    required: false,
    example: 'M’avertir lorsqu’une nouvelle issue GitHub est créée',
    description: 'Nouveau nom attribué à l’area',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    required: false,
    example: 18,
    description: 'Nouvel identifiant d’action à associer à l’area',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actionId?: number;

  @ApiProperty({
    required: false,
    example: 24,
    description: 'Nouvel identifiant de réaction à associer à l’area',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reactionId?: number;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description: 'Nouvelle configuration de l’action',
    example: {
      repo: 'new-repo',
    },
  })
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description: 'Nouvelle configuration de la réaction',
    example: {
      channel: '#support',
    },
  })
  @IsOptional()
  @IsObject()
  reactionConfig?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Stratégie de déduplication mise à jour (mettre à null pour la désactiver)',
    example: 'payload-hash',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dedupKeyStrategy?: string | null;
}
