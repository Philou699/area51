import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Adresse e-mail utilisée pour la connexion',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "L’adresse e-mail doit être valide" })
  @MaxLength(254, { message: 'L’adresse e-mail ne doit pas dépasser 254 caractères' })
  email: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description: 'Mot de passe de l’utilisateur',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(256, { message: 'Le mot de passe ne doit pas dépasser 256 caractères' })
  password: string;

  @ApiProperty({
    required: false,
    example: true,
    description:
      'Si vrai, un jeton de rafraîchissement de plus longue durée est émis (si le client le supporte).',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return undefined;
  })
  @IsBoolean({ message: 'La case “se souvenir de moi” doit être un booléen' })
  rememberMe?: boolean;
}
