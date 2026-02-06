import { ApiProperty } from '@nestjs/swagger';

export class AreaServiceSummaryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'github' })
  slug!: string;

  @ApiProperty({ example: 'GitHub' })
  name!: string;
}

export class AreaActionSummaryDto {
  @ApiProperty({ example: 15 })
  id!: number;

  @ApiProperty({ example: 'issue_created' })
  key!: string;

  @ApiProperty({
    example: 'Déclenchée lorsqu’une nouvelle issue est créée sur le dépôt',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description:
      'Schéma JSON décrivant la configuration attendue par l’action',
    nullable: true,
    type: Object,
    example: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
      },
    },
  })
  configSchema!: unknown;

  @ApiProperty({ type: AreaServiceSummaryDto })
  service!: AreaServiceSummaryDto;
}

export class AreaReactionSummaryDto {
  @ApiProperty({ example: 22 })
  id!: number;

  @ApiProperty({ example: 'send_notification' })
  key!: string;

  @ApiProperty({
    example: 'Envoyer une notification sur le salon configuré',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description:
      'Schéma JSON décrivant la configuration attendue par la réaction',
    nullable: true,
    type: Object,
    example: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
      },
    },
  })
  configSchema!: unknown;

  @ApiProperty({ type: AreaServiceSummaryDto })
  service!: AreaServiceSummaryDto;
}

export class AreaResponseDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ example: 'Notify me of new GitHub issues' })
  name!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({
    description: 'Configuration d’exécution utilisée par l’action',
    nullable: true,
    type: Object,
    example: {
      owner: 'open-source-org',
      repo: 'area-project',
    },
  })
  actionConfig!: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Configuration d’exécution utilisée par la réaction',
    nullable: true,
    type: Object,
    example: {
      channel: '#alerts',
    },
  })
  reactionConfig!: Record<string, unknown> | null;

  @ApiProperty({
    description:
      'Stratégie utilisée pour générer les clés de déduplication des déclencheurs',
    nullable: true,
    example: 'payload-hash',
  })
  dedupKeyStrategy!: string | null;

  @ApiProperty({
    example: '2025-01-15T08:30:00.000Z',
    description: 'Horodatage de création de l’area (ISO 8601)',
  })
  createdAt!: string;

  @ApiProperty({ type: AreaActionSummaryDto })
  action!: AreaActionSummaryDto;

  @ApiProperty({ type: AreaReactionSummaryDto })
  reaction!: AreaReactionSummaryDto;
}

export class AreasListResponseDto {
  @ApiProperty({ type: [AreaResponseDto] })
  areas!: AreaResponseDto[];
}
