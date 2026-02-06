import { Test, TestingModule } from '@nestjs/testing';
import { OpenweatherService } from './openweather.service';
import { DatabaseService } from '../database/database.service';

describe('OpenweatherService', () => {
  let service: OpenweatherService;
  let database: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenweatherService,
        {
          provide: DatabaseService,
          useValue: {
            service: {
              findUnique: jest.fn(),
            },
            area: {
              findMany: jest.fn(),
            },
            webhookEvent: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            areaLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OpenweatherService>(OpenweatherService);
    database = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchCurrentWeather', () => {
    it('should fetch weather data for a city', async () => {
      // Skip test if API key is not configured
      if (!process.env.OPENWEATHER_API_KEY) {
        console.log('Skipping test: OPENWEATHER_API_KEY not set');
        return;
      }

      const weather = await service.fetchCurrentWeather('Paris');
      
      expect(weather).toBeDefined();
      expect(weather.city).toBeTruthy();
      expect(typeof weather.temperature).toBe('number');
      expect(weather.condition).toBeTruthy();
      expect(weather.description).toBeTruthy();
      expect(typeof weather.humidity).toBe('number');
      expect(typeof weather.windSpeed).toBe('number');
      expect(weather.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error if API key is not configured', async () => {
      const originalKey = process.env.OPENWEATHER_API_KEY;
      delete process.env.OPENWEATHER_API_KEY;

      // Recreate service without API key
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OpenweatherService,
          {
            provide: DatabaseService,
            useValue: database,
          },
        ],
      }).compile();

      const serviceWithoutKey = module.get<OpenweatherService>(OpenweatherService);

      await expect(serviceWithoutKey.fetchCurrentWeather('Paris'))
        .rejects
        .toThrow('OpenWeather API key is not configured');

      // Restore API key
      if (originalKey) {
        process.env.OPENWEATHER_API_KEY = originalKey;
      }
    });
  });
});
