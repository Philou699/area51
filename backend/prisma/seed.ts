import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

function toJsonValue(value: Record<string, unknown> | null) {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

type SeedAction = {
  key: string;
  description: string;
  configSchema: Record<string, unknown> | null;
};

type SeedReaction = {
  key: string;
  description: string;
  configSchema: Record<string, unknown> | null;
};

type ServiceSeed = {
  slug: string;
  name: string;
  actions: SeedAction[];
  reactions: SeedReaction[];
};

const serviceSeeds: ServiceSeed[] = [
  {
    slug: 'letterboxd',
    name: 'Letterboxd',
    actions: [
      {
        key: 'new_review',
        description: 'Déclenchée lorsqu’une nouvelle critique est publiée sur Letterboxd',
        configSchema: {
          type: 'object',
          required: ['username'],
          properties: {
            username: {
              type: 'string',
              description: "Nom d’utilisateur Letterboxd à surveiller",
            },
          },
        },
      },
      {
        key: 'new_diary_entry',
        description: 'Déclenchée lorsqu’un nouveau film est ajouté au journal',
        configSchema: {
          type: 'object',
          required: ['username'],
          properties: {
            username: {
              type: 'string',
              description: "Nom d’utilisateur Letterboxd à surveiller",
            },
          },
        },
      },
      {
        key: 'film_watched',
        description: 'Déclenchée lorsqu’un film est marqué comme vu',
        configSchema: {
          type: 'object',
          required: ['username'],
          properties: {
            username: {
              type: 'string',
              description: "Nom d’utilisateur Letterboxd à surveiller",
            },
          },
        },
      },
      {
        key: 'new_list',
        description: 'Déclenchée lorsqu’une nouvelle liste est créée',
        configSchema: {
          type: 'object',
          required: ['username'],
          properties: {
            username: {
              type: 'string',
              description: "Nom d’utilisateur Letterboxd à surveiller",
            },
          },
        },
      },
      {
        key: 'film_rated',
        description: 'Déclenchée lorsqu’un film est noté (1 à 5 étoiles)',
        configSchema: {
          type: 'object',
          required: ['username'],
          properties: {
            username: {
              type: 'string',
              description: "Nom d’utilisateur Letterboxd à surveiller",
            },
            minRating: {
              type: 'number',
              description: 'Note minimale pour déclencher (optionnelle)',
              minimum: 0,
              maximum: 5,
            },
          },
        },
      },
    ],
    reactions: [
      {
        key: 'send_webhook',
        description: 'Envoyer les informations du film vers une URL de webhook',
        configSchema: {
          type: 'object',
          required: ['webhookUrl'],
          properties: {
            webhookUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL du webhook à laquelle transmettre les données du film',
            },
            includeReview: {
              type: 'boolean',
              description: 'Inclure le texte de la critique dans la charge utile',
              default: true,
            },
          },
        },
      },
      {
        key: 'log_activity',
        description: 'Consigner l’activité Letterboxd dans les journaux',
        configSchema: {
          type: 'object',
          properties: {
            logLevel: {
              type: 'string',
              enum: ['info', 'debug', 'verbose'],
              default: 'info',
              description: 'Niveau de journalisation à utiliser',
            },
          },
        },
      },
    ],
  },
  {
    slug: 'github',
    name: 'GitHub',
    actions: [
      {
        key: 'new_issue',
        description: 'Déclenchée lorsqu’une nouvelle issue est créée sur un dépôt',
        configSchema: {
          type: 'object',
          required: ['owner', 'repo'],
          properties: {
            owner: {
              type: 'string',
              description: 'Organisation ou nom d’utilisateur GitHub',
            },
            repo: {
              type: 'string',
              description: 'Nom du dépôt',
            },
          },
        },
      },
      {
        key: 'new_pull_request',
        description: 'Déclenchée lorsqu’une nouvelle pull request est ouverte sur un dépôt',
        configSchema: {
          type: 'object',
          required: ['owner', 'repo'],
          properties: {
            owner: {
              type: 'string',
              description: 'Organisation ou nom d’utilisateur GitHub',
            },
            repo: {
              type: 'string',
              description: 'Nom du dépôt',
            },
          },
        },
      },
      {
        key: 'new_release',
        description: 'Déclenchée lorsqu’une nouvelle release est publiée',
        configSchema: {
          type: 'object',
          required: ['owner', 'repo'],
          properties: {
            owner: {
              type: 'string',
              description: 'Organisation ou nom d’utilisateur GitHub',
            },
            repo: {
              type: 'string',
              description: 'Nom du dépôt',
            },
          },
        },
      },
    ],
    reactions: [
      {
        key: 'send_webhook',
        description: 'Envoyer les détails de l’activité GitHub vers un webhook',
        configSchema: {
          type: 'object',
          required: ['webhookUrl'],
          properties: {
            webhookUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL du webhook à laquelle envoyer les données GitHub',
            },
            includeBody: {
              type: 'boolean',
              description: 'Inclure le contenu de l’issue/PR/release dans la charge utile',
              default: true,
            },
          },
        },
      },
    ],
  },
  {
    slug: 'discord',
    name: 'Discord',
    actions: [
      {
        key: 'new_channel_message',
        description: 'Déclenchée lorsqu’un nouveau message est publié dans le salon configuré',
        configSchema: {
          type: 'object',
          required: ['guildId', 'channelId'],
          additionalProperties: false,
          properties: {
            guildId: {
              type: 'string',
              description: 'Identifiant du serveur Discord à surveiller',
              format: 'discord-guild',
            },
            channelId: {
              type: 'string',
              description: 'Identifiant du salon Discord (snowflake) à surveiller',
              format: 'discord-channel',
            },
            allowBots: {
              type: 'boolean',
              description: 'Déclencher également sur les messages publiés par des bots',
              default: false,
            },
            allowedUserIds: {
              type: 'array',
              description: 'Liste optionnelle d’identifiants d’auteurs autorisés à déclencher l’action',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
      {
        key: 'message_contains_keyword',
        description: 'Déclenchée lorsqu’un message contient au moins un des mots-clés spécifiés',
        configSchema: {
          type: 'object',
          required: ['guildId', 'channelId', 'keywords'],
          additionalProperties: false,
          properties: {
            guildId: {
              type: 'string',
              description: 'Identifiant du serveur Discord à surveiller',
              format: 'discord-guild',
            },
            channelId: {
              type: 'string',
              description: 'Identifiant du salon Discord (snowflake) à surveiller',
              format: 'discord-channel',
            },
            keywords: {
              type: 'array',
              minItems: 1,
              description: 'Mots-clés recherchés (insensibles à la casse)',
              items: {
                type: 'string',
              },
            },
            allowBots: {
              type: 'boolean',
              description: 'Déclencher également sur les messages publiés par des bots',
              default: false,
            },
            allowedUserIds: {
              type: 'array',
              description: 'Liste optionnelle d’identifiants d’auteurs autorisés à déclencher l’action',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
      {
        key: 'message_with_attachment',
        description: 'Déclenchée lorsqu’un message contient au moins une pièce jointe',
        configSchema: {
          type: 'object',
          required: ['guildId', 'channelId'],
          additionalProperties: false,
          properties: {
            guildId: {
              type: 'string',
              description: 'Identifiant du serveur Discord à surveiller',
              format: 'discord-guild',
            },
            channelId: {
              type: 'string',
              description: 'Identifiant du salon Discord (snowflake) à surveiller',
              format: 'discord-channel',
            },
            allowBots: {
              type: 'boolean',
              description: 'Déclencher également sur les messages publiés par des bots',
              default: false,
            },
            allowedUserIds: {
              type: 'array',
              description: 'Liste optionnelle d’identifiants d’auteurs autorisés à déclencher l’action',
              items: {
                type: 'string',
              },
            },
            allowedContentTypes: {
              type: 'array',
              description: 'Liste optionnelle de types MIME requis dans les pièces jointes',
              items: {
                type: 'string',
              },
            },
            requireImage: {
              type: 'boolean',
              description: 'Exiger que la pièce jointe soit une image (type MIME commençant par image/)',
              default: false,
            },
          },
        },
      },
    ],
    reactions: [
      {
        key: 'send_channel_message',
        description: 'Envoyer un message texte dans un salon Discord',
        configSchema: {
          type: 'object',
          required: ['contentTemplate'],
          additionalProperties: false,
          properties: {
            guildId: {
              type: 'string',
              description: 'Identifiant de serveur Discord optionnel pour faciliter la sélection du salon',
              format: 'discord-guild',
            },
            channelId: {
              type: 'string',
              description: 'Identifiant du salon cible. Utilise le salon source si non renseigné.',
              format: 'discord-channel',
            },
            contentTemplate: {
              type: 'string',
              description:
                'Modèle de message acceptant des variables comme {{activity.title}} ou {{activity.author.username}}',
            },
            mentionRoleIds: {
              type: 'array',
              description: 'Liste optionnelle d’identifiants de rôles à mentionner dans le message',
              items: {
                type: 'string',
              },
            },
            mentionUserIds: {
              type: 'array',
              description: 'Liste optionnelle d’identifiants d’utilisateurs à mentionner dans le message',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
      {
        key: 'create_thread',
        description: 'Créer un fil de discussion dédié dans un salon Discord',
        configSchema: {
          type: 'object',
          required: ['guildId', 'channelId', 'threadNameTemplate'],
          additionalProperties: false,
          properties: {
            guildId: {
              type: 'string',
              description: 'Identifiant du serveur contenant le salon cible',
              format: 'discord-guild',
            },
            channelId: {
              type: 'string',
              description: 'Identifiant du salon dans lequel ouvrir le fil',
              format: 'discord-channel',
            },
            threadNameTemplate: {
              type: 'string',
              description:
                'Modèle du nom du thread (ex: "Suivi #{{activity.number}} - {{activity.title}}").',
            },
            starterMessageTemplate: {
              type: 'string',
              description:
                'Message optionnel publié automatiquement comme premier message du fil.',
            },
            autoArchiveDuration: {
              type: 'string',
              description:
                'Durée avant archivage automatique (minutes). Valeurs supportées : 60, 1440, 4320, 10080.',
              enum: ['60', '1440', '4320', '10080'],
              default: '1440',
            },
          },
        },
      },
    ],
  },
  {
    slug: 'openweather',
    name: 'OpenWeather',
    actions: [
      {
        key: 'temperature_below_x',
        description: 'Déclenchée lorsque la température est en dessous d\'un seuil',
        configSchema: {
          type: 'object',
          required: ['city', 'threshold'],
          properties: {
            city: {
              type: 'string',
              description: 'Nom de la ville (ex: Paris, Londres, New York)',
            },
            threshold: {
              type: 'number',
              description: 'Seuil de température en Celsius',
              minimum: -50,
              maximum: 60,
            },
          },
        },
      },
      {
        key: 'weather_condition_is',
        description: 'Déclenchée lorsque la météo actuelle correspond à une condition',
        configSchema: {
          type: 'object',
          required: ['city', 'condition'],
          properties: {
            city: {
              type: 'string',
              description: 'Nom de la ville (ex: Paris, Londres, New York)',
            },
            condition: {
              type: 'string',
              enum: ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Snow', 'Thunderstorm', 'Mist', 'Fog'],
              description: 'Condition météorologique à surveiller',
            },
          },
        },
      },
    ],
    reactions: [
      {
        key: 'send_webhook',
        description: 'Envoyer les données météorologiques vers une URL de webhook',
        configSchema: {
          type: 'object',
          required: ['webhookUrl'],
          properties: {
            webhookUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL du webhook pour envoyer les données météo',
            },
          },
        },
      },
      {
        key: 'log_activity',
        description: 'Consigner l\'activité météorologique dans les journaux',
        configSchema: {
          type: 'object',
          properties: {
            logLevel: {
              type: 'string',
              enum: ['info', 'debug', 'verbose'],
              default: 'info',
              description: 'Niveau de journalisation pour l\'activité',
            },
          },
        },
      },
    ],
  },
  {
    slug: 'spotify',
    name: 'Spotify',
    actions: [
      {
        key: 'new_liked_song',
        description: 'Nouvelle chanson aimée/sauvegardée',
        configSchema: {
          type: 'object',
          properties: {
            artistFilter: {
              type: 'string',
              description: 'Filtrer par nom d\'artiste (optionnel)',
            },
            genreFilter: {
              type: 'string',
              description: 'Filtrer par genre (optionnel)',
            },
          },
        },
      },
      {
        key: 'new_playlist_track',
        description: 'Morceau est ajouté à une playlist spécifique',
        configSchema: {
          type: 'object',
          required: ['playlistId'],
          properties: {
            playlistId: {
              type: 'string',
              description: 'ID de la playlist Spotify à surveiller',
            },
          },
        },
      },
      {
        key: 'now_playing_changed',
        description: 'Changement du morceau actuellement lu',
        configSchema: {
          type: 'object',
          properties: {
            artistFilter: {
              type: 'string',
              description: 'Filtrer par nom d\'artiste (optionnel)',
            },
          },
        },
      },
      {
        key: 'new_playlist_created',
        description: 'Nouvelle playlist est créée',
        configSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
    reactions: [
      {
        key: 'add_to_playlist',
        description: 'Ajouter un morceau à une playlist',
        configSchema: {
          type: 'object',
          required: ['playlistId'],
          properties: {
            playlistId: {
              type: 'string',
              description: 'ID de la playlist Spotify où ajouter les morceaux',
            },
          },
        },
      },
      {
        key: 'like_song',
        description: 'Aimer/sauvegarder le morceau actuel',
        configSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        key: 'create_playlist',
        description: 'Créer une nouvelle playlist',
        configSchema: {
          type: 'object',
          required: ['playlistName'],
          properties: {
            playlistName: {
              type: 'string',
              description: 'Nom de la nouvelle playlist',
            },
            description: {
              type: 'string',
              description: 'Description de la nouvelle playlist',
            },
            public: {
              type: 'boolean',
              default: false,
              description: 'Rendre la playlist publique',
            },
          },
        },
      },
      {
        key: 'follow_artist',
        description: 'Suivre un artiste',
        configSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  },
];

async function ensureService(seed: ServiceSeed): Promise<void> {
  const service = await prisma.service.upsert({
    where: { slug: seed.slug },
    update: {
      name: seed.name,
      enabled: true,
    },
    create: {
      slug: seed.slug,
      name: seed.name,
      enabled: true,
    },
  });

  console.log(`✅ Service prêt : ${seed.name}`);

  for (const action of seed.actions) {
    await prisma.action.upsert({
      where: {
        serviceId_key: {
          serviceId: service.id,
          key: action.key,
        },
      },
      update: {
        description: action.description,
        configSchema: toJsonValue(action.configSchema),
      },
      create: {
        serviceId: service.id,
        key: action.key,
        description: action.description,
        configSchema: toJsonValue(action.configSchema),
      },
    });

    console.log(`  ✅ Action disponible : ${action.key}`);
  }

  for (const reaction of seed.reactions) {
    await prisma.reaction.upsert({
      where: {
        serviceId_key: {
          serviceId: service.id,
          key: reaction.key,
        },
      },
      update: {
        description: reaction.description,
        configSchema: toJsonValue(reaction.configSchema),
      },
      create: {
        serviceId: service.id,
        key: reaction.key,
        description: reaction.description,
        configSchema: toJsonValue(reaction.configSchema),
      },
    });

    console.log(`  ✅ Réaction disponible : ${reaction.key}`);
  }
}

async function main() {
  console.log('🌱 Démarrage du remplissage de la base...');

  for (const serviceSeed of serviceSeeds) {
    await ensureService(serviceSeed);
  }

  console.log('🎉 Remplissage terminé avec succès !');
}

main()
  .catch((error) => {
    console.error('❌ Échec du remplissage', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
