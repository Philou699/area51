# Area51

Un projet fullstack composé d'une API backend en NestJS et d'une interface frontend en Next.js.

Ce README fournit toutes les informations nécessaires pour cloner, installer, démarrer et contribuer au projet.

## Aperçu

- Backend: NestJS (TypeScript)
- Frontend: Next.js (React, TypeScript)
- Base de données: Prisma (client inclus, migrations gérées)
- Conteneurs: docker / docker-compose disponibles

Pour plus de détails techniques, consultez le dossier `backend/docs/`.

## Prérequis

- Node.js (>= 18 recommandé)
- npm (ou pnpm/yarn, les scripts utilisent npm)
- Docker & docker-compose (si vous utilisez les conteneurs)
- (optionnel) Redis, Postgres ou autre DB selon votre `DATABASE_URL`

## Récupérer le code

```fish
git clone https://github.com/<votre-utilisateur>/area51.git
cd area51
```

Remplacez `<votre-utilisateur>` par votre nom GitHub si vous publiez le dépôt.

## Arborescence importante

- `backend/` : API NestJS, Prisma, scripts et docs
- `frontend/`: application Next.js
- `docker-compose.yml` : stack locale avec services (si configuré)

## Variables d'environnement

Le projet utilise des variables d'environnement pour la configuration (DB, secrets, OAuth, ...).

- Créez un fichier `.env` adapté pour le `backend` (ou placez les variables dans la racine si vous utilisez docker-compose).
- Les variables courantes attendues (exemples) :
  - `DATABASE_URL` (connexion Prisma)
  - `DATABASE_URL_LOCAL` (pour les scripts locaux)
  - `JWT_SECRET`
  - `REDIS_URL` (si Redis utilisé)
  - Clés OAuth (Google / GitHub / etc.)

Consultez `backend/docs/*` pour les besoins spécifiques (OAuth, services externes).

## Installation & exécution (développement)

Ouvrez deux terminaux ou onglets et installez les dépendances puis démarrez backend et frontend.

Backend :

```fish
cd backend
npm install
# Générer le client Prisma
npm run prisma:generate
# (si nécessaire) appliquer les migrations locales et seed
npm run prisma:migrate
npm run prisma:seed
# Démarrer en mode développement
npm run start:dev
```

Frontend :

```fish
cd frontend
npm install
npm run dev
```

Une fois démarrés, l'API tourne par défaut sur le port configuré dans le backend (consultez `src/main.ts`) et le frontend sur `http://localhost:3000`.

## Commandes utiles

Backend (`backend/package.json`)

- `npm run start` : démarrer l'application (mode production si build effectuée)
- `npm run start:dev` : démarrage en développement (watch)
- `npm run start:prod` : démarrer `node dist/main` après build
- `npm run build` : compiler le backend (Nest build)
- `npm run lint` : corriger/afficher les règles ESLint
- `npm run format` : formatter avec Prettier
- `npm run test` / `npm run test:watch` / `npm run test:cov` : tests unitaires
- `npm run test:e2e` : tests e2e
- `npm run docs:openapi` : générer l'OpenAPI depuis les sources
- Prisma : `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`

Frontend (`frontend/package.json`)

- `npm run dev` : démarrer le serveur Next en dev (Turbopack)
- `npm run build` : builder pour production
- `npm run start` : démarrer la version buildée
- `npm run lint` : exécuter ESLint

## Utilisation avec Docker

Le dépôt contient un `docker-compose.yml` à la racine.

Pour démarrer l'ensemble (backend, frontend et services complémentaires si configurés) :

```fish
docker-compose up --build
```

Arrêter et supprimer les conteneurs :

```fish
docker-compose down
```

## Tests

Backend (unité) :

```fish
cd backend
npm run test
```

Tests E2E :

```fish
cd backend
npm run test:e2e
```

## API & Documentation

- Le backend expose un OpenAPI/Swagger générable avec :

```fish
cd backend
npm run docs:openapi
```

- Le JSON généré se trouve dans `backend/docs/` ou selon la configuration du script.

## Déploiement

- Pour un déploiement simple : builder les deux apps et déployer les images ou les dossiers générés.
- Préparer les variables d'environnement en production (DB, JWT secrets, OAuth keys).
- Utiliser la configuration Docker/CI de votre choix (GitHub Actions, GitLab CI, Docker Hub, etc.).

## Contribution

Contributions bienvenues :

1. Forkez le dépôt
2. Créez une branche feature/fix
3. Ajoutez des tests pour les nouvelles fonctionnalités ou corrections
4. Ouvrez une Pull Request avec une description claire

Respectez le style existant (TypeScript strict, ESLint, Prettier).

## Où chercher de l'aide

- Documentation backend : `backend/docs/`
- Code source principal : `backend/src/` et `frontend/src/`

## Licence

Ajoutez un fichier `LICENSE` au besoin. Par défaut, il n'y a pas de licence dans ce dépôt — avant de rendre le projet public, choisissez une licence (par exemple MIT) si vous souhaitez autoriser l'utilisation publique.

## À propos

Si vous publiez ce dépôt sur GitHub, mettez à jour l'URL de clonage ci-dessus et ajoutez des badges/une image README si vous le souhaitez.

Bonne continuation — si vous voulez je peux aussi :
- ajouter un fichier `LICENSE` (MIT recommandé),
- créer un `.env.example` pour le backend avec les variables courantes,
- ou générer un badge README et une section démonstration.
