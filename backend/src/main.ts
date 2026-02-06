import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildSwaggerConfig } from './swagger/swagger-config';
import { databaseSchemas } from './swagger/schemas/database-schemas';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for web client
  app.enableCors({
    origin: ['http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = buildSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  document.components = document.components ?? {};
  document.components.schemas = {
    ...(document.components.schemas ?? {}),
    ...databaseSchemas,
  };

  SwaggerModule.setup('docs', app, document);

  if (shouldExportOpenApi()) {
    exportOpenApiDocument(document);
  }

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();

function shouldExportOpenApi(): boolean {
  if (process.env.OPENAPI_EXPORT === 'true') {
    return true;
  }

  if (process.env.OPENAPI_EXPORT === 'false') {
    return false;
  }

  return process.env.NODE_ENV !== 'production';
}

function exportOpenApiDocument(
  document: ReturnType<typeof SwaggerModule.createDocument>,
): void {
  const specPath =
    process.env.OPENAPI_SPEC_PATH ??
    join(process.cwd(), 'docs', 'openapi.json');

  try {
    mkdirSync(dirname(specPath), { recursive: true });
    writeFileSync(specPath, JSON.stringify(document, null, 2), {
      encoding: 'utf-8',
    });
    // eslint-disable-next-line no-console -- makes spec generation explicit in dev logs
    console.log(`OpenAPI spec written to ${specPath}`);
  } catch (error) {
    // eslint-disable-next-line no-console -- surfacing failure to export spec is valuable
    console.error('Failed to persist OpenAPI spec', error);
  }
}
