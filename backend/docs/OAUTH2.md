# OAuth2 Google Authentication

Cette feature permet aux utilisateurs de s'authentifier avec leur compte Google via OAuth2.

## Configuration

1. **Variables d'environnement** : Ajoutez ces variables dans votre fichier `.env` :
   ```
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

2. **Configuration Google Cloud Console** :
   - Créez un projet dans Google Cloud Console
   - Activez l'API Google+ ou l'API Google Identity
   - Créez des identifiants OAuth2 (Application Web)
   - Ajoutez vos domaines autorisés

## API Endpoints

### POST /auth/oauth2/google

Authentifie un utilisateur avec un token Google OAuth2.

**Body :**
```json
{
  "token": "google-id-token-here"
}
```

**Réponse réussie (200) :**
```json
{
  "message": "Google OAuth2 login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-10-07T12:00:00.000Z",
    "updatedAt": "2025-10-07T12:00:00.000Z"
  }
}
```

**Réponse d'erreur (401) :**
```json
{
  "statusCode": 401,
  "message": "Invalid Google token"
}
```

## Fonctionnement

1. **Nouveau utilisateur** :
   - Le système vérifie le token Google
   - Crée un nouvel utilisateur avec l'email Google
   - Crée un enregistrement `ProviderAccount` pour lier le compte Google

2. **Utilisateur existant** :
   - Le système vérifie le token Google
   - Met à jour ou crée l'enregistrement `ProviderAccount`
   - Retourne les informations utilisateur

## Sécurité

- Les tokens Google sont vérifiés via la bibliothèque officielle `google-auth-library`
- Les utilisateurs OAuth2 n'ont pas de mot de passe (champ `passwordHash` vide)
- Les tokens d'accès sont stockés dans la table `ProviderAccount`

## Tests

Les tests unitaires couvrent :
- Vérification des tokens invalides
- Création de nouveaux utilisateurs OAuth2
- Mise à jour des comptes existants

Exécuter les tests :
```bash
npm test oauth2.service.spec.ts
```
