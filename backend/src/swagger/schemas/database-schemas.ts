import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

type SchemaRecord = Record<string, SchemaObject>;

export const databaseSchemas: SchemaRecord = {
  TokenType: {
    type: 'string',
    enum: ['REFRESH', 'VERIFY_EMAIL', 'RESET_PASSWORD'],
    example: 'REFRESH',
    description: 'Type de jeton applicatif enregistré en base',
  },
  AreaLogStatus: {
    type: 'string',
    enum: ['success', 'failure', 'skipped'],
    example: 'success',
    description: 'Résultat enregistré pour l’exécution d’une automatisation',
  },
  DatabaseUser: {
    type: 'object',
    required: ['id', 'email', 'passwordHash', 'createdAt', 'updatedAt'],
    properties: {
      id: { type: 'integer', example: 1 },
      email: { type: 'string', format: 'email', example: 'user@example.com' },
      passwordHash: {
        type: 'string',
        description: 'Mot de passe haché avec Argon2',
        example: '$argon2id$v=19$m=65536,t=3,p=1$...'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-10T15:30:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-15T12:00:00.000Z',
      },
    },
  },
  DatabaseProviderAccount: {
    type: 'object',
    required: [
      'id',
      'userId',
      'provider',
      'providerUserId',
      'accessToken',
      'createdAt',
    ],
    properties: {
      id: { type: 'integer', example: 42 },
      userId: { type: 'integer', example: 1 },
      provider: { type: 'string', example: 'github' },
      providerUserId: { type: 'string', example: '1234567' },
      accessToken: { type: 'string', example: 'gho_xxxxxxxxx' },
      refreshToken: {
        type: 'string',
        nullable: true,
        example: 'ghr_xxxxxxxxx',
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2025-02-01T00:00:00.000Z',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-05T10:00:00.000Z',
      },
    },
  },
  DatabaseService: {
    type: 'object',
    required: ['id', 'slug', 'name', 'enabled', 'createdAt'],
    properties: {
      id: { type: 'integer', example: 7 },
      slug: { type: 'string', example: 'github' },
      name: { type: 'string', example: 'GitHub' },
      enabled: { type: 'boolean', example: true },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-01T12:00:00.000Z',
      },
    },
  },
  DatabaseAction: {
    type: 'object',
    required: ['id', 'serviceId', 'key', 'createdAt'],
    properties: {
      id: { type: 'integer', example: 11 },
      serviceId: { type: 'integer', example: 7 },
      key: { type: 'string', example: 'issue_opened' },
      description: { type: 'string', nullable: true, example: 'New issue' },
      configSchema: {
        type: 'object',
        nullable: true,
        example: {
          type: 'object',
          properties: {
            repo: { type: 'string' },
          },
        },
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-02T08:45:00.000Z',
      },
    },
  },
  DatabaseReaction: {
    type: 'object',
    required: ['id', 'serviceId', 'key', 'createdAt'],
    properties: {
      id: { type: 'integer', example: 18 },
      serviceId: { type: 'integer', example: 7 },
      key: { type: 'string', example: 'send_notification' },
      description: {
        type: 'string',
        nullable: true,
        example: 'Envoyer une notification Slack',
      },
      configSchema: {
        type: 'object',
        nullable: true,
        example: {
          type: 'object',
          properties: {
            channel: { type: 'string' },
          },
        },
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-02T09:00:00.000Z',
      },
    },
  },
  DatabaseArea: {
    type: 'object',
    required: [
      'id',
      'userId',
      'actionId',
      'reactionId',
      'name',
      'enabled',
      'createdAt',
    ],
    properties: {
      id: { type: 'integer', example: 101 },
      userId: { type: 'integer', example: 1 },
      actionId: { type: 'integer', example: 11 },
      reactionId: { type: 'integer', example: 18 },
      name: { type: 'string', example: 'M’avertir des nouvelles issues' },
      enabled: { type: 'boolean', example: true },
      actionConfig: {
        type: 'object',
        nullable: true,
        example: { repo: 'area-backend' },
      },
      reactionConfig: {
        type: 'object',
        nullable: true,
        example: { channel: '#alerts' },
      },
      dedupKeyStrategy: {
        type: 'string',
        nullable: true,
        example: 'payload-hash',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-03T14:00:00.000Z',
      },
    },
  },
  DatabaseAreaLog: {
    type: 'object',
    required: ['id', 'areaId', 'status', 'triggeredAt'],
    properties: {
      id: { type: 'integer', example: 9001 },
      areaId: { type: 'integer', example: 101 },
      status: {
        $ref: '#/components/schemas/AreaLogStatus',
      },
      triggeredAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-15T08:30:00.000Z',
      },
      payload: { type: 'object', nullable: true },
      error: {
        type: 'string',
        nullable: true,
        example: 'La requête a expiré',
      },
    },
  },
  DatabaseToken: {
    type: 'object',
    required: ['id', 'userId', 'type', 'hashed', 'createdAt'],
    properties: {
      id: { type: 'integer', example: 305 },
      userId: { type: 'integer', example: 1 },
      type: { $ref: '#/components/schemas/TokenType' },
      hashed: { type: 'string', example: 'b109f3bbbc244eb...' },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2025-01-20T10:00:00.000Z',
      },
      revokedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-05T09:00:00.000Z',
      },
    },
  },
  DatabaseWebhookEvent: {
    type: 'object',
    required: ['id', 'serviceId', 'externalId', 'receivedAt'],
    properties: {
      id: { type: 'integer', example: 77 },
      serviceId: { type: 'integer', example: 7 },
      externalId: { type: 'string', example: 'evt_abc123' },
      receivedAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-12T16:45:00.000Z',
      },
      payload: { type: 'object', nullable: true },
    },
  },
};
