import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

class LoginUserDto {
  @ApiProperty({
    example: '6f1b88c8-2b8d-4bd4-9cb8-0a6ec9221f2f',
    description: 'Identifiant unique de l’utilisateur authentifié',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Adresse e-mail de l’utilisateur authentifié',
  })
  email: string;

  @ApiProperty({
    example: ['user'],
    description: 'Rôles attribués à l’utilisateur',
    isArray: true,
    type: String,
  })
  roles: string[];
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Jeton d’accès pour authentifier les requêtes suivantes',
  })
  access_token: string;

  @ApiProperty({
    example: 600,
    description: 'Durée de validité du jeton d’accès en secondes',
  })
  expires_in: number;

  @ApiProperty({
    example: 'Bearer',
    description: 'Type de jeton émis',
    default: 'Bearer',
  })
  token_type: 'Bearer';

  @ApiProperty({
    type: LoginUserDto,
  })
  user: LoginUserDto;
}

export class RegisterResponseDto extends LoginResponseDto {
  @ApiProperty({
    example: 'Utilisateur créé avec succès',
    description: 'Message de confirmation renvoyé après une inscription réussie',
  })
  message: string;
}

export class UnauthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 401 })
  declare statusCode: number;

  @ApiProperty({ example: 'Non autorisé' })
  declare error: string;

  @ApiProperty({ example: 'Identifiants invalides' })
  declare message: string;
}

export class TooManyRequestsResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 429 })
  declare statusCode: number;

  @ApiProperty({ example: 'Trop de requêtes' })
  declare error: string;

  @ApiProperty({
    example: 'Trop de tentatives de connexion. Réessayez plus tard.',
  })
  declare message: string;
}
