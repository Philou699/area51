# Service OpenWeather - Documentation complète

## Implémentation

### Backend

#### Fichiers créés
- `backend/src/openweather/openweather.module.ts` - Module NestJS
- `backend/src/openweather/openweather.service.ts` - Service avec polling + API calls
- `backend/src/openweather/openweather.controller.ts` - Endpoints REST
- `backend/src/openweather/openweather.service.spec.ts` - Tests unitaires
- `backend/test/openweather.e2e-spec.ts` - Tests end-to-end
- `backend/src/openweather/README.md` - Documentation détaillée

#### Modifications
- `backend/src/app.module.ts` - Import du module OpenWeather
- `backend/src/app.service.ts` - Génération dynamique du about.json depuis la DB
- `backend/src/app.controller.ts` - Support async pour about.json
- `backend/prisma/seed.ts` - Ajout du service OpenWeather
- `.env.example` - Documentation des variables d'environnement

### Frontend

- **Aucune modification nécessaire** - Le système est entièrement générique !
- `frontend/OPENWEATHER_INTEGRATION.md` - Guide d'utilisation

## Fonctionnalités implémentées

### Actions (Déclencheurs)

#### 1. `temperature_below_x`
Déclenche une automation quand la température est en dessous d'un seuil.

**Configuration:**
```json
{
  "city": "Paris",
  "threshold": 10
}
```

#### 2. `weather_condition_is`
Déclenche une automation quand une condition météo spécifique est détectée.

**Configuration:**
```json
{
  "city": "London",
  "condition": "Rain"
}
```

**Conditions disponibles:** Clear, Clouds, Rain, Drizzle, Snow, Thunderstorm, Mist, Fog

### Réactions

#### 1. `send_webhook`
Envoie les données météo à un webhook (support Discord avec embeds riches).

#### 2. `log_activity`
Enregistre l'activité dans les logs du serveur.

## 🔧 Configuration requise

### 1. Clé API OpenWeatherMap

```bash
# .env
OPENWEATHER_API_KEY=votre_clé_api_ici
```

**Obtenir une clé:**
1. Créer un compte sur https://openweathermap.org/
2. Aller dans API Keys
3. Copier la clé (activation sous 2h)

### 2. Seed de la base de données

```bash
cd backend
npm run seed
```

Cette commande ajoute le service OpenWeather avec ses actions et réactions dans la base de données.

## Démarrage

### Backend

```bash
cd backend

# Installer les dépendances (si pas déjà fait)
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env et ajouter OPENWEATHER_API_KEY

# Exécuter le seed
npm run seed

# Démarrer le serveur
npm run start:dev
```

### Frontend

```bash
cd frontend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer l'application
npm run dev
```

### Accès

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- About.json: http://localhost:3001/about.json

## Architecture technique

### Polling automatique

Le service effectue un **polling toutes les 5 minutes** pour vérifier les conditions météorologiques.

```
┌─────────────┐
│   Cron Job  │ (Toutes les 5 minutes)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Récupérer  │ Areas actives avec actions OpenWeather
│   les Areas │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Grouper   │ Par ville (optimisation API)
│  par ville  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Appel API   │ OpenWeatherMap
│ OpenWeather │ (1 appel par ville unique)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Vérifier   │ Si conditions matchent
│  critères   │ (température, condition)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Exécuter   │ Webhook / Log
│  réaction   │
└─────────────┘
```

### Déduplication

- Chaque snapshot météo reçoit un ID unique : `openweather:ville:timestamp`
- Stocké dans la table `WebhookEvent` pour éviter les duplications
- Les logs sont enregistrés dans `AreaLog` avec le statut (success/failure)

## Tests

### Tests unitaires

```bash
cd backend
npm run test -- openweather.service.spec.ts
```

### Tests end-to-end

```bash
cd backend
npm run test:e2e -- openweather.e2e-spec.ts
```

### Test manuel - Récupérer la météo

```bash
curl "http://localhost:3001/openweather/current?city=Paris"
```

Réponse attendue:
```json
{
  "city": "Paris",
  "temperature": 15.3,
  "condition": "Clear",
  "description": "clear sky",
  "humidity": 65,
  "windSpeed": 3.5,
  "timestamp": "2025-10-22T14:30:00.000Z"
}
```

### Test manuel - Polling

```bash
curl "http://localhost:3001/openweather/poll"
```

## Utilisation dans l'interface web

### Créer une Area OpenWeather

1. Se connecter à l'interface web
2. Cliquer sur "Créer une Area"
3. **Déclencheur:**
   - Service: `OpenWeather`
   - Action: Choisir l'action souhaitée
   - Configurer les champs (ville, seuil/condition)
4. **Réaction:**
   - Service: Au choix
   - Action: `send_webhook` ou autre
   - Configurer l'URL du webhook
5. Cliquer sur "Créer l'Area"

### Exemple concret

**Alerte température basse à Paris:**
- Déclencheur: OpenWeather > "temperature is below a threshold"
  - Ville: `Paris`
  - Seuil: `5`
- Réaction: Send webhook
  - URL: `https://discord.com/api/webhooks/...`

L'area se déclenchera automatiquement toutes les 5 minutes si la température à Paris est < 5°C.

## Vérification du about.json

