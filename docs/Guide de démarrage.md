# Guide de démarrage

## Prérequis

Avant de démarrer le projet, assurez-vous d'avoir installé les éléments suivants :

- **Docker** et **Docker Compose**
- **Node.js** (version 20 ou sup�rieure)
- **Git**
- Un compte **Ngrok** (optionnel, pour les tunnels externes)

## Installation

### 1. Cloner le Répo

```bash
git clone git@github.com:Nessoss/G-DEV-500-LYN-5-1-area-10_.git
cd G-DEV-500-LYN-5-1-area-10_
```

### 2. Configuration des variables d'environnement

Copiez le fichier d'exemple et configurez vos variables :

```bash
cp .env.example .env
```

Editez le fichier `.env` et renseignez les valeurs suivantes :

```env
# Base de donn�es PostgreSQL
POSTGRES_USER=votre_utilisateur
POSTGRES_PASSWORD=votre_mot_de_passe
POSTGRES_DB=area_db

# PgAdmin
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin_password

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=votre_client_id
NEXT_PUBLIC_GITHUB_SCOPE=user:email
NEXT_PUBLIC_GITHUB_REDIRECT_URI=http://localhost:8080/api/connections/github/callback

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_google_client_id

# Ngrok (optionnel)
NGROK_AUTHTOKEN=votre_token_ngrok
```

### 3. Démarrer le projet

Lancez tous les services avec Docker Compose :

```bash
docker-compose up --build
```

Cette commande va d�marrer :
- **PostgreSQL** : Base de donn�es (port 5433)
- **PgAdmin** : Interface d'administration de la base de donn�es (port 5050)
- **Backend** : API NestJS (port 8080)
- **Frontend** : Application Next.js (port 8081)
- **Ngrok** : Tunnel pour exposer l'API (port 4040)

## Acc�s aux services

Une fois les conteneurs d�marr�s, vous pouvez acc�der aux diff�rents services :

| Service         | URL                   | Description                      |
| --------------- | --------------------- | -------------------------------- |
| Frontend        | http://localhost:8081 | Application web Next.js          |
| Backend API     | http://localhost:8080 | API NestJS                       |
| PgAdmin         | http://localhost:5050 | Interface de gestion PostgreSQL  |
| Ngrok Dashboard | http://localhost:4040 | Dashboard Ngrok pour les tunnels |

## Initialisation de la base de donn�es

### Générer les fichiers Prisma

```bash
cd backend
npm run prisma:generate
```

### Exécuter les migrations

```bash
npm run prisma:migrate
```

### Peupler la base de donn�es (optionnel)

```bash
npm run prisma:seed
```

## Developpement local

### Backend (NestJS)

Pour developper sur le backend sans Docker :

```bash
cd backend
npm install
npm run start:dev
```

### Frontend (Next.js)

Pour developper sur le frontend sans Docker :

```bash
cd frontend
npm install
npm run dev
```

## Commandes utiles

### Arreter les services

```bash
docker-compose down
```

### Arr�ter et supprimer les volumes

```bash
docker-compose down -v
```

### Voir les logs d'un service

```bash
docker-compose logs -f <nom_du_service>
```

Exemples :
```bash
docker-compose logs -f server
docker-compose logs -f client_web
docker-compose logs -f postgres
```

### Reconstruire un service sp�cifique

```bash
docker-compose up --build <nom_du_service>
```

## Résolution des problémes

### Le port 5433 est déjà utilisé

Si PostgreSQL ne démarre pas, v�rifiez qu'aucun autre service n'utilise le port 5433 :

```bash
lsof -i :5433
```

Modifiez le port dans `docker-compose.yml` si necessaire.

### Erreur de connexion à la base de données

Vérifiez que le service PostgreSQL est bien démarré et en bonne santé :

```bash
docker-compose ps
```

Le service `postgres` doit avoir le statut `healthy`.

### Les migrations Prisma échouent

Assurez-vous que la `DATABASE_URL` dans votre fichier `.env` est correcte :

```env
DATABASE_URL=postgresql://utilisateur:motdepasse@localhost:5433/area_db
```

## Prochaines étapes

Une fois le projet démarré, consultez :

- [[Documentation technique]] - Pour comprendre l'architecture du projet
- [[Documentation des endpoints]] - Pour connaître les API disponibles
- [[Documentation du code]] - Pour comprendre l'implémentation

---

[[Pr�sentation de la Documentation du Projet Area51|� Retour � l'accueil]]
