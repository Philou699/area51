# Technologies utilisées

## Vue d'ensemble

Le projet Area51 est une plateforme d'automatisation permettant de connecter diff�rents services via des actions et des réactions (type IFTTT). Voici les technologies utilisées dans le projet.

---

## Backend

### NestJS
**Version** : 11.x
**Role** : Framework principal du backend

NestJS est un framework Node.js progressif pour construire des applications serveur efficaces et évolutives. Il utilise TypeScript par défaut et s'inspire de l'architecture Angular.

**Pourquoi NestJS ?**
- Architecture modulaire et organisée (modules, controllers, services)
- Support natif de TypeScript
- Injection de dépendances intégrée
- écosystème riche (Swagger, Passport, etc.)
- Parfait pour construire des APIs REST scalables

**Utilisation dans le projet** :
- Gestion des endpoints API
- Architecture en modules (auth, services, areas, etc.)
- Middleware et guards pour la sécurité
- Gestion des webhooks et des évenements

### Prisma ORM
**Version** : 6.16.x
**R�le** : ORM (Object-Relational Mapping)

Prisma est un ORM moderne pour Node.js et TypeScript qui facilite l'accés et la manipulation de la base de données.

**Pourquoi Prisma ?**
- Type-safety complet avec TypeScript
- Migrations de base de donn�es automatis�es
- Client généré automatiquement
- Excellent pour PostgreSQL
- Studio intégré pour visualiser les données

**Utilisation dans le projet** :
- Définition du schéma de base de données
- Gestion des utilisateurs, services, actions, réactions et areas
- Migrations et seeding de la base de données
- Requêtes type-safe

### Passport.js
**Version** : 0.7.x
**Role** : Authentification

Passport est un middleware d'authentification pour Node.js, extremement flexible et modulaire.

**Pourquoi Passport ?**
- Support de multiples stratégies OAuth (GitHub, Google)
- Intégration facile avec NestJS
- Gestion des JWT tokens
- Large communauté et documentation

**Utilisation dans le projet** :
- Authentification OAuth2 (GitHub, Google)
- Gestion des tokens JWT
- Stratégies d'authentification personnalis�es

### Class Validator & Class Transformer
**Versions** : 0.14.x / 0.5.x
**Role** : Validation des donn�es

Ces bibliothéques permettent de valider et transformer les données entrantesApple via des decorateurs.

**Utilisation dans le projet** :
- Validation des DTOs (Data Transfer Objects)
- Transformation automatique des types
- Messages d'erreur personnalisés

### IORedis
**Version** : 5.4.x
**Role** : Cache et gestion d'évenements

Client Redis performant pour Node.js avec support de TypeScript.

**Utilisation dans le projet** :
- Cache des données fréquemment accédées
- Gestion des sessions
- File d'attente pour les tâches asynchrones

---

## Frontend

### Next.js
**Version** : 15.5.x
**Role** : Framework React

Next.js est un framework React pour la production, offrant du SSR (Server-Side Rendering), du SSG (Static Site Generation) et du routing.

**Pourquoi Next.js ?**
- Performance optimale avec le SSR et SSG
- Routing basé sur les fichiers
- API Routes intégrées
- Optimisation d'images automatique
- Support de Turbopack (builder ultra-rapide)

**Utilisation dans le projet** :
- Interface utilisateur de la plateforme
- Gestion des pages (dashboard, authentification, etc.)
- Communication avec l'API backend

### React
**Version** : 19.1.x
**Role** : Bibliothéque UI

React est la bibliothéque JavaScript pour construire des interfaces utilisateur.

**Utilisation dans le projet** :
- Composants l'utilisables
- Gestion de l'état local
- Hooks personnalisés

### Tailwind CSS
**Version** : 4.1.x
**R�le** : Framework CSS utility-first

Tailwind CSS permet de construire rapidement des interfaces modernes sans écrire de CSS personnalisé.

**Pourquoi Tailwind CSS ?**
- Développement rapide avec des classes utilitaires
- Design system cohérent
- Optimisation automatique du CSS produit
- Responsive design simplifié

**Utilisation dans le projet** :
- Stylisation de tous les composants
- Théme personnalisé
- Design responsive

### Radix UI
**Version** : Divers packages
**Role** : Composants UI accessibles

Radix UI fournit des composants UI headless, accessibles et personnalisables.

**Composants utilisés** :
- `@radix-ui/react-checkbox` : Cases à cocher
- `@radix-ui/react-dropdown-menu` : Menus d�roulants
- `@radix-ui/react-label` : Labels de formulaires
- `@radix-ui/react-navigation-menu` : Navigation
- `@radix-ui/react-slot` : Composition de composants

**Pourquoi Radix UI ?**
- Accessibilité WAI-ARIA par défaut
- Composants headless (style libre)
- Excellente intégration avec Tailwind
- Gestion du clavier et focus automatique

