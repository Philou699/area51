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

export class CreateAreaDto {
  @ApiProperty({
    example: 'M’avertir lorsqu’une nouvelle issue est créée',
    description: 'Nom compréhensible donné à l’automatisation',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 15,
    description: 'Identifiant de l’action à associer à cette area',
  })
  @Type(() => Number)
  @IsInt()
  actionId!: number;

  @ApiProperty({
    example: 22,
    description: 'Identifiant de la réaction à associer à cette area',
  })
  @Type(() => Number)
  @IsInt()
  reactionId!: number;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description:
      'Paramètres optionnels de l’action. Renseigner les champs obligatoires définis par le schéma de l’action.',
    example: {
      owner: 'open-source-org',
      repo: 'cool-project',
    },
  })
  @IsOptional()
  @IsObject()
  actionConfig?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description:
      'Paramètres optionnels de la réaction. Renseigner les champs obligatoires définis par le schéma de la réaction.',
    example: {
      channel: '#alerts',
    },
  })
  @IsOptional()
  @IsObject()
  reactionConfig?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Nom de la stratégie utilisée pour dédupliquer les déclenchements (laisser vide pour désactiver).',
    example: 'payload-hash',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dedupKeyStrategy?: string;
}
