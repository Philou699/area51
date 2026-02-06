import { Controller, Get, Query, Logger } from '@nestjs/common';
import { OpenweatherService } from './openweather.service';

@Controller('openweather')
export class OpenweatherController {
  private readonly logger = new Logger(OpenweatherController.name);

  constructor(private readonly openweatherService: OpenweatherService) {}

  /**
   * Manual endpoint to test weather fetching
   * GET /openweather/current?city=Paris
   */
  @Get('current')
  async getCurrentWeather(@Query('city') city: string) {
    if (!city) {
      return {
        error: 'City parameter is required',
      };
    }

    try {
      const weather = await this.openweatherService.fetchCurrentWeather(city);
      return weather;
    } catch (error) {
      this.logger.error(`Failed to fetch weather for ${city}: ${error.message}`);
      return {
        error: error.message,
      };
    }
  }

  /**
   * Manual trigger for testing the polling mechanism
   * GET /openweather/poll
   */
  @Get('poll')
  async manualPoll() {
    await this.openweatherService.pollAllAreas();
    return { message: 'Polling completed' };
  }
}
