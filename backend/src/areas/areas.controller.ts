import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaStatusDto } from './dto/update-area-status.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import {
  AreaResponseDto,
  AreasListResponseDto,
} from './dto/area-response.dto';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto';
import { UnauthorizedResponseDto } from '../auth/dto/login-response.dto';

@ApiTags('areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new area automation',
    description:
      'Creates an automation by binding an action to a reaction for the authenticated user.',
  })
  @ApiBody({ type: CreateAreaDto })
  @ApiCreatedResponse({
    description: 'Area successfully created',
    type: AreaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or action/reaction not available',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorResponseDto) },
        { $ref: getSchemaPath(ErrorResponseDto) },
      ],
    },
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async createArea(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.areasService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List areas created by the authenticated user',
  })
  @ApiOkResponse({
    description: 'Areas belonging to the current user',
    type: AreasListResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async getAreas(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AreasListResponseDto> {
    const areas = await this.areasService.findForUser(user.id);
    return { areas };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Enable or disable an area',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 101,
    description: 'Identifier of the area to update',
  })
  @ApiBody({ type: UpdateAreaStatusDto })
  @ApiOkResponse({
    description: 'Updated area status',
    type: AreaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for the provided status',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorResponseDto) },
        { $ref: getSchemaPath(ErrorResponseDto) },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Area not found for the current user',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async toggleArea(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAreaStatusDto,
  ): Promise<AreaResponseDto> {
    return this.areasService.updateStatus(user.id, id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update area metadata or configuration',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 101,
    description: 'Identifier of the area to update',
  })
  @ApiBody({ type: UpdateAreaDto })
  @ApiOkResponse({
    description: 'Area updated successfully',
    type: AreaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Provided data violated validation rules',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ValidationErrorResponseDto) },
        { $ref: getSchemaPath(ErrorResponseDto) },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Area not found for the current user',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async updateArea(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.areasService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an area',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 101,
    description: 'Identifier of the area to delete',
  })
  @ApiNoContentResponse({ description: 'Area deleted successfully' })
  @ApiNotFoundResponse({
    description: 'Area not found for the current user',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async deleteArea(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.areasService.remove(user.id, id);
  }
}
