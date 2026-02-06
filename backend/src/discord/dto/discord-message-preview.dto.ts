import { ApiProperty } from '@nestjs/swagger';

export class DiscordAttachmentPreviewDto {
  @ApiProperty({ example: '113355779988776655' })
  id!: string;

  @ApiProperty({
    example: 'https://cdn.discordapp.com/attachments/.../image.png',
  })
  url!: string;

  @ApiProperty({
    example: 'image.png',
    nullable: true,
  })
  filename!: string | null;

  @ApiProperty({
    example: 'image/png',
    nullable: true,
  })
  contentType!: string | null;
}

export class DiscordAuthorPreviewDto {
  @ApiProperty({ example: '123456789012345678', nullable: true })
  id!: string | null;

  @ApiProperty({ example: 'JaneDoe', nullable: true })
  username!: string | null;

  @ApiProperty({ example: 'Jane Doe', nullable: true })
  globalName!: string | null;

  @ApiProperty({ example: 'Jane', nullable: true })
  displayName!: string | null;

  @ApiProperty({ example: false })
  isBot!: boolean;
}

export class DiscordMessagePreviewDto {
  @ApiProperty({ example: '123456789012345678' })
  id!: string;

  @ApiProperty({ example: '123456789012345678' })
  channelId!: string;

  @ApiProperty({ example: '123456789012345678', nullable: true })
  guildId!: string | null;

  @ApiProperty({
    example: 'Ceci est le contenu d’un message d’exemple',
  })
  content!: string;

  @ApiProperty({ type: DiscordAuthorPreviewDto })
  author!: DiscordAuthorPreviewDto;

  @ApiProperty({ type: [DiscordAttachmentPreviewDto] })
  attachments!: DiscordAttachmentPreviewDto[];

  @ApiProperty({
    example: ['123456789012345678'],
    type: [String],
  })
  mentions!: string[];

  @ApiProperty({
    example: '2025-01-27T10:15:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    example: 'https://discord.com/channels/123/456/789',
  })
  url!: string;
}
