import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe('Letterboxd E2E Tests', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let authToken: string;
  let testUserId: number;
  let testAreaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    database = moduleFixture.get<DatabaseService>(DatabaseService);

    // Create test user and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `letterboxd-test-${Date.now()}@example.com`,
        password: 'Test1234!',
      })
      .expect(201);

    testUserId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerResponse.body.user.email,
        password: 'Test1234!',
      })
      .expect(201);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Cleanup: delete test data
    if (testAreaId) {
      await database.area.delete({ where: { id: testAreaId } });
    }
    if (testUserId) {
      await database.user.delete({ where: { id: testUserId } });
    }

    await app.close();
  });

  describe('Full Letterboxd Area Workflow', () => {
    let serviceId: number;
    let actionId: number;
    let reactionId: number;

    it('should get available services including Letterboxd', async () => {
      const response = await request(app.getHttpServer())
        .get('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const letterboxdService = response.body.services.find(
        (s: any) => s.slug === 'letterboxd',
      );

      expect(letterboxdService).toBeDefined();
      expect(letterboxdService.name).toBe('Letterboxd');
      expect(letterboxdService.actions.length).toBeGreaterThan(0);
      expect(letterboxdService.reactions.length).toBeGreaterThan(0);

      serviceId = letterboxdService.id;
      actionId = letterboxdService.actions.find(
        (a: any) => a.key === 'new_diary_entry',
      )?.id;
      reactionId = letterboxdService.reactions.find(
        (r: any) => r.key === 'send_webhook',
      )?.id;

      expect(actionId).toBeDefined();
      expect(reactionId).toBeDefined();
    });

    it('should create a Letterboxd area', async () => {
      const response = await request(app.getHttpServer())
        .post('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Letterboxd Area',
          actionId,
          reactionId,
          actionConfig: {
            username: 'alness',
          },
          reactionConfig: {
            webhookUrl: 'https://webhook.site/test',
            includeReview: true,
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Letterboxd Area');
      expect(response.body.enabled).toBe(true);
      expect(response.body.actionConfig).toEqual({ username: 'alness' });
      expect(response.body.action.key).toBe('new_diary_entry');
      expect(response.body.reaction.key).toBe('send_webhook');

      testAreaId = response.body.id;
    });

    it('should list created areas', async () => {
      const response = await request(app.getHttpServer())
        .get('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.areas).toBeInstanceOf(Array);
      expect(response.body.areas.length).toBeGreaterThan(0);

      const testArea = response.body.areas.find(
        (a: any) => a.id === testAreaId,
      );
      expect(testArea).toBeDefined();
      expect(testArea.name).toBe('Test Letterboxd Area');
    });

    it('should test Letterboxd RSS feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username: 'alness' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'alness');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('activities');
      expect(Array.isArray(response.body.activities)).toBe(true);
    });

    it('should manually trigger polling', async () => {
      const response = await request(app.getHttpServer())
        .post('/letterboxd/poll')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Polling triggered successfully',
      );
    });

    it('should toggle area status', async () => {
      const disableResponse = await request(app.getHttpServer())
        .put(`/areas/${testAreaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ enabled: false })
        .expect(200);

      expect(disableResponse.body.enabled).toBe(false);

      const enableResponse = await request(app.getHttpServer())
        .put(`/areas/${testAreaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ enabled: true })
        .expect(200);

      expect(enableResponse.body.enabled).toBe(true);
    });

    it('should delete area', async () => {
      await request(app.getHttpServer())
        .delete(`/areas/${testAreaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const response = await request(app.getHttpServer())
        .get('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedArea = response.body.areas.find(
        (a: any) => a.id === testAreaId,
      );
      expect(deletedArea).toBeUndefined();

      testAreaId = null; // Prevent double deletion in afterAll
    });
  });

  describe('Letterboxd API Validation', () => {
    it('should reject area creation without username', async () => {
      const service = await database.service.findUnique({
        where: { slug: 'letterboxd' },
        include: { actions: true, reactions: true },
      });

      const actionId = service.actions.find(
        (a) => a.key === 'new_diary_entry',
      )?.id;
      const reactionId = service.reactions.find(
        (r) => r.key === 'send_webhook',
      )?.id;

      await request(app.getHttpServer())
        .post('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Area',
          actionId,
          reactionId,
          actionConfig: {}, // Missing username
          reactionConfig: {
            webhookUrl: 'https://webhook.site/test',
          },
        })
        .expect(400);
    });

    it('should reject area creation without webhookUrl', async () => {
      const service = await database.service.findUnique({
        where: { slug: 'letterboxd' },
        include: { actions: true, reactions: true },
      });

      const actionId = service.actions.find(
        (a) => a.key === 'new_diary_entry',
      )?.id;
      const reactionId = service.reactions.find(
        (r) => r.key === 'send_webhook',
      )?.id;

      await request(app.getHttpServer())
        .post('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Area',
          actionId,
          reactionId,
          actionConfig: {
            username: 'testuser',
          },
          reactionConfig: {}, // Missing webhookUrl
        })
        .expect(400);
    });

    it('should reject invalid Letterboxd username in test endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/letterboxd/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('error', 'Username is required');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests to /letterboxd/test', async () => {
      await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username: 'testuser' })
        .expect(401);
    });

    it('should reject unauthenticated requests to /letterboxd/poll', async () => {
      await request(app.getHttpServer())
        .post('/letterboxd/poll')
        .expect(401);
    });

    it('should reject invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/letterboxd/test')
        .query({ username: 'testuser' })
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
