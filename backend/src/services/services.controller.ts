import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ServicesListResponseDto } from './dto/service.dto';
import { UnauthorizedResponseDto } from '../auth/dto/login-response.dto';

@ApiTags('services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: 'Retrieve the catalog of services, actions and reactions',
    description:
      'Returns all enabled services with their actions and reactions. Includes connection status for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'List of services currently available to the user',
    type: ServicesListResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async listServices(
    @Req() request: Request,
  ): Promise<ServicesListResponseDto> {
    const user = request.user as JwtPayload;
    const userId = parseInt(user.sub, 10);
    const services = await this.servicesService.findAvailable(userId);
    return { services };
  }
}
