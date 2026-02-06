import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LetterboxdService } from './letterboxd.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  LetterboxdActivityPreviewDto,
  LetterboxdPollingResponseDto,
  LetterboxdTestResponseDto,
} from './dto/letterboxd-response.dto';
import { UnauthorizedResponseDto } from '../auth/dto/login-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('letterboxd')
@ApiBearerAuth()
@Controller('letterboxd')
export class LetterboxdController {
  constructor(private readonly letterboxdService: LetterboxdService) {}

  /**
   * Test endpoint to manually fetch a user's Letterboxd activity
   */
  @UseGuards(JwtAuthGuard)
  @Get('test')
  @ApiOperation({ summary: 'Test Letterboxd RSS feed for a user' })
  @ApiQuery({
    name: 'username',
    required: true,
    description: 'Letterboxd username to fetch',
  })
  @ApiOkResponse({
    description: 'Sample of parsed Letterboxd activities',
    type: LetterboxdTestResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Username query parameter is required',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async testFeed(
    @Query('username') username: string,
  ): Promise<LetterboxdTestResponseDto> {
    if (!username) {
      throw new BadRequestException('Username is required');
    }

    const activities = await this.letterboxdService.manualPoll(username);
    const preview = activities.slice(0, 10).map((activity) => ({
      type: activity.type,
      filmTitle: activity.filmTitle,
      filmYear: activity.filmYear ?? null,
      rating: activity.rating ?? null,
      reviewText: activity.reviewText ?? null,
      watchedDate: activity.watchedDate
        ? activity.watchedDate.toISOString()
        : null,
      letterboxdUrl: activity.letterboxdUrl,
      activityDate: activity.activityDate.toISOString(),
      isRewatch:
        activity.isRewatch !== undefined ? activity.isRewatch : null,
    })) as LetterboxdActivityPreviewDto[];

    return {
      username,
      count: activities.length,
      activities: preview,
    };
  }

  /**
   * Manually trigger polling (for testing/debugging)
   */
  @UseGuards(JwtAuthGuard)
  @Post('poll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger RSS polling for all areas' })
  @ApiOkResponse({
    description: 'Polling started successfully',
    type: LetterboxdPollingResponseDto,
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async triggerPoll(): Promise<LetterboxdPollingResponseDto> {
    await this.letterboxdService.pollAllUserFeeds();
    return { message: 'Polling triggered successfully' };
  }
}
