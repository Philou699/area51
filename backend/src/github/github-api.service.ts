import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export class GithubTokenUnavailableError extends Error {
  constructor(
    public readonly userId: number,
    message = 'GitHub token unavailable. Please reconnect GitHub.',
  ) {
    super(message);
    this.name = 'GithubTokenUnavailableError';
  }
}

export class GithubApiError extends Error {
  constructor(
    public readonly context: string,
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(
      `GitHub API error (${status}) during ${context}: ${responseBody.slice(
        0,
        200,
      )}`,
    );
    this.name = 'GithubApiError';
  }
}

interface GithubApiRequest {
  userId: number;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  context?: string;
}

@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private readonly apiBaseUrl = 'https://api.github.com';

  constructor(private readonly database: DatabaseService) {}

  async request<T>(params: GithubApiRequest): Promise<T> {
    const account = await this.database.providerAccount.findUnique({
      where: {
        userId_provider: {
          userId: params.userId,
          provider: 'github',
        },
      },
    });

    if (!account?.accessToken) {
      throw new GithubTokenUnavailableError(params.userId);
    }

    const url = this.normalizeUrl(params.url);
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'area-backend',
      Authorization: `Bearer ${account.accessToken}`,
      ...(params.headers ?? {}),
    };

    const response = await fetch(url, {
      method: params.method ?? 'GET',
      headers,
      body: params.body,
    });

    this.logRateLimit(response, params.context ?? url);

    if (response.status === 401) {
      this.logger.warn(
        `GitHub token rejected for user ${params.userId} (401). Marking as disconnected.`,
      );
      await this.safeDeleteProviderAccount(params.userId);
      throw new GithubTokenUnavailableError(
        params.userId,
        'GitHub token expiré ou révoqué. Veuillez reconnecter GitHub.',
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new GithubApiError(params.context ?? url, response.status, errorText);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${this.apiBaseUrl}${url}`;
    }

    return `${this.apiBaseUrl}/${url}`;
  }

  private async safeDeleteProviderAccount(userId: number): Promise<void> {
    await this.database.providerAccount
      .delete({
        where: {
          userId_provider: {
            userId,
            provider: 'github',
          },
        },
      })
      .catch((error) =>
        this.logger.error(
          `Failed to delete revoked GitHub account for user ${userId}: ${error.message}`,
        ),
      );
  }

  private logRateLimit(response: Response, context: string): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-limit');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining && Number(remaining) <= 50) {
      const resetDate = reset
        ? new Date(Number(reset) * 1000).toISOString()
        : 'unknown';
      this.logger.warn(
        `GitHub rate limit is low (${remaining}/${limit ?? '?'}) while calling ${context}. Reset at ${resetDate}.`,
      );
    }
  }
}
