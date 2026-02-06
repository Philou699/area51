import { ApiProperty } from '@nestjs/swagger';

export class AboutActionDto {
  @ApiProperty({ example: 'create_issue' })
  name!: string;

  @ApiProperty({
    example: 'Créer une nouvelle issue GitHub lorsque l’automatisation se déclenche',
  })
  description!: string;
}

export class AboutReactionDto {
  @ApiProperty({ example: 'send_notification' })
  name!: string;

  @ApiProperty({
    example: 'Envoyer une notification via l’intégration configurée',
  })
  description!: string;
}

export class AboutServiceDto {
  @ApiProperty({ example: 'github' })
  name!: string;

  @ApiProperty({ type: [AboutActionDto] })
  actions!: AboutActionDto[];

  @ApiProperty({ type: [AboutReactionDto] })
  reactions!: AboutReactionDto[];
}

export class AboutClientDto {
  @ApiProperty({ example: '127.0.0.1' })
  host!: string;
}

export class AboutServerDto {
  @ApiProperty({
    example: 1735305600,
    description: 'Horodatage Unix actuel du serveur',
  })
  current_time!: number;

  @ApiProperty({ type: [AboutServiceDto] })
  services!: AboutServiceDto[];
}

export class AboutResponseDto {
  @ApiProperty({ type: AboutClientDto })
  client!: AboutClientDto;

  @ApiProperty({ type: AboutServerDto })
  server!: AboutServerDto;
}