### Lucide React
**Version** : 0.544.x
**Role** : Icones

Bibliothéque d'icones moderne et légere pour React.

---

## Base de données

### PostgreSQL
**Version** : 15
**Role** : Base de données relationnelle

PostgreSQL est un système de gestion de base de données relationnelle open-source puissant et fiable.

**Pourquoi PostgreSQL ?**
- Robustesse et fiabilité
- Support complet des transactions ACID
- Types de données avancés (JSON, Array, etc.)
- Excellente performance
- Support natif par Prisma

**Utilisation dans le projet** :
- Stockage des utilisateurs et authentification
- Gestion des services, actions et réactions
- Logs des exécutions d'areas
- Gestion des webhooks

### PgAdmin
**Version** : Latest
**R�le** : Interface d'administration PostgreSQL

PgAdmin permet de g�rer visuellement la base de donn�es PostgreSQL.

**Utilisation** :
- Visualisation des tables et donn�es
- Exécution de requêtes SQL
- Gestion des utilisateurs et permissions
- Monitoring de la base de donn�es

---

## Infrastructure & DevOps

### Docker
**Role** : Conteneurisation

Docker permet d'empaqueter l'application et ses d�pendances dans des conteneurs isol�s.

**Pourquoi Docker ?**
- Environnement de d�veloppement reproductible
- Isolation des services
- Déploiement simplifié
- Portabilité entre environnements

**Services conteneuris�s** :
- Backend (NestJS)
- Frontend (Next.js)
- PostgreSQL
- PgAdmin
- Ngrok

### Docker Compose
**R�le** : Orchestration de conteneurs

Docker Compose permet de d�finir et g�rer des applications multi-conteneurs.

**Utilisation dans le projet** :
- Configuration de tous les services
- Gestion des réseaux et volumes
- Variables d'environnement centralis�es
- Health checks automatiques

### Ngrok
**Version** : Latest
**R�le** : Tunneling HTTP

Ngrok crée des tunnels sécurisés vers localhost, permettant d'exposer le serveur local sur Internet.

**Pourquoi Ngrok ?**
- Réception de webhooks en d�veloppement local
- URLs publiques temporaires
- Dashboard de monitoring des requ�tes
- Support HTTPS automatique

**Utilisation dans le projet** :
- Tunneling du backend (port 8080)
- Réception des webhooks OAuth
- Test des intégrations avec services externes

---

## Outils de développement

### TypeScript
**Version** : 5.7.x (backend) / 5.9.x (frontend)
**Role** : Langage de programmation

TypeScript ajoute le typage statique à JavaScript.

**Pourquoi TypeScript ?**
- Détection d'erreurs à la compilation
- Autocomplation et IntelliSense
- Refactoring facilité
- Code plus maintenable

### ESLint
**Role** : Linter JavaScript/TypeScript

ESLint analyse le code pour d�tecter les erreurs et appliquer les conventions.

**Configuration** :
- Régles NestJS pour le backend
- Régles Next.js pour le frontend
- Prettier pour le formatage

### Jest
**Version** : 30.x
**Role** : Framework de tests

Jest est utilisé pour les tests unitaires et d'int�gration.

**Utilisation dans le projet** :
- Tests des services backend
- Tests des endpoints API
- Coverage de code

### Prettier
**Version** : 3.4.x
**R�le** : Formateur de code

Prettier formate automatiquement le code selon des r�gles d�finies.

---

## Intégrations externes

### GitHub OAuth
**Role** : Authentification et actions GitHub

Intégration OAuth2 pour l'authentification et l'acc�s aux donn�es GitHub.

**Utilisation** :
- Connexion utilisateur via GitHub
- Actions sur les repositories
- Gestion des issues et pull requests

### Google OAuth
**Role** : Authentification Google

Intégration OAuth2 pour l'authentification via Google.

**Utilisation** :
- Connexion utilisateur via Google
- Accés aux services Google (Gmail, Calendar, etc.)

### RSS Parser
**Version** : 3.13.x
**Role** : Parsing de flux RSS

Bibliothéque pour parser les flux RSS et Atom.

**Utilisation** :
- Action pour surveiller les flux RSS
- Déclenchement d'areas sur nouveaux articles

---

## Architecture globale

```
                 
   Next.js (UI)    � Frontend (React + Tailwind)
        ,        
          HTTP/REST
        �        
  NestJS (API)     � Backend (Controllers + Services)
        ,        
          Prisma ORM
        �        
   PostgreSQL      � Base de donn�es
                 
```

---

## Prochaines étapes

Pour en savoir plus sur l'utilisation de ces technologies dans le projet :

- [[Documentation technique]] - Architecture détaillée du projet
- [[Documentation du code]] - Implémentation et organisation du code
- [[Guide de démarrage]] - Installation et configuration
