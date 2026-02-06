# Documentation des endpoints

Cette documentation présente tous les endpoints API disponibles dans le projet Area51.

**Base URL** : `http://localhost:8080`

---

## Table des matières

- [Authentification](#authentification)
- [Areas (Automatisations)](#areas)
- [Services](#services)
- [Connexions (OAuth)](#connexions)
- [GitHub](#github)
- [Meta](#meta)

---

## Authentification

Endpoints pour l'inscription, la connexion et l'authentification OAuth.

### POST `/auth/register`

Crée un nouveau compte utilisateur.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse 201** :
```json
{
  "message": "Utilisateur créé avec succès",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Erreurs** :
- `400` : Validation échouée
- `409` : Email déjà utilisé

---

### POST `/auth/login`

Authentifie un utilisateur par email et mot de passe.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123!"
}
```

**Réponse 200** :
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Erreurs** :
- `400` : Validation échouée
- `401` : Identifiants invalides
- `429` : Trop de tentatives

---

### POST `/auth/logout`

Déconnecte l'utilisateur en révoquant le cookie de rafraîchissement.

**Réponse 204** : Aucun contenu

---

### POST `/auth/oauth2/google`

Authentifie un utilisateur via Google OAuth.

**Body** :
```json
{
  "token": "google_id_token_here"
}
```

**Réponse 200** :
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Erreurs** :
- `400` : Token Google invalide ou OAuth non configuré

---

### GET `/auth/spotify`

Lance le flux OAuth Spotify. Redirige vers la page d'autorisation Spotify.

**Query Parameters** :
- `token` (optionnel) : JWT token d'accès

**Redirection** : Vers `https://accounts.spotify.com/authorize`

---

### GET `/auth/spotify/callback`

Callback OAuth Spotify. Traite le code d'autorisation et enregistre la connexion.

**Query Parameters** :
- `code` : Code d'autorisation Spotify
- `state` : Paramètre d'état contenant l'ID utilisateur
- `error` (optionnel) : Erreur renvoyée par Spotify

**Redirection** :
- Succès : `${FRONTEND_URL}/connections?success=spotify_connected`
- Erreur : `${FRONTEND_URL}/connections?error=...`

---

## Areas

Gestion des automatisations (areas) reliant une action à une réaction.

**⚠️ Tous les endpoints nécessitent une authentification Bearer Token**

### POST `/areas`

Crée une nouvelle area.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Body** :
```json
{
  "name": "Notification nouveau commit",
  "actionId": 1,
  "reactionId": 5,
  "actionConfig": {
    "owner": "username",
    "repo": "my-repo",
    "branch": "main"
  },
  "reactionConfig": {
    "channelId": "123456789",
    "message": "Nouveau commit détecté !"
  },
  "enabled": true
}
```

**Réponse 201** :
```json
{
  "id": 42,
  "name": "Notification nouveau commit",
  "actionId": 1,
  "reactionId": 5,
  "actionConfig": { ... },
  "reactionConfig": { ... },
  "enabled": true,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Erreurs** :
- `400` : Validation échouée ou action/réaction non disponible
- `401` : Non authentifié

---

### GET `/areas`

Liste toutes les areas de l'utilisateur authentifié.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "areas": [
    {
      "id": 42,
      "name": "Notification nouveau commit",
      "actionId": 1,
      "reactionId": 5,
      "enabled": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### PUT `/areas/:id`

Active ou désactive une area.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Parameters** :
- `id` : ID de l'area (number)

**Body** :
```json
{
  "enabled": false
}
```

**Réponse 200** :
```json
{
  "id": 42,
  "name": "Notification nouveau commit",
  "enabled": false,
  ...
}
```

**Erreurs** :
- `400` : Validation échouée
- `404` : Area non trouvée

---

### PATCH `/areas/:id`

Met à jour les métadonnées ou la configuration d'une area.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Parameters** :
- `id` : ID de l'area (number)

**Body** :
```json
{
  "name": "Nouveau nom",
  "actionConfig": {
    "branch": "develop"
  }
}
```

**Réponse 200** : Area mise à jour

**Erreurs** :
- `400` : Validation échouée
- `404` : Area non trouvée

---

### DELETE `/areas/:id`

Supprime une area.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Parameters** :
- `id` : ID de l'area (number)

**Réponse 204** : Aucun contenu

**Erreurs** :
- `404` : Area non trouvée

---

## Services

Catalogue des services disponibles avec leurs actions et réactions.

### GET `/services`

Liste tous les services disponibles avec leur statut de connexion.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "services": [
    {
      "id": 1,
      "slug": "github",
      "name": "GitHub",
      "enabled": true,
      "connected": true,
      "actions": [
        {
          "id": 1,
          "key": "new_commit",
          "description": "Déclenché lors d'un nouveau commit",
          "configSchema": {
            "owner": "string",
            "repo": "string",
            "branch": "string"
          }
        }
      ],
      "reactions": [
        {
          "id": 1,
          "key": "create_issue",
          "description": "Crée une issue GitHub",
          "configSchema": {
            "owner": "string",
            "repo": "string",
            "title": "string",
            "body": "string"
          }
        }
      ]
    }
  ]
}
```

**Erreurs** :
- `401` : Non authentifié

---

## Connexions

Gestion des connexions OAuth aux services externes (GitHub, Discord, Spotify).

**⚠️ Tous les endpoints nécessitent une authentification Bearer Token**

### GET `/connections`

Liste le statut de connexion de tous les fournisseurs.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "connections": [
    {
      "provider": "github",
      "connected": true,
      "connectedAt": "2025-01-10T14:20:00.000Z",
      "details": {
        "login": "username",
        "avatarUrl": "https://..."
      }
    },
    {
      "provider": "spotify",
      "connected": false,
      "connectedAt": null,
      "details": null
    }
  ]
}
```

---

### POST `/connections/github/start`

Initie la connexion OAuth GitHub.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...",
  "state": "random_state_string"
}
```

---

### POST `/connections/github/complete`

Finalise la connexion GitHub après autorisation.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Body** :
```json
{
  "code": "authorization_code_from_github",
  "state": "state_string_from_start"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "provider": "github",
  "account": {
    "login": "username",
    "avatarUrl": "https://avatars.githubusercontent.com/u/123456"
  }
}
```

**Erreurs** :
- `400` : State invalide ou code refusé

---

### POST `/connections/discord/start`

Initie la connexion OAuth Discord.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "url": "https://discord.com/api/oauth2/authorize?client_id=...",
  "state": "random_state_string"
}
```

---

### POST `/connections/discord/complete`

Finalise la connexion Discord.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Body** :
```json
{
  "code": "authorization_code_from_discord",
  "state": "state_string_from_start",
  "guildId": "123456789012345678"
}
```

**Réponse 200** :
```json
{
  "success": true,
  "provider": "discord",
  "account": {
    "username": "User#1234",
    "avatarUrl": "https://cdn.discordapp.com/avatars/..."
  },
  "guild": {
    "id": "123456789012345678",
    "name": "Mon Serveur"
  }
}
```

---

### GET `/connections/discord/guilds`

Liste les serveurs Discord où le bot est installé.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "guilds": [
    {
      "id": "123456789012345678",
      "name": "Mon Serveur",
      "icon": "https://cdn.discordapp.com/icons/..."
    }
  ]
}
```

---

### GET `/connections/discord/guilds/:guildId/channels`

Liste les canaux textuels d'un serveur Discord.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Parameters** :
- `guildId` : ID du serveur Discord (string)

**Réponse 200** :
```json
{
  "channels": [
    {
      "id": "987654321098765432",
      "name": "general",
      "type": "GUILD_TEXT"
    },
    {
      "id": "987654321098765433",
      "name": "announcements",
      "type": "GUILD_TEXT"
    }
  ]
}
```

**Erreurs** :
- `400` : Serveur inconnu ou non autorisé

---

## GitHub

Endpoints spécifiques pour tester et déclencher manuellement les actions GitHub.

**⚠️ Tous les endpoints nécessitent une authentification Bearer Token**

### GET `/github/test`

Teste la récupération de données GitHub pour un dépôt.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Query Parameters** :
- `owner` (requis) : Propriétaire du dépôt
- `repo` (requis) : Nom du dépôt
- `action` (optionnel) : Clé d'action à tester (`new_commit`, `new_issue`, `new_pull_request`, etc.)

**Exemple** :
```
GET /github/test?owner=username&repo=my-repo&action=new_commit
```

**Réponse 200** :
```json
{
  "owner": "username",
  "repo": "my-repo",
  "fetchedAt": "2025-01-15T12:00:00.000Z",
  "result": {
    "commits": [
      {
        "sha": "abc123",
        "message": "Fix bug",
        "author": "John Doe",
        "date": "2025-01-15T11:30:00Z"
      }
    ]
  }
}
```

**Erreurs** :
- `400` : Paramètres manquants ou action non supportée

---

### POST `/github/poll`

Déclenche manuellement le polling GitHub pour toutes les areas actives.

**Headers** :
```
Authorization: Bearer <access_token>
```

**Réponse 200** :
```json
{
  "message": "Polling GitHub lancé avec succès"
}
```

---

## Meta

Endpoints généraux de l'API.

### GET `/`

Vérification de l'état de l'API.

**Réponse 200** :
```
Bonjour !
```

---

### GET `/about.json`

Informations sur l'API et les services disponibles (endpoint AREA).

**Réponse 200** :
```json
{
  "client": {
    "host": "10.101.53.35"
  },
  "server": {
    "current_time": 1516213489,
    "services": [
      {
        "name": "github",
        "actions": [
          {
            "name": "new_commit",
            "description": "Déclenché lors d'un nouveau commit"
          }
        ],
        "reactions": [
          {
            "name": "create_issue",
            "description": "Crée une issue GitHub"
          }
        ]
      }
    ]
  }
}
```

---

## Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | OK - Requête réussie |
| 201 | Created - Ressource créée avec succès |
| 204 | No Content - Requête réussie sans contenu de réponse |
| 400 | Bad Request - Erreur de validation ou paramètres invalides |
| 401 | Unauthorized - Non authentifié ou token invalide |
| 404 | Not Found - Ressource non trouvée |
| 409 | Conflict - Conflit (ex: email déjà utilisé) |
| 429 | Too Many Requests - Trop de tentatives |
| 500 | Internal Server Error - Erreur serveur |

---

## Authentification

La plupart des endpoints nécessitent une authentification via un JWT Bearer Token.

### Obtenir un token

Utilisez `/auth/login` ou `/auth/register` pour obtenir un `accessToken`.

### Utiliser le token

Ajoutez le header suivant à vos requêtes :
```
Authorization: Bearer <votre_access_token>
```

### Durée de vie

Les tokens d'accès ont une durée de vie limitée. Utilisez le cookie `refreshToken` pour en obtenir un nouveau.

---

## Documentation Swagger

Une documentation interactive Swagger est disponible en développement :

**URL** : `http://localhost:8080/api/docs`

La documentation Swagger permet de :
- Visualiser tous les endpoints
- Tester les requêtes directement depuis le navigateur
- Voir les schémas de données détaillés

---

## Prochaines étapes

Pour en savoir plus sur l'implémentation :

- [Documentation du code](./code-documentation.md) - Fonctionnement interne des services
- [Technologies utilisées](./technologies.md) - Stack technique du projet
- [Guide de démarrage](./getting-started.md) - Installation et lancement du projet

---

[← Retour à l'accueil](./README.md)