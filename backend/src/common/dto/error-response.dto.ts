import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    example: 'Requête invalide',
    description: 'Brève description de la classe d’erreur HTTP',
  })
  error!: string;

  @ApiProperty({
    example: 'Action invalide',
    description:
      'Explication lisible de l’erreur. Peut être une chaîne ou un tableau de chaînes en cas d’erreurs de validation.',
  })
  message!: string | string[];
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    example: ['le nom ne doit pas être vide', "l’identifiant d’action doit être un entier"],
    description: 'Messages de validation détaillés',
    isArray: true,
    type: String,
  })
  declare message: string[];
}
