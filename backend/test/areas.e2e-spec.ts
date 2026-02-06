import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request, { type Response as SupertestResponse } from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import type { AreaResponseDto } from '../src/areas/dto/area-response.dto';
import { ensureTestAuthEnv } from './utils/test-env';

ensureTestAuthEnv();

type LoginResponseBody = {
  access_token: string;
  token_type: 'Bearer';
  user: {
    id: string | number;
    email: string;
    roles: string[];
  };
};

type ServicesListResponse = {
  services: ServiceDefinition[];
};

type AreasListResponse = {
  areas: AreaResponseDto[];
};

type ServiceDefinition = {
  id: number;
  slug: string;
  name: string;
  actions: ServiceAction[];
  reactions: ServiceAction[];
};

type ServiceAction = {
  id: number;
  key: string;
  description: string | null;
  configSchema: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isServiceAction = (value: unknown): value is ServiceAction => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.key === 'string' &&
    ('description' in value
      ? value.description === null || typeof value.description === 'string'
      : true)
  );
};

const isServiceDefinition = (value: unknown): value is ServiceDefinition => {
  if (!isRecord(value)) {
    return false;
  }

  const { id, slug, name, actions, reactions } = value;
  if (
    typeof id !== 'number' ||
    typeof slug !== 'string' ||
    typeof name !== 'string' ||
    !Array.isArray(actions) ||
    !Array.isArray(reactions)
  ) {
    return false;
  }

  return actions.every(isServiceAction) && reactions.every(isServiceAction);
};

const isServicesListResponse = (
  value: unknown,
): value is ServicesListResponse => {
  if (!isRecord(value) || !Array.isArray(value.services)) {
    return false;
  }

  return value.services.every(isServiceDefinition);
};

const isAreaResponse = (value: unknown): value is AreaResponseDto => {
  if (!isRecord(value)) {
    return false;
  }

  const { id, name, enabled, action, reaction } = value;
  if (
    typeof id !== 'number' ||
    typeof name !== 'string' ||
    typeof enabled !== 'boolean' ||
    !isRecord(action) ||
    !isRecord(reaction)
  ) {
    return false;
  }

  return (
    typeof action.id === 'number' &&
    typeof action.key === 'string' &&
    isRecord(action.service) &&
    typeof action.service.id === 'number' &&
    typeof reaction.id === 'number' &&
    typeof reaction.key === 'string' &&
    isRecord(reaction.service) &&
    typeof reaction.service.id === 'number'
  );
};

const isAreasListResponse = (value: unknown): value is AreasListResponse => {
  if (!isRecord(value) || !Array.isArray(value.areas)) {
    return false;
  }

  return value.areas.every(isAreaResponse);
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

describe('Areas & Services API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Parameters<typeof request>[0];
  let database: DatabaseService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    database = app.get(DatabaseService);
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
  });

  beforeEach(async () => {
    await database.areaLog.deleteMany();
    await database.area.deleteMany();
    await database.token.deleteMany();
    await database.providerAccount.deleteMany();
    await database.reaction.deleteMany();
    await database.action.deleteMany();
    await database.service.deleteMany();
    await database.user.deleteMany();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const registerAndLogin = async () => {
    const credentials = {
      email: `area-user-${Date.now()}-${Math.random()}@example.com`,
      password: 'P@ssw0rd!',
    };

    await request(httpServer)
      .post('/auth/register')
      .send(credentials)
      .expect(201);

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    const loginBody = parseResponse(loginResponse, isLoginResponse);

    return {
      token: loginBody.access_token,
      userId: Number(loginBody.user.id),
    };
  };

  const seedServiceGraph = async () => {
    const service = await database.service.create({
      data: {
        slug: `test-service-${Date.now()}`,
        name: 'Test Service',
        enabled: true,
        actions: {
          create: [
            {
              key: 'event.created',
              description: 'When an event is created',
              configSchema: { fields: [] },
            },
          ],
        },
        reactions: {
          create: [
            {
              key: 'notify.user',
              description: 'Notify a user',
              configSchema: { template: 'default' },
            },
          ],
        },
      },
      include: {
        actions: true,
        reactions: true,
      },
    });

    await database.service.create({
      data: {
        slug: `disabled-service-${Date.now()}`,
        name: 'Disabled Service',
        enabled: false,
      },
    });

    return {
      service,
      action: service.actions[0],
      reaction: service.reactions[0],
    };
  };

  it('returns only enabled services with their actions and reactions', async () => {
    const { token } = await registerAndLogin();
    const { service, action, reaction } = await seedServiceGraph();

    const response = await request(httpServer)
      .get('/services')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const servicesBody = parseResponse(response, isServicesListResponse);

    expect(servicesBody.services).toHaveLength(1);

    const receivedService = servicesBody.services[0];
    expect(receivedService).toMatchObject({
      id: service.id,
      slug: service.slug,
      name: service.name,
    });
    expect(receivedService.actions).toHaveLength(1);
    expect(receivedService.actions[0]).toMatchObject({
      id: action.id,
      key: action.key,
      description: action.description,
    });
    expect(receivedService.reactions).toHaveLength(1);
    expect(receivedService.reactions[0]).toMatchObject({
      id: reaction.id,
      key: reaction.key,
      description: reaction.description,
    });
  });

  it('allows creating, listing, updating and deleting an area for the authenticated user', async () => {
    const { token, userId } = await registerAndLogin();
    const { action, reaction } = await seedServiceGraph();

    const createPayload = {
      name: 'Notify on event',
      actionId: action.id,
      reactionId: reaction.id,
      actionConfig: { channel: 'events' },
      reactionConfig: { destination: 'email' },
      dedupKeyStrategy: 'latest',
    };

    const createResponse = await request(httpServer)
      .post('/areas')
      .set('Authorization', `Bearer ${token}`)
      .send(createPayload)
      .expect(201);

    const createdArea = parseResponse(createResponse, isAreaResponse);

    expect(createdArea.name).toBe(createPayload.name);
    expect(createdArea.enabled).toBe(true);
    expect(createdArea.actionConfig).toEqual(createPayload.actionConfig);
    expect(createdArea.reactionConfig).toEqual(createPayload.reactionConfig);
    expect(createdArea.dedupKeyStrategy).toBe(createPayload.dedupKeyStrategy);
    expect(createdArea.action.id).toBe(action.id);
    expect(createdArea.action.key).toBe(action.key);
    expect(createdArea.reaction.id).toBe(reaction.id);
    expect(createdArea.reaction.key).toBe(reaction.key);

    const areaId = createdArea.id;

    const listResponse = await request(httpServer)
      .get('/areas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const areasBody = parseResponse(listResponse, isAreasListResponse);
    expect(areasBody.areas).toHaveLength(1);
    expect(areasBody.areas[0].id).toBe(areaId);

    const updateResponse = await request(httpServer)
      .put(`/areas/${areaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ enabled: false })
      .expect(200);

    const updatedArea = parseResponse(updateResponse, isAreaResponse);
    expect(updatedArea.enabled).toBe(false);

    await request(httpServer)
      .delete(`/areas/${areaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const postDeleteList = await request(httpServer)
      .get('/areas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const postDeleteBody = parseResponse(postDeleteList, isAreasListResponse);
    expect(postDeleteBody.areas).toHaveLength(0);

    const count = await database.area.count({ where: { userId } });
    expect(count).toBe(0);
  });
});
