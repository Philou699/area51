import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OpenWeather Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/openweather/current (GET)', () => {
    it('should return weather data for a valid city', () => {
      if (!process.env.OPENWEATHER_API_KEY) {
        console.log('Skipping test: OPENWEATHER_API_KEY not set');
        return;
      }

      return request(app.getHttpServer())
        .get('/openweather/current?city=Paris')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('city');
          expect(res.body).toHaveProperty('temperature');
          expect(res.body).toHaveProperty('condition');
          expect(res.body).toHaveProperty('humidity');
          expect(res.body).toHaveProperty('windSpeed');
        });
    });

    it('should return error for missing city parameter', () => {
      return request(app.getHttpServer())
        .get('/openweather/current')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toContain('City parameter is required');
        });
    });
  });

  describe('/about.json (GET)', () => {
    it('should include openweather service in about.json', () => {
      return request(app.getHttpServer())
        .get('/about.json')
        .expect(200)
        .expect((res) => {
          const openweatherService = res.body.server.services.find(
            (s: any) => s.name === 'openweather'
          );

          expect(openweatherService).toBeDefined();
          expect(openweatherService.actions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: 'temperature_below_x',
                description: expect.any(String),
              }),
              expect.objectContaining({
                name: 'weather_condition_is',
                description: expect.any(String),
              }),
            ])
          );
        });
    });
  });
});
