import { ApiProperty } from '@nestjs/swagger';

export class GithubTestResponseDto {
  @ApiProperty({ example: 'open-source-org' })
  owner!: string;

  @ApiProperty({ example: 'area-backend' })
  repo!: string;

  @ApiProperty({
    example: '2025-01-20T12:34:56.000Z',
    description: 'Horodatage de l’exécution de la récupération manuelle',
  })
  fetchedAt!: string;

  @ApiProperty({
    description: 'Charge utile brute renvoyée par GitHub (spécifique à l’action)',
    type: Object,
    nullable: true,
  })
  result!: unknown;
}

export class GithubPollingResponseDto {
  @ApiProperty({ example: 'Polling GitHub lancé avec succès' })
  message!: string;
}
