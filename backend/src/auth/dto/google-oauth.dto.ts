import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleOAuthDto {
  @ApiProperty({
    example: 'ya29.a0AfH6SMC...',
    description: 'Google ID token (JWT) obtained from the client-side flow',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
