import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { DiscordService } from '../discord/discord.service';

interface GithubAuthorizeResult {
  authorizeUrl: string;
  state: string;
}

interface GithubAccessTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

interface GithubUserProfile {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string;
}

interface DiscordAuthorizeResult {
  authorizeUrl: string;
  state: string;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

interface DiscordUserProfile {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

interface DiscordGuildSummary {
  id: string;
  name: string;
  owner: boolean;
  permissions?: string;
}

interface StoredState {
  userId: number;
  provider: 'github' | 'discord';
  expiresAt: number;
  redirectOrigin?: string;
}

interface ConnectionStatus {
  provider: string;
  connected: boolean;
  connectedAt?: string | null;
  details?: Record<string, unknown>;
}

export class ProviderAccountAlreadyConnectedError extends Error {
  constructor(
    public readonly provider: string,
    message = 'Provider account is already linked to another user.',
  ) {
    super(message);
    this.name = 'ProviderAccountAlreadyConnectedError';
  }
}

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_API_URL = 'https://api.github.com/user';
const GITHUB_PROVIDER_KEY = 'github';
const SPOTIFY_PROVIDER_KEY = 'spotify';

const DISCORD_AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_USER_URL = 'https://discord.com/api/users/@me';
const DISCORD_GUILDS_URL = 'https://discord.com/api/users/@me/guilds';
const DISCORD_PROVIDER_KEY = 'discord';

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);
  private readonly stateTtlMs = 5 * 60 * 1000; // 5 minutes
  private readonly stateStore = new Map<string, StoredState>();

  constructor(
    private readonly usersService: UsersService,
    private readonly database: DatabaseService,
    private readonly discordService: DiscordService,
  ) {}

  async startGithubConnection(
    userId: number,
    redirectOrigin?: string,
  ): Promise<GithubAuthorizeResult> {
    const { clientId, redirectUri, scope, prompt } =
      this.getGithubConfiguration();

    const state = randomUUID();
    this.storeState(state, userId, 'github', {
      redirectOrigin: this.normalizeFrontendOrigin(redirectOrigin),
    });

    const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('state', state);
    if (redirectUri) {
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    }
    authorizeUrl.searchParams.set('scope', scope);
    if (prompt) {
      authorizeUrl.searchParams.set('prompt', prompt);
    }

    return {
      authorizeUrl: authorizeUrl.toString(),
      state,
    };
  }

