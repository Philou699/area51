import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { buildSwaggerConfig } from '../swagger/swagger-config';

async function generateOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  try {
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    persistDocument(document);
    // eslint-disable-next-line no-console -- make the output visible when the command succeeds
    console.log('OpenAPI spec exported successfully');
  } finally {
    await app.close();
  }
}

function persistDocument(
  document: ReturnType<typeof SwaggerModule.createDocument>,
): void {
  const specPath =
    process.env.OPENAPI_SPEC_PATH ??
    join(process.cwd(), 'docs', 'openapi.json');

  mkdirSync(dirname(specPath), { recursive: true });
  writeFileSync(specPath, JSON.stringify(document, null, 2), {
    encoding: 'utf-8',
  });
}

generateOpenApi().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- surfacing spec generation errors is useful for DX
  console.error('Failed to export OpenAPI spec', error);
  process.exitCode = 1;
});
