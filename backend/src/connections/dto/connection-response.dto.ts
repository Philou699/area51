import { ApiProperty } from '@nestjs/swagger';

export class GithubAuthorizeResponseDto {
  @ApiProperty({
    example:
      'https://github.com/login/oauth/authorize?client_id=abc123&scope=repo%20user&state=0a7f599e-62a3-4b35-bc1c-374c4511eddf',
    description: "URL vers laquelle rediriger l’utilisateur pour autoriser GitHub",
  })
  authorizeUrl!: string;

  @ApiProperty({
    example: '0a7f599e-62a3-4b35-bc1c-374c4511eddf',
    description: 'Valeur opaque utilisée pour valider le retour OAuth',
  })
  state!: string;
}

export class DiscordAuthorizeResponseDto {
  @ApiProperty({
    example:
      'https://discord.com/api/oauth2/authorize?client_id=123&scope=identify%20guilds%20bot&state=xyz',
    description: "URL d'autorisation à ouvrir pour connecter Discord",
  })
  authorizeUrl!: string;

  @ApiProperty({
    example: 'xyz-0a7f599e-62a3-4b35-bc1c-374c4511eddf',
    description: 'Valeur state utilisée pour sécuriser le callback',
  })
  state!: string;
}

export class DiscordAccountDto {
  @ApiProperty({ example: '123456789012345678' })
  id!: string;

  @ApiProperty({ example: 'JeanDupont' })
  username!: string;

  @ApiProperty({
    example: 'Jean Dupont',
    nullable: true,
  })
  displayName!: string | null;

  @ApiProperty({
    example: 'https://cdn.discordapp.com/avatars/123/abc.png',
    nullable: true,
  })
  avatarUrl!: string | null;
}

export class DiscordGuildDto {
  @ApiProperty({ example: '987654321098765432' })
  id!: string;

  @ApiProperty({ example: 'Serveur Communauté' })
  name!: string;

  @ApiProperty({ example: true })
  owner!: boolean;

  @ApiProperty({
    example: '3072',
    nullable: true,
    description: 'Permissions accordées au bot sous forme de bitfield décimal',
  })
  permissions?: string | null;
}

export class DiscordConnectionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'discord' })
  provider!: string;

  @ApiProperty({ type: DiscordAccountDto })
  account!: DiscordAccountDto;

  @ApiProperty({ type: DiscordGuildDto, nullable: true })
  guild?: DiscordGuildDto | null;
}

export class DiscordGuildListResponseDto {
  @ApiProperty({ type: [DiscordGuildDto] })
  guilds!: DiscordGuildDto[];
}

export class DiscordChannelDto {
  @ApiProperty({ example: '123456789012345678' })
  id!: string;

  @ApiProperty({ example: 'général' })
  name!: string;

  @ApiProperty({
    example: 0,
    description:
      'Type de canal Discord (0 = texte, 5 = annonces, etc. — seuls les canaux textuels sont retournés)',
  })
  type!: number;

  @ApiProperty({
    example: '987654321012345678',
    nullable: true,
    description: 'Identifiant de la catégorie parente, si présent',
  })
  parentId!: string | null;

  @ApiProperty({
    example: 'Catégorie Projet',
    nullable: true,
    description: 'Nom de la catégorie qui contient ce canal',
  })
  categoryName!: string | null;
}

export class DiscordChannelListResponseDto {
  @ApiProperty({ type: [DiscordChannelDto] })
  channels!: DiscordChannelDto[];
}

export class ConnectionStatusDto {
  @ApiProperty({ example: 'github' })
  provider!: string;

  @ApiProperty({ example: true })
  connected!: boolean;

  @ApiProperty({
    example: '2025-01-10T12:00:00.000Z',
    nullable: true,
    description:
      'Date de connexion au fournisseur (null si la connexion n’est pas active).',
  })
  connectedAt!: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description:
      'Informations supplémentaires propres au provider (identifiants, métadonnées).',
  })
  details?: Record<string, unknown> | null;
}

export class ConnectionsListResponseDto {
  @ApiProperty({ type: [ConnectionStatusDto] })
  connections!: ConnectionStatusDto[];
}