```bash
curl http://localhost:3001/about.json | jq '.server.services[] | select(.name=="openweather")'
```

Résultat attendu:
```json
{
  "name": "openweather",
  "actions": [
    {
      "name": "temperature_below_x",
      "description": "Triggered when temperature is below a threshold"
    },
    {
      "name": "weather_condition_is",
      "description": "Triggered when current weather matches a condition"
    }
  ],
  "reactions": [
    {
      "name": "send_webhook",
      "description": "Send weather data to a webhook URL"
    },
    {
      "name": "log_activity",
      "description": "Log weather activity to console/logs"
    }
  ]
}
```

## 🎨 Exemple de payload Discord

Quand une area se déclenche avec un webhook Discord:

```json
{
  "username": "OpenWeather Bot",
  "avatar_url": "https://openweathermap.org/...",
  "embeds": [
    {
      "title": "Météo à Paris",
      "color": 3447003,
      "fields": [
        {
          "name": "Température",
          "value": " 15.3°C",
          "inline": true
        },
        {
          "name": "Conditions",
          "value": "clear sky",
          "inline": true
        },
        {
          "name": "Humidité",
          "value": "65%",
          "inline": true
        },
        {
          "name": "Vent",
          "value": "3.5 m/s",
          "inline": true
        }
      ],
      "footer": {
        "text": "OpenWeatherMap"
      },
      "timestamp": "2025-10-22T14:30:00.000Z"
    }
  ]
}
```

## Logs et debug

### Activer les logs détaillés

Les logs incluent automatiquement:
- `Starting OpenWeather polling...` - Début du polling
- `Processing weather for city: Paris` - Traitement d'une ville
- `Triggering area X: ...` - Area déclenchée
- `Webhook sent successfully` - Webhook envoyé

### Consulter les logs d'une area

Les logs sont stockés dans la table `AreaLog` avec:
- `status`: success / failure
- `payload`: Données météo complètes
- `error`: Message d'erreur si échec
- `triggeredAt`: Timestamp du déclenchement

## Gestion des erreurs

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `API key not configured` | Variable d'env manquante | Ajouter `OPENWEATHER_API_KEY` dans `.env` |
| `OpenWeather API returned 401` | Clé invalide/inactive | Vérifier la clé, attendre 2h après création |
| `City not found` | Nom de ville incorrect | Utiliser le nom en anglais (ex: "Paris", "Moscow") |
| `No active areas found` | Aucune area configurée | Créer une area via l'interface |

### Logs d'erreur

Toutes les erreurs sont loggées avec le contexte complet:
```
[OpenweatherService] Failed to process city London: API key invalid
[OpenweatherService] Failed to execute reaction for area 123: Webhook timeout
```

## Limites et optimisations

### Limites API OpenWeatherMap (gratuit)

- **1000 appels/jour** (≈ 60/heure)
- **Données actualisées** toutes les 10 minutes
- **Pas de prévisions** étendues

### Optimisations implémentées

**Groupement par ville** - 1 seul appel API par ville unique
**Polling 5 minutes** - Respecte les limites gratuites
**Déduplication** - Évite de traiter 2 fois le même événement
**Cache dans WebhookEvent** - Historique des mesures

### Calcul de consommation

Exemple: 10 areas surveillant 5 villes différentes
- Appels API: **5 par polling** (1 par ville)
- Polling: **288 fois/jour** (toutes les 5 min)
- Total: **1440 appels/jour** (dépasse la limite gratuite)

**Solution:** Utiliser un plan payant OpenWeatherMap ou réduire le nombre de villes/augmenter l'intervalle.

## Évolutions futures possibles

### Actions additionnelles
- `humidity_above_x` - Déclenche si humidité > seuil
- `wind_speed_above_x` - Déclenche si vent > seuil
- `weather_forecast` - Déclenche selon les prévisions
- `temperature_change` - Déclenche sur variation de température

### Améliorations techniques
- Support des coordonnées GPS (latitude/longitude)
- Cache Redis pour réduire les appels API
- Agrégation de plusieurs conditions (ET/OU)
- Historique des données météo

### Réactions spécialisées
- Envoi de SMS via Twilio
- Notification push mobile
- Contrôle d'objets connectés (IoT)

## Ressources

- [API OpenWeatherMap](https://openweathermap.org/api)
- [Documentation NestJS](https://nestjs.com/)
- [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [JSON Schema](https://json-schema.org/)

## Résumé des fichiers modifiés/créés

```
backend/
├── src/
│   ├── openweather/                    [NOUVEAU]
│   │   ├── openweather.module.ts       Module NestJS
│   │   ├── openweather.service.ts      Logique métier + polling
│   │   ├── openweather.controller.ts   Endpoints REST
│   │   ├── openweather.service.spec.ts Tests unitaires
│   │   └── README.md                   Documentation
│   ├── app.module.ts                   Import OpenweatherModule
│   ├── app.service.ts                  About.json dynamique
│   └── app.controller.ts               Async support
├── prisma/
│   └── seed.ts                         Ajout service OpenWeather
├── test/
│   └── openweather.e2e-spec.ts         Tests e2e
└── .env.example                        Documentation env vars

frontend/
└── OPENWEATHER_INTEGRATION.md          Guide d'utilisation

.env.example                            Variables d'environnement
```