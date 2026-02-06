import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LetterboxdController } from '../letterboxd.controller';
import { LetterboxdService } from '../letterboxd.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('LetterboxdController - Integration Tests', () => {
  let app: INestApplication;
  let letterboxdService: jest.Mocked<LetterboxdService>;

  const mockLetterboxdService = {
    manualPoll: jest.fn(),
    pollAllUserFeeds: jest.fn(),
    fetchUserActivity: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LetterboxdController],
      providers: [
        {
          provide: LetterboxdService,
          useValue: mockLetterboxdService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Bypass auth for testing
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    letterboxdService = moduleFixture.get(LetterboxdService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /letterboxd/test', () => {
    it('should return activities for a valid username', async () => {
      const username = 'alness';
      const mockActivities = [
        {
          type: 'review',
          filmTitle: 'The Matrix',
          filmYear: 1999,
          rating: 5,
          reviewText: 'Great movie!',
          letterboxdUrl: 'https://letterboxd.com/film/the-matrix/',
          activityDate: new Date(),
        },
        {
          type: 'diary',
          filmTitle: 'Inception',
          watchedDate: new Date(),
          letterboxdUrl: 'https://letterboxd.com/film/inception/',
          activityDate: new Date(),
        },
      ];

      mockLetterboxdService.manualPoll.mockResolvedValue(mockActivities);

      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username })
        .expect(200);

      expect(response.body).toHaveProperty('username', username);
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body).toHaveProperty('activities');
      expect(response.body.activities).toHaveLength(2);
      expect(letterboxdService.manualPoll).toHaveBeenCalledWith(username);
    });

    it('should return first 10 activities when user has more than 10', async () => {
      const username = 'prolificuser';
      const mockActivities = Array(20).fill({
        type: 'diary',
        filmTitle: 'Test Movie',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      });

      mockLetterboxdService.manualPoll.mockResolvedValue(mockActivities);

      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username })
        .expect(200);

      expect(response.body.count).toBe(20);
      expect(response.body.activities).toHaveLength(10);
    });

    it('should return error when username is not provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .expect(200);

      expect(response.body).toHaveProperty('error', 'Username is required');
      expect(letterboxdService.manualPoll).not.toHaveBeenCalled();
    });

    it('should return empty activities for non-existent user', async () => {
      const username = 'nonexistentuser12345';
      mockLetterboxdService.manualPoll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username })
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.activities).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      const username = 'testuser';
      mockLetterboxdService.manualPoll.mockRejectedValue(
        new Error('Network error'),
      );

      await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username })
        .expect(500);
    });
  });

  describe('POST /letterboxd/poll', () => {
    it('should trigger polling successfully', async () => {
      mockLetterboxdService.pollAllUserFeeds.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/letterboxd/poll')
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Polling triggered successfully',
      );
      expect(letterboxdService.pollAllUserFeeds).toHaveBeenCalledTimes(1);
    });

    it('should handle polling errors', async () => {
      mockLetterboxdService.pollAllUserFeeds.mockRejectedValue(
        new Error('Database error'),
      );

      await request(app.getHttpServer())
        .post('/letterboxd/poll')
        .expect(500);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed username gracefully', async () => {
      const username = ''; // Empty username
      mockLetterboxdService.manualPoll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username })
        .expect(200);

      expect(response.body).toHaveProperty('error', 'Username is required');
    });

    it('should handle special characters in username', async () => {
      const username = 'user@#$%';
      mockLetterboxdService.manualPoll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username })
        .expect(200);

      expect(letterboxdService.manualPoll).toHaveBeenCalledWith(username);
    });
  });
});