  async completeGithubConnection(
    code: string,
    state: string,
  ): Promise<{ userId: number; login: string; avatarUrl?: string | null }> {
    const storedState = this.consumeStateEntry(state, 'github');
    const userId = storedState.userId;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    const tokens = await this.exchangeGithubCode(code);
    const profile = await this.fetchGithubProfile(tokens.access_token);

    const existingAccount =
      await this.usersService.findProviderAccountByProviderUserId(
        GITHUB_PROVIDER_KEY,
        profile.id.toString(),
      );

    if (existingAccount && existingAccount.userId !== userId) {
      throw new ProviderAccountAlreadyConnectedError(GITHUB_PROVIDER_KEY);
    }

    await this.usersService.upsertProviderAccount({
      userId,
      provider: GITHUB_PROVIDER_KEY,
      providerUserId: profile.id.toString(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    });

    this.logger.log(
      `GitHub account connected for user ${userId} (${profile.login})`,
    );

    return {
      userId,
      login: profile.login,
      avatarUrl: profile.avatar_url ?? null,
    };
  }

  async startDiscordConnection(userId: number): Promise<DiscordAuthorizeResult> {
    const config = this.getDiscordConfiguration();

    const state = randomUUID();
    this.storeState(state, userId, 'discord');

    const authorizeUrl = new URL(DISCORD_AUTHORIZE_URL);
    authorizeUrl.searchParams.set('client_id', config.clientId);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', config.scope);
    authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('prompt', config.prompt ?? 'consent');
    authorizeUrl.searchParams.set('permissions', config.permissions);

    if (config.guildId) {
      authorizeUrl.searchParams.set('guild_id', config.guildId);
    }

    if (config.disableGuildSelect) {
      authorizeUrl.searchParams.set('disable_guild_select', 'true');
    }

    return {
      authorizeUrl: authorizeUrl.toString(),
      state,
    };
  }

  async completeDiscordConnection(
    userId: number,
    code: string,
    state: string,
    guildId?: string,
  ): Promise<{
    success: boolean;
    provider: string;
    account: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    guild?: {
      id: string;
      name: string;
      owner: boolean;
      permissions?: string;
    };
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    this.consumeStateEntry(state, 'discord', userId);

    const tokens = await this.exchangeDiscordCode(code);
    const profile = await this.fetchDiscordProfile(tokens.access_token);

    const existingAccount =
      await this.usersService.findProviderAccountByProviderUserId(
        DISCORD_PROVIDER_KEY,
        profile.id,
      );

    if (existingAccount && existingAccount.userId !== userId) {
      throw new BadRequestException(
        'Ce compte Discord est déjà connecté via un autre utilisateur. Déconnectez-le avant de recommencer.',
      );
    }

    let guildDetails: DiscordGuildSummary | null = null;
    if (guildId) {
      const guilds = await this.fetchDiscordGuilds(tokens.access_token);
      guildDetails = guilds.find((guild) => guild.id === guildId) ?? null;
    }

    await this.usersService.upsertProviderAccount({
      userId,
      provider: DISCORD_PROVIDER_KEY,
      providerUserId: profile.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    });

    return {
      success: true,
      provider: DISCORD_PROVIDER_KEY,
      account: {
        id: profile.id,
        username: profile.username,
        displayName: profile.global_name ?? null,
        avatarUrl: profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null,
      },
      guild: guildDetails
        ? {
            id: guildDetails.id,
            name: guildDetails.name,
            owner: guildDetails.owner,
            permissions: guildDetails.permissions,
          }
        : guildId
        ? {
            id: guildId,
            name: 'Serveur connecté',
            owner: false,
          }
        : undefined,
    };
  }

  async getConnectionStatuses(userId: number): Promise<ConnectionStatus[]> {
    const accounts = await this.database.providerAccount.findMany({
      where: {
        userId,
      },
    });

    const githubAccount = accounts.find(
      (account) => account.provider === GITHUB_PROVIDER_KEY,
    );
    const discordAccount = accounts.find(
      (account) => account.provider === DISCORD_PROVIDER_KEY,
    );

    const spotifyAccount = accounts.find(
      (account) => account.provider === SPOTIFY_PROVIDER_KEY,
    );

    return [
      {
        provider: GITHUB_PROVIDER_KEY,
        connected: Boolean(githubAccount),
        connectedAt: githubAccount
          ? githubAccount.createdAt.toISOString()
          : null,
      },
      {
        provider: SPOTIFY_PROVIDER_KEY,
        connected: Boolean(spotifyAccount),
        connectedAt: spotifyAccount
          ? spotifyAccount.createdAt.toISOString()
          : null,
      },
      {
        provider: DISCORD_PROVIDER_KEY,
        connected: Boolean(discordAccount),
        connectedAt: discordAccount
          ? discordAccount.createdAt.toISOString()
          : null,
        details: discordAccount
          ? {
              userId: discordAccount.providerUserId,
            }
          : undefined,
      },
    ];
  }

  async disconnectGithubAccount(userId: number): Promise<void> {
    const account = await this.usersService.findProviderAccount(
      userId,
      GITHUB_PROVIDER_KEY,
    );

    if (!account) {
      return;
    }

    await this.revokeGithubToken(account.accessToken).catch((error) =>
      this.logger.warn(
        `Unable to revoke GitHub token for user ${userId}: ${error.message}`,
      ),
    );

    await this.removeProviderAccount(userId, GITHUB_PROVIDER_KEY);
  }

  async disconnectDiscordAccount(userId: number): Promise<void> {
    await this.removeProviderAccount(userId, DISCORD_PROVIDER_KEY);
  }

  async disconnectSpotifyAccount(userId: number): Promise<void> {
    await this.removeProviderAccount(userId, SPOTIFY_PROVIDER_KEY);
  }

  private getGithubConfiguration(): {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
    prompt?: string;
  } {
    const clientId =
      process.env.GITHUB_OAUTH_CLIENT_ID ??
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
    const redirectUri =
      process.env.GITHUB_OAUTH_REDIRECT_URI ??
      process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI ??
      '';
    const scope =
      process.env.GITHUB_OAUTH_SCOPE ??
      process.env.NEXT_PUBLIC_GITHUB_SCOPE ??
      'repo user';
    const prompt =
      process.env.GITHUB_OAUTH_PROMPT ??
      process.env.NEXT_PUBLIC_GITHUB_OAUTH_PROMPT ??
      'select_account';

    if (!clientId) {
      throw new InternalServerErrorException(
        'GitHub OAuth client ID is not configured.',
      );
    }

    if (!clientSecret) {
      throw new InternalServerErrorException(
        'GitHub OAuth client secret is not configured.',
      );
    }

    if (!redirectUri) {
      throw new InternalServerErrorException(
        'GitHub OAuth redirect URI is not configured.',
      );
    }

    return { clientId, clientSecret, redirectUri, scope, prompt };
  }

  private async revokeGithubToken(accessToken: string): Promise<void> {
    const { clientId, clientSecret } = this.getGithubConfiguration();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch(`https://api.github.com/applications/${clientId}/grant`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(
        `GitHub revoke returned ${response.status} ${response.statusText}: ${errorText}`,
      );
    }
  }

  private async exchangeGithubCode(
    code: string,
  ): Promise<GithubAccessTokenResponse> {
    const { clientId, clientSecret, redirectUri } =
      this.getGithubConfiguration();

    const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `GitHub token exchange failed: ${response.status} ${errorText}`,
      );
      throw new BadRequestException(
        'Impossible de finaliser la connexion GitHub.',
      );
    }

