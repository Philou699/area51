import { Injectable } from '@nestjs/common';
import { User, ProviderAccount } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.database.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by ID
   */
  async findById(id: number): Promise<User | null> {
    return this.database.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.database.user.create({
      data,
    });
  }

  /**
   * Create a provider account for a user
   */
  async createProviderAccount(data: {
    userId: number;
    provider: string;
    providerUserId: string;
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
  }): Promise<ProviderAccount> {
    return this.database.providerAccount.create({
      data,
    });
  }

  /**
   * Update or create a provider account for a user
   */
  async upsertProviderAccount(data: {
    userId: number;
    provider: string;
    providerUserId: string;
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
  }): Promise<ProviderAccount> {
    return this.database.providerAccount.upsert({
      where: {
        userId_provider: {
          userId: data.userId,
          provider: data.provider,
        },
      },
      update: {
        providerUserId: data.providerUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        expiresAt: data.expiresAt ?? null,
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        providerUserId: data.providerUserId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  /**
   * Find a provider account by user ID and provider
   */
  async findProviderAccount(
    userId: number,
    provider: string,
  ): Promise<ProviderAccount | null> {
    return this.database.providerAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  /**
   * Find a provider account by provider + external identifier
   */
  async findProviderAccountByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<ProviderAccount | null> {
    return this.database.providerAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });
  }
}
