import { DocumentBuilder } from '@nestjs/swagger';

export const buildSwaggerConfig = (): ReturnType<DocumentBuilder['build']> =>
  new DocumentBuilder()
    .setTitle('Area API')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