    const payload = (await response.json()) as
      | GithubAccessTokenResponse
      | { error: string; error_description?: string };

    if ('error' in payload) {
      this.logger.error(
        `GitHub token exchange returned error: ${payload.error} ${payload.error_description}`,
      );
      throw new BadRequestException(
        payload.error_description ??
          'GitHub a refusé la connexion. Veuillez réessayer.',
      );
    }

    if (!payload.access_token) {
      throw new BadRequestException(
        'GitHub a renvoyé une réponse invalide (pas de jeton).',
      );
    }

    return payload;
  }

  private async fetchGithubProfile(
    accessToken: string,
  ): Promise<GithubUserProfile> {
    const response = await fetch(GITHUB_USER_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `GitHub profile fetch failed: ${response.status} ${errorText}`,
      );
      throw new BadRequestException(
        'Impossible de récupérer votre profil GitHub.',
      );
    }

    const profile = (await response.json()) as GithubUserProfile;

    if (!profile?.id || !profile?.login) {
      throw new BadRequestException(
        'Profil GitHub incomplet. Veuillez réessayer.',
      );
    }

    return profile;
  }

  private getDiscordConfiguration(): {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
    permissions: string;
    prompt?: string;
    guildId?: string;
    disableGuildSelect: boolean;
  } {
    const clientId =
      process.env.DISCORD_CLIENT_ID ??
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri =
      process.env.DISCORD_REDIRECT_URI ??
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;
    const scope =
      process.env.DISCORD_OAUTH_SCOPE ??
      process.env.DISCORD_OAUTH_SCOPES ??
      'identify guilds bot';
    const permissions =
      process.env.DISCORD_BOT_PERMISSIONS ?? '3072'; // Send Messages + Read Message History
    const prompt = process.env.DISCORD_OAUTH_PROMPT ?? undefined;
    const guildId = process.env.DISCORD_DEFAULT_GUILD_ID ?? undefined;
    const disableGuildSelect =
      process.env.DISCORD_DISABLE_GUILD_SELECT === 'true';

    if (!clientId) {
      throw new InternalServerErrorException(
        'Discord client ID is not configured.',
      );
    }
    if (!clientSecret) {
      throw new InternalServerErrorException(
        'Discord client secret est manquant.',
      );
    }
    if (!redirectUri) {
      throw new InternalServerErrorException(
        'Discord redirect URI est manquant.',
      );
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
      scope,
      permissions,
      prompt,
      guildId,
      disableGuildSelect,
    };
  }

  private async exchangeDiscordCode(code: string): Promise<DiscordTokenResponse> {
    const { clientId, clientSecret, redirectUri } =
      this.getDiscordConfiguration();

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Discord token exchange failed: ${response.status} ${errorText}`,
      );
      throw new BadRequestException(
        'Impossible de finaliser la connexion Discord.',
      );
    }

    const payload = (await response.json()) as
      | DiscordTokenResponse
      | { error: string; error_description?: string };

    if ('error' in payload) {
      this.logger.error(
        `Discord token exchange returned error: ${payload.error} ${payload.error_description}`,
      );
      throw new BadRequestException(
        payload.error_description ??
          'Discord a refusé la connexion. Veuillez réessayer.',
      );
    }

    if (!payload.access_token) {
      throw new BadRequestException(
        'Discord a renvoyé une réponse invalide (pas de jeton).',
      );
    }

    return payload;
  }

  private async fetchDiscordProfile(
    accessToken: string,
  ): Promise<DiscordUserProfile> {
    const response = await fetch(DISCORD_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Discord profile fetch failed: ${response.status} ${errorText}`,
      );
      throw new BadRequestException(
        'Impossible de récupérer votre profil Discord.',
      );
    }

    const profile = (await response.json()) as DiscordUserProfile;

    if (!profile?.id || !profile?.username) {
      throw new BadRequestException(
        'Profil Discord incomplet. Veuillez réessayer.',
      );
    }

    return profile;
  }

  private async fetchDiscordGuilds(
    accessToken: string,
  ): Promise<DiscordGuildSummary[]> {
    const response = await fetch(DISCORD_GUILDS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        this.logger.warn(
          'Discord guild fetch forbidden. Le scope "guilds" est peut-être manquant.',
        );
        return [];
      }
      const errorText = await response.text();
      this.logger.error(
        `Discord guild fetch failed: ${response.status} ${errorText}`,
      );
      return [];
    }

    const guilds = (await response.json()) as Array<{
      id: string;
      name: string;
      owner: boolean;
      permissions?: string | number;
    }>;

    return guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      owner: guild.owner,
      permissions:
        guild.permissions !== undefined
          ? String(guild.permissions)
          : undefined,
    }));
  }

  async listDiscordGuilds(userId: number): Promise<DiscordGuildSummary[]> {
    const account = await this.usersService.findProviderAccount(
      userId,
      DISCORD_PROVIDER_KEY,
    );

    if (!account) {
      throw new BadRequestException(
        'Aucune connexion Discord active. Veuillez connecter Discord avant de sélectionner un serveur.',
      );
    }

    if (!account.accessToken) {
      throw new BadRequestException(
        'Le jeton Discord est manquant. Veuillez reconnecter votre compte.',
      );
    }

    return this.fetchDiscordGuilds(account.accessToken);
  }

  async listDiscordChannels(
    userId: number,
    guildId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: number;
      parentId: string | null;
      categoryName: string | null;
    }>
  > {
    const guilds = await this.listDiscordGuilds(userId);
    const guild = guilds.find((entry) => entry.id === guildId);

    if (!guild) {
      throw new BadRequestException(
        "Ce serveur ne fait pas partie de vos autorisations Discord.",
      );
    }

    const channels = await this.discordService.listGuildChannels(guildId);

    const categories = new Map<string, string>();
    for (const channel of channels) {
      if (channel.type === 4) {
        categories.set(channel.id, channel.name);
      }
    }

    return channels
      .filter((channel) =>
        [0, 5, 10, 11, 12, 13, 15].includes(channel.type as number),
      )
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parentId: channel.parentId,
        categoryName: channel.parentId
          ? categories.get(channel.parentId) ?? null
          : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private storeState(
    state: string,
    userId: number,
    provider: 'github' | 'discord',
    metadata: { redirectOrigin?: string } = {},
  ): void {
    this.pruneExpiredStates();
    this.stateStore.set(state, {
      userId,
      provider,
      expiresAt: Date.now() + this.stateTtlMs,
      ...metadata,
    });
  }

  private normalizeFrontendOrigin(
    origin?: string | null,
  ): string | undefined {
    if (!origin) {
      return undefined;
    }

    try {
      const parsed = new URL(origin);
      if (
        parsed.protocol !== 'http:' &&
        parsed.protocol !== 'https:'
      ) {
        return undefined;
      }
      return parsed.origin;
    } catch {
      return undefined;
    }
  }

  getStateRedirectOrigin(
    state: string,
    provider: 'github' | 'discord',
  ): string | undefined {
    const entry = this.stateStore.get(state);

    if (!entry) {
      return undefined;
    }

    if (entry.provider !== provider) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.stateStore.delete(state);
      return undefined;
    }

    return entry.redirectOrigin;
  }

  private consumeStateEntry(
    state: string,
    provider: 'github' | 'discord',
    userId?: number,
  ): StoredState {
    const entry = this.stateStore.get(state);

    if (!entry) {
      throw new BadRequestException('Invalid or expired state parameter');
    }

    if (entry.provider !== provider) {
      this.stateStore.delete(state);
      throw new BadRequestException('State provider mismatch');
    }

    if (typeof userId === 'number' && entry.userId !== userId) {
      this.stateStore.delete(state);
      throw new BadRequestException(
        'State does not match the authenticated user',
      );
    }

    if (Date.now() > entry.expiresAt) {
      this.stateStore.delete(state);
      throw new BadRequestException('State has expired, please retry.');
    }

    this.stateStore.delete(state);
    return entry;
  }

  private async removeProviderAccount(
    userId: number,
    provider: string,
  ): Promise<void> {
    const existing = await this.usersService.findProviderAccount(
      userId,
      provider,
    );

    if (!existing) {
      return;
    }

    await this.database.providerAccount.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  private pruneExpiredStates(): void {
    const now = Date.now();
    for (const [key, value] of this.stateStore.entries()) {
      if (value.expiresAt <= now) {
        this.stateStore.delete(key);
      }
    }
  }
}
