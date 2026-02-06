import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request, { type Response as SupertestResponse } from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { ensureTestAuthEnv, sanitizePem } from './utils/test-env';

ensureTestAuthEnv();

const log = (...args: unknown[]) => {
  console.info('[auth.e2e]', ...args);
};

type RegisterResponseBody = {
  message: string;
  user: {
    id: number;
    email: string;
  };
};

type LoginResponseBody = {
  access_token: string;
  token_type: 'Bearer';
  user: {
    id: string | number;
    email: string;
    roles: string[];
  };
};

type ErrorResponseBody = {
  statusCode: number;
  message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

type VerifiedPayload = {
  email: string;
  sub: string;
  roles: unknown;
};

const isRegisterResponse = (value: unknown): value is RegisterResponseBody => {
  if (!isRecord(value)) {
    return false;
  }

  const { message, user } = value;
  if (typeof message !== 'string' || !isRecord(user)) {
    return false;
  }

  return typeof user.email === 'string' && typeof user.id === 'number';
};

const isLoginResponse = (value: unknown): value is LoginResponseBody => {
  if (!isRecord(value)) {
    return false;
  }

  const { access_token: accessToken, token_type: tokenType, user } = value;
  if (
    typeof accessToken !== 'string' ||
    tokenType !== 'Bearer' ||
    !isRecord(user)
  ) {
    return false;
  }

  const { id, email, roles } = user;
  return (
    (typeof id === 'string' || typeof id === 'number') &&
    typeof email === 'string' &&
    isStringArray(roles)
  );
};

const isErrorResponse = (value: unknown): value is ErrorResponseBody => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.statusCode === 'number' && typeof value.message === 'string'
  );
};

const isJwtVerificationPayload = (value: unknown): value is VerifiedPayload => {
  if (!isRecord(value)) {
    return false;
  }

  const { email, sub } = value;
  return typeof email === 'string' && typeof sub === 'string';
};

const parseResponse = <T>(
  response: SupertestResponse,
  guard: (value: unknown) => value is T,
): T => {
  const body: unknown = response.body;
  if (!guard(body)) {
    throw new Error(`Unexpected response body: ${JSON.stringify(body)}`);
  }
  return body;
};

describe('Auth flows (e2e)', () => {
  let app: INestApplication;
  let httpServer: Parameters<typeof request>[0];
  let database: DatabaseService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    database = app.get(DatabaseService);
    jwtService = app.get(JwtService);
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    await database.token.deleteMany();
    await database.user.deleteMany();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createCredentials = () => ({
    email: `test-user-${Date.now()}-${Math.random()}@example.com`,
    password: 'P@ssw0rd!',
  });

  it('enregistre un utilisateur puis permet la connexion avec retour des tokens', async () => {
    const credentials = createCredentials();

    log('register:start', { email: credentials.email });
    const registerResponse = await request(httpServer)
      .post('/auth/register')
      .send(credentials)
      .expect(201);

    const registerBody = parseResponse(registerResponse, isRegisterResponse);
    log('register:success', { userId: registerBody.user.id });

    expect(registerBody.message).toBe('User successfully registered');
    expect(registerBody.user.email).toBe(credentials.email.toLowerCase());
    expect(typeof registerBody.user.id).toBe('number');

    log('login:start', { email: credentials.email });
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    const loginBody = parseResponse(loginResponse, isLoginResponse);
    log('login:success', { userId: loginBody.user.id });

    expect(typeof loginBody.access_token).toBe('string');
    expect(loginBody.token_type).toBe('Bearer');
    expect(loginBody.user.email).toBe(credentials.email.toLowerCase());
    expect(['string', 'number']).toContain(typeof loginBody.user.id);

    const rawCookieHeader: unknown = loginResponse.headers['set-cookie'];
    const cookieArray = Array.isArray(rawCookieHeader)
      ? rawCookieHeader.filter(
          (cookie): cookie is string => typeof cookie === 'string',
        )
      : typeof rawCookieHeader === 'string'
        ? [rawCookieHeader]
        : [];
    const refreshCookie = cookieArray.find((cookie) =>
      cookie.startsWith('refresh_token='),
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');

    const accessToken = loginBody.access_token;
    log('login:verifyAccessToken:start');
    const rawPayload: unknown = await jwtService.verifyAsync(accessToken, {
      algorithms: ['RS256'],
      publicKey: sanitizePem(process.env.JWT_ACCESS_PUBLIC_KEY),
    });
    if (!isJwtVerificationPayload(rawPayload)) {
      throw new Error('Invalid JWT payload received');
    }
    const payload = rawPayload;
    log('login:verifyAccessToken:success', {
      subject: payload.sub,
      roles: payload.roles,
    });

    expect(payload.email).toBe(credentials.email.toLowerCase());
    expect(payload.sub).toBe(String(loginBody.user.id));
    const roles = payload.roles;
    expect(Array.isArray(roles)).toBe(true);
    if (Array.isArray(roles)) {
      expect(roles).toContain('user');
    }
  });

  it('refuse la connexion avec un mot de passe invalide', async () => {
    const credentials = createCredentials();

    log('invalidPassword:register:start', { email: credentials.email });
    await request(httpServer)
      .post('/auth/register')
      .send(credentials)
      .expect(201);
    log('invalidPassword:register:success');

    log('invalidPassword:loginAttempt:start');
    const failedLogin = await request(httpServer)
      .post('/auth/login')
      .send({ email: credentials.email, password: 'WrongPass123!' })
      .expect(401);

    const errorBody = parseResponse(failedLogin, isErrorResponse);
    log('invalidPassword:loginAttempt:failed', {
      statusCode: errorBody.statusCode,
    });

    expect(errorBody).toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });
});
