import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AboutResponseDto } from './app/dto/about-response.dto';

@ApiTags('meta')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Vérification de l’état de l’API' })
  @ApiOkResponse({
    description: 'Message de bienvenue confirmant que l’API répond',
    schema: { type: 'string', example: 'Bonjour !' },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('about.json')
  async getAbout(): Promise<AboutResponseDto> {
    return this.appService.getAbout();
  }
}
