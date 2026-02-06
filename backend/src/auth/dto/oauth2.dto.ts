import { IsString, IsNotEmpty } from 'class-validator';

export class OAuth2LoginDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
