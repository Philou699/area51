import { Test, TestingModule } from '@nestjs/testing';
import { GithubService, GithubActionKey } from '../github.service';
import { DatabaseService } from '../../database/database.service';
import { DiscordService } from '../../discord/discord.service';

describe('GithubService - log reaction', () => {
  let service: GithubService;

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
    service: {
      findUnique: jest.fn(),
    },
  };

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: DiscordService,
          useValue: {
            executeReaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const buildActivity = () => ({
    dedupKey: 'github:owner/repo:issue:1',
    actionKey: 'new_issue' as GithubActionKey,
    type: 'issue' as const,
    owner: 'owner',
    repo: 'repo',
    title: 'Test issue',
    url: 'https://github.com/owner/repo/issues/1',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    author: 'tester',
    number: 1,
    body: 'Issue body',
  });

  describe('executeReaction', () => {
    it('should log an info message for log_activity reaction', async () => {
      const area = {
        reaction: { key: 'log_activity' },
        reactionConfig: { logLevel: 'info' },
      };

      const activity = buildActivity();
      const logSpy = jest.spyOn((service as any).logger, 'log');

      await (service as any).executeReaction(area, activity);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('GitHub reaction log_activity triggered'),
      );
    });

    it('should log debug details when logLevel is debug', async () => {
      const area = {
        reaction: { key: 'log_activity' },
        reactionConfig: { logLevel: 'debug' },
      };

      const activity = buildActivity();
      const debugSpy = jest.spyOn((service as any).logger, 'debug');

      await (service as any).executeReaction(area, activity);

      expect(debugSpy).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('GitHub reaction log_activity triggered'),
      );
      expect(debugSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('GitHub activity payload:'),
      );
    });

    it('should default to info level when log level is unknown', async () => {
      const area = {
        reaction: { key: 'log_activity' },
        reactionConfig: { logLevel: 'mystery' },
      };

      const activity = buildActivity();
      const logSpy = jest.spyOn((service as any).logger, 'log');

      await (service as any).executeReaction(area, activity);

      expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it('should warn when reaction type is unsupported', async () => {
      const area = {
        reaction: { key: 'unsupported_reaction' },
        reactionConfig: {},
      };

      const activity = buildActivity();
      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      await (service as any).executeReaction(area, activity);

      expect(warnSpy).toHaveBeenCalledWith(
        'Unknown reaction type: unsupported_reaction',
      );
    });
  });

});
