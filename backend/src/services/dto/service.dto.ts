import { ApiProperty } from '@nestjs/swagger';

export class ServiceActionDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'issue_created' })
  key!: string;

  @ApiProperty({
    example: 'Déclenchée lorsqu’une nouvelle issue GitHub est créée',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    nullable: true,
    type: Object,
    description: 'Schéma JSON décrivant les champs de configuration de l’action',
    example: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
      },
      required: ['owner', 'repo'],
    },
  })
  configSchema!: unknown;
}

export class ServiceReactionDto {
  @ApiProperty({ example: 21 })
  id!: number;

  @ApiProperty({ example: 'send_slack_message' })
  key!: string;

  @ApiProperty({
    example: 'Envoyer un message Slack sur le salon configuré',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    nullable: true,
    type: Object,
    description: 'Schéma JSON décrivant les champs de configuration de la réaction',
    example: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
      },
      required: ['channel'],
    },
  })
  configSchema!: unknown;
}

export class ServiceWithConnectionsDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'github' })
  slug!: string;

  @ApiProperty({ example: 'GitHub' })
  name!: string;

  @ApiProperty({
    example: true,
    description:
      'Indique si l’utilisateur doit connecter un compte externe avant d’utiliser ce service',
  })
  requiresConnection!: boolean;

  @ApiProperty({
    example: true,
    description: 'Précise si l’utilisateur authentifié a déjà connecté le fournisseur',
  })
  connected!: boolean;

  @ApiProperty({ type: [ServiceActionDto] })
  actions!: ServiceActionDto[];

  @ApiProperty({ type: [ServiceReactionDto] })
  reactions!: ServiceReactionDto[];
}

export class ServicesListResponseDto {
  @ApiProperty({ type: [ServiceWithConnectionsDto] })
  services!: ServiceWithConnectionsDto[];
}
