import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AuthConfigService } from './auth.config';

interface RateLimitStatus {
  isLocked: boolean;
  lockTtlSeconds: number;
  isRateLimited: boolean;
  attemptCount: number;
}

interface FailureOutcome {
  rateLimited: boolean;
  lockDurationSeconds: number | null;
}

interface StoreEntry {
  value: number;
  expiresAt: number | null;
}

class InMemoryRateLimitStore {
  private readonly store = new Map<string, StoreEntry>();

  async incr(key: string, ttlSeconds: number): Promise<number> {
    this.cleanup(key);
    const existing = this.store.get(key);
    if (!existing) {
      const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
      this.store.set(key, { value: 1, expiresAt });
      return 1;
    }

    existing.value += 1;
    if (ttlSeconds > 0) {
      existing.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    return existing.value;
  }

  async get(key: string): Promise<number | null> {
    this.cleanup(key);
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  async set(key: string, value: number, ttlSeconds: number): Promise<void> {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async ttl(key: string): Promise<number> {
    this.cleanup(key);
    const entry = this.store.get(key);
    if (!entry) {
      return -2;
    }

    if (entry.expiresAt === null) {
      return -1;
    }

    const remaining = entry.expiresAt - Date.now();
    return remaining <= 0 ? 0 : Math.ceil(remaining / 1000);
  }

  private cleanup(key: string): void {
    const entry = this.store.get(key);
    if (!entry) {
      return;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
    }
  }
}

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly memoryStore = new InMemoryRateLimitStore();
  private redisClient: Redis | null = null;
  private redisReady = false;

  constructor(private readonly authConfig: AuthConfigService) {
    if (authConfig.redisUrl) {
      const client = new Redis(authConfig.redisUrl, {
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      client.on('error', (error: unknown) => {
        this.logger.error('Redis client error, switching to in-memory rate limit store', {
          error,
        });
        this.useMemoryStore();
      });

      void client
        .connect()
        .then(() => {
          this.logger.log('Auth rate limiting is using Redis backend');
          this.redisClient = client;
          this.redisReady = true;
        })
        .catch((error: unknown) => {
          this.logger.error('Failed to connect to Redis, using in-memory store', { error });
          this.useMemoryStore();
        });
    }
  }

  async evaluate(email: string, ipAddress: string): Promise<RateLimitStatus> {
    const lockKey = this.getLockKey(email, ipAddress);
    const attemptsKey = this.getAttemptsKey(email, ipAddress);

    const [lockTtl, attempts] = await Promise.all([
      this.ttl(lockKey),
      this.getNumeric(attemptsKey),
    ]);

    const lockTtlSeconds = Math.max(lockTtl, 0);
    const attemptCount = attempts ?? 0;
    const isRateLimited = attemptCount >= this.authConfig.authRateLimitMaxAttempts;

    return {
      isLocked: lockTtlSeconds > 0,
      lockTtlSeconds,
      isRateLimited,
      attemptCount,
    };
  }

  async registerFailure(email: string, ipAddress: string): Promise<FailureOutcome> {
    const attemptsKey = this.getAttemptsKey(email, ipAddress);
    const attempts = await this.incr(attemptsKey, this.authConfig.authRateLimitWindowSeconds);

    let rateLimited = false;
    let lockDurationSeconds: number | null = null;

    if (attempts >= this.authConfig.authRateLimitMaxAttempts) {
      rateLimited = true;
      lockDurationSeconds = await this.applyProgressiveLock(email, ipAddress);
    }

    return {
      rateLimited,
      lockDurationSeconds,
    };
  }

  async reset(email: string, ipAddress: string): Promise<void> {
    const attemptsKey = this.getAttemptsKey(email, ipAddress);
    const lockKey = this.getLockKey(email, ipAddress);
    const lockCounterKey = this.getLockCounterKey(email, ipAddress);
    await Promise.all([
      this.del(attemptsKey),
      this.del(lockKey),
      this.del(lockCounterKey),
    ]);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  private async applyProgressiveLock(email: string, ipAddress: string): Promise<number> {
    const lockCounterKey = this.getLockCounterKey(email, ipAddress);
    const currentStage = await this.incr(lockCounterKey, this.authConfig.lockCounterTtlSeconds);

    const lockDurations = this.authConfig.lockDurationsSeconds;
    const index = Math.min(currentStage - 1, lockDurations.length - 1);
    const lockDurationSeconds = lockDurations[index] ?? lockDurations[lockDurations.length - 1];

    const lockKey = this.getLockKey(email, ipAddress);
    await this.set(lockKey, 1, lockDurationSeconds);

    return lockDurationSeconds;
  }

  private async incr(key: string, ttlSeconds: number): Promise<number> {
    if (this.redisReady && this.redisClient) {
      try {
        const value = await this.redisClient.incr(key);
        if (value === 1 && ttlSeconds > 0) {
          await this.redisClient.expire(key, ttlSeconds);
        } else if (ttlSeconds > 0) {
          const currentTtl = await this.redisClient.ttl(key);
          if (currentTtl < 0) {
            await this.redisClient.expire(key, ttlSeconds);
          }
        }
        return value;
      } catch (error) {
        this.logger.error('Redis incr command failed, switching to in-memory store', {
          error,
        });
        this.useMemoryStore();
      }
    }

    return this.memoryStore.incr(key, ttlSeconds);
  }

  private async getNumeric(key: string): Promise<number | null> {
    if (this.redisReady && this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        return value ? Number.parseInt(value, 10) : null;
      } catch (error) {
        this.logger.error('Redis get command failed, switching to in-memory store', {
          error,
        });
        this.useMemoryStore();
      }
    }

    return this.memoryStore.get(key);
  }

  private async set(key: string, value: number, ttlSeconds: number): Promise<void> {
    if (this.redisReady && this.redisClient) {
      try {
        if (ttlSeconds > 0) {
          await this.redisClient.set(key, String(value), 'EX', ttlSeconds);
        } else {
          await this.redisClient.set(key, String(value));
        }
        return;
      } catch (error) {
        this.logger.error('Redis set command failed, switching to in-memory store', {
          error,
        });
        this.useMemoryStore();
      }
    }

    await this.memoryStore.set(key, value, ttlSeconds);
  }

  private async del(key: string): Promise<void> {
    if (this.redisReady && this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        this.logger.error('Redis del command failed, switching to in-memory store', {
          error,
        });
        this.useMemoryStore();
      }
    }

    await this.memoryStore.del(key);
  }

  private async ttl(key: string): Promise<number> {
    if (this.redisReady && this.redisClient) {
      try {
        const ttlSeconds = await this.redisClient.ttl(key);
        return ttlSeconds;
      } catch (error) {
        this.logger.error('Redis ttl command failed, switching to in-memory store', {
          error,
        });
        this.useMemoryStore();
      }
    }

    return this.memoryStore.ttl(key);
  }

  private useMemoryStore(): void {
    if (this.redisClient) {
      void this.redisClient.quit();
      this.redisClient = null;
    }
    this.redisReady = false;
  }

  private getAttemptsKey(email: string, ipAddress: string): string {
    return `auth:attempts:${email}:${ipAddress}`;
  }

  private getLockKey(email: string, ipAddress: string): string {
    return `auth:lock:${email}:${ipAddress}`;
  }

  private getLockCounterKey(email: string, ipAddress: string): string {
    return `auth:lockcount:${email}:${ipAddress}`;
  }
}
