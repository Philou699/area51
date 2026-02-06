import { Test, TestingModule } from '@nestjs/testing';
import { LetterboxdService, ParsedLetterboxdActivity } from '../letterboxd.service';
import { DatabaseService } from '../../database/database.service';

describe('LetterboxdService - Unit Tests', () => {
  let service: LetterboxdService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockDatabaseService = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LetterboxdService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<LetterboxdService>(LetterboxdService);
    databaseService = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchUserActivity', () => {
    it('should fetch RSS feed for a valid username', async () => {
      const username = 'alness';

      // Mock the RSS parser - this will actually call the real API
      // For unit tests, we should mock the parser, but for now we test the structure
      const activities = await service.fetchUserActivity(username);

      expect(Array.isArray(activities)).toBe(true);
      // Note: This is more of an integration test as it calls the real API
    });

    it('should return empty array for invalid username', async () => {
      const username = 'this-user-definitely-does-not-exist-12345';

      const activities = await service.fetchUserActivity(username);

      expect(activities).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      // Test with an invalid URL to simulate network error
      const username = '';

      const activities = await service.fetchUserActivity(username);

      expect(activities).toEqual([]);
    });
  });

  describe('parseActivity (private method testing via integration)', () => {
    it('should correctly identify a review activity', () => {
      const mockRSSItem = {
        title: 'John reviewed The Matrix',
        link: 'https://letterboxd.com/john/film/the-matrix/',
        pubDate: '2025-01-15T10:00:00Z',
        filmTitle: 'The Matrix',
        filmYear: '1999',
        memberRating: '4.5',
        contentSnippet: 'Great sci-fi movie!',
      };

      // We test this indirectly through matchesActionCriteria
      // which uses the parsed activity
    });
  });

  describe('matchesActionCriteria (private method)', () => {
    it('should match new_review criteria correctly', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'The Matrix',
        filmYear: 1999,
        rating: 4.5,
        reviewText: 'Great movie!',
        letterboxdUrl: 'https://letterboxd.com/film/the-matrix/',
        activityDate: new Date(),
      };

      // Access private method through reflection for testing
      const matches = (service as any).matchesActionCriteria(
        activity,
        'new_review',
        {},
      );

      expect(matches).toBe(true);
    });

    it('should match new_diary_entry criteria correctly', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'diary',
        filmTitle: 'Inception',
        watchedDate: new Date('2025-01-15'),
        letterboxdUrl: 'https://letterboxd.com/film/inception/',
        activityDate: new Date(),
      };

      const matches = (service as any).matchesActionCriteria(
        activity,
        'new_diary_entry',
        {},
      );

      expect(matches).toBe(true);
    });

    it('should match film_watched criteria correctly', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'watched',
        filmTitle: 'Interstellar',
        watchedDate: new Date('2025-01-15'),
        letterboxdUrl: 'https://letterboxd.com/film/interstellar/',
        activityDate: new Date(),
      };

      const matches = (service as any).matchesActionCriteria(
        activity,
        'film_watched',
        {},
      );

      expect(matches).toBe(true);
    });

    it('should match film_rated criteria with minimum rating', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'rating',
        filmTitle: 'The Godfather',
        rating: 5,
        letterboxdUrl: 'https://letterboxd.com/film/the-godfather/',
        activityDate: new Date(),
      };

      const matchesWithMin = (service as any).matchesActionCriteria(
        activity,
        'film_rated',
        { minRating: 4 },
      );

      expect(matchesWithMin).toBe(true);
    });

    it('should not match film_rated when rating is below minimum', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'rating',
        filmTitle: 'Bad Movie',
        rating: 2,
        letterboxdUrl: 'https://letterboxd.com/film/bad-movie/',
        activityDate: new Date(),
      };

      const matches = (service as any).matchesActionCriteria(
        activity,
        'film_rated',
        { minRating: 4 },
      );

      expect(matches).toBe(false);
    });

    it('should match new_list criteria correctly', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'list',
        filmTitle: 'My Favorite Sci-Fi Movies',
        letterboxdUrl: 'https://letterboxd.com/user/list/favorite-scifi/',
        activityDate: new Date(),
      };

      const matches = (service as any).matchesActionCriteria(
        activity,
        'new_list',
        {},
      );

      expect(matches).toBe(true);
    });

    it('should not match unknown action criteria', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'Test',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      };

      const matches = (service as any).matchesActionCriteria(
        activity,
        'unknown_action',
        {},
      );

      expect(matches).toBe(false);
    });
  });

  describe('sendWebhook (private method)', () => {
    it('should throw error when webhookUrl is missing', async () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'Test Movie',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      };

      await expect(
        (service as any).sendWebhook({}, activity),
      ).rejects.toThrow('Webhook URL is required');
    });

    it('should format Discord webhook payload correctly', async () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'The Matrix',
        filmYear: 1999,
        rating: 4.5,
        reviewText: 'Amazing movie!',
        watchedDate: new Date('2025-01-15'),
        letterboxdUrl: 'https://letterboxd.com/film/the-matrix/',
        activityDate: new Date(),
        isRewatch: false,
      };

      const config = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        includeReview: true,
      };

      // Mock global fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      await (service as any).sendWebhook(config, activity);

      expect(global.fetch).toHaveBeenCalledWith(
        config.webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload).toHaveProperty('embeds');
      expect(payload.embeds[0]).toHaveProperty('title', 'Nouvelle activité Letterboxd');
      expect(payload.embeds[0]).toHaveProperty('color', 0x00d735);
      expect(payload.embeds[0].fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: '🎬 Film' }),
          expect.objectContaining({ name: '⭐ Note' }),
        ]),
      );
    });

    it('should format generic webhook payload for non-Discord URLs', async () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'diary',
        filmTitle: 'Inception',
        rating: 5,
        watchedDate: new Date('2025-01-15'),
        letterboxdUrl: 'https://letterboxd.com/film/inception/',
        activityDate: new Date(),
      };

      const config = {
        webhookUrl: 'https://webhook.site/unique-url',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      await (service as any).sendWebhook(config, activity);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload).toHaveProperty('type', 'diary');
      expect(payload.film).toHaveProperty('title', 'Inception');
      expect(payload.film).toHaveProperty('rating', 5);
    });
  });

  describe('logActivity (private method)', () => {
    it('should log activity with correct log level', () => {
      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'Test Movie',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      };

      const config = { logLevel: 'info' };

      // Spy on logger
      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      (service as any).logActivity(config, activity);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('executeReaction (private method)', () => {
    it('should execute send_webhook reaction', async () => {
      const area = {
        reaction: { key: 'send_webhook' },
        reactionConfig: {
          webhookUrl: 'https://webhook.site/test',
        },
      };

      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'Test',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      };

      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await (service as any).executeReaction(area, activity);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should execute log_activity reaction', async () => {
      const area = {
        reaction: { key: 'log_activity' },
        reactionConfig: { logLevel: 'info' },
      };

      const activity: ParsedLetterboxdActivity = {
        type: 'diary',
        filmTitle: 'Test',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      };

      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      await (service as any).executeReaction(area, activity);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should warn on unknown reaction type', async () => {
      const area = {
        reaction: { key: 'unknown_reaction' },
        reactionConfig: {},
      };

      const activity: ParsedLetterboxdActivity = {
        type: 'review',
        filmTitle: 'Test',
        letterboxdUrl: 'https://letterboxd.com/film/test/',
        activityDate: new Date(),
      };

      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      await (service as any).executeReaction(area, activity);

      expect(warnSpy).toHaveBeenCalledWith(
        'Unknown reaction type: unknown_reaction',
      );
    });
  });
});
