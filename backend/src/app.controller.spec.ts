import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

describe('AppController', () => {
  let appController: AppController;

  const mockDatabaseService = {
    service: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('about.json', () => {
    it('should return about information with current time and services', async () => {
      const result = await appController.getAbout();

      expect(result).toHaveProperty('client');
      expect(result).toHaveProperty('server');
      expect(result.client).toHaveProperty('host');
      expect(result.server).toHaveProperty('current_time');
      expect(result.server).toHaveProperty('services');
      expect(Array.isArray(result.server.services)).toBe(true);
      expect(typeof result.server.current_time).toBe('number');
    });
  });
});
