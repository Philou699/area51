# Documentation API & Guides

## Résumé rapide (“dis-moi quoi faire maintenant”)
- `npm run start:dev` → Swagger en ligne sur http://localhost:8080/docs
- `npm run docs:openapi` → génère `backend/docs/openapi.json` prêt pour Redoc/Mintlify
- Ajoute ou mets à jour les guides fonctionnels Markdown dans `backend/docs/`
- Configure `DISCORD_BOT_TOKEN` dans ton `.env` pour activer le polling et les réactions Discord

---

## Swagger & OpenAPI automatiques

- L’initialisation Swagger est gérée dans `backend/src/main.ts` via `buildSwaggerConfig()`. Toute modification (titre, description, tags globaux, security schemes…) passe par ce builder (`backend/src/swagger/swagger-config.ts`).
- L’UI interactive Swagger est montée sur `/docs` dès que l’appli tourne en mode dev (`npm run start:dev`). Si tu ne veux pas l’exposer en prod, assure-toi que `NODE_ENV=production`.
- À chaque démarrage hors prod, un `openapi.json` est écrit dans `backend/docs/openapi.json`. Tu peux forcer ou désactiver cette exportation avec :
  - `OPENAPI_EXPORT=true` → écrit toujours le fichier (utile en CI ou pour snapshot).
  - `OPENAPI_EXPORT=false` → n’écrit jamais le fichier (même en dev).
  - `OPENAPI_SPEC_PATH=/chemin/vers/mon/openapi.json` → change l’emplacement du fichier exporté.

---

## Service Discord (actions & réactions)

- **Pré-requis** : définir `DISCORD_BOT_TOKEN` (bot OAuth avec accès `channels.read`, `messages.read`, `messages.write`).
- **Actions disponibles** (config via `channelId`, filtres optionnels) :
  - `new_channel_message` → chaque nouveau message déclenche l’automatisation.
  - `message_contains_keyword` → déclenche si le contenu contient un mot-clé (case-insensitive).
  - `message_with_attachment` → déclenche lorsqu’une pièce jointe est détectée (filtres par MIME possibles).
- **Réactions Discord** utilisables dans un Area (via le service Discord ou depuis GitHub grâce à la délégation) :
  - `send_channel_message` → envoie un message texte dans un salon (support placeholders `{{activity.title}}`, mentions d’utilisateurs/roles).
  - `create_thread` → ouvre un fil dans un salon avec un nom et un premier message dynamiques.
- **Connexion utilisateur** :
  - `POST /connections/discord/start` → fournit l’URL d’autorisation (scopes `identify guilds bot`, permissions réglées via `DISCORD_BOT_PERMISSIONS`).
  - Après redirection Discord, POST `code`, `state`, `guildId` sur `POST /connections/discord/complete` pour enregistrer l’accès.
  - `GET /connections` liste maintenant GitHub & Discord (`details.userId`, `connectedAt`).
- **Test manuel** : `POST /discord/test/send-message` et `GET /discord/test/messages` (JWT requis) pour valider la configuration du bot.

---

## Générer le `openapi.json` à la demande

- Commande dédiée : `npm run docs:openapi`
  - Elle instancie Nest, génère le document OpenAPI et le sauvegarde au chemin défini (`backend/docs/openapi.json` par défaut).
  - Pour pointer vers un autre dossier (par ex. pour un portail Mintlify), lance `OPENAPI_SPEC_PATH=../frontend/public/openapi.json npm run docs:openapi`.
  - La commande ne lance **pas** le serveur HTTP : elle génère puis se termine. Pratique pour l’exécuter en CI/CD.

---

## Guides fonctionnels en Markdown

- Emplacement : `backend/docs/`. Ajoute un fichier par sujet, ex. :
  - `backend/docs/how-to-create-automation-rule.md`
  - `backend/docs/how-auth-works.md`
  - `backend/docs/webhook-flow.md`
- Gabarit recommandé :

```markdown
# Titre concret et actionnable

## Pourquoi / Contexte
En quoi ce guide est utile ? Pour qui ?

## Pré-requis
- Elements nécessaires (rôles, accès, données…)

## Étapes
1. …
2. …

## Résultat attendu / validation
- Comment vérifier que tout fonctionne.

## Résolution de problèmes (optionnel)
- Cas fréquents, messages d’erreur, checklists.
```

- Pense à lier les guides entre eux et à pointer vers les endpoints Swagger pertinents (URL`/docs`). Un lien type « Voir l’endpoint POST /automation-rules dans l’API » suffit à créer de la cohérence.

---

## Pour aller plus loin
- Branche un viewer type Redocly, Mintlify ou Stoplight en consommant `backend/docs/openapi.json`.
- Publie les guides Markdown via un générateur statique (Docusaurus / Mintlify / Nextra) ou laisse-les dans le repo si tu préfères une doc interne.
- Mets à jour la doc dès qu’un endpoint change : l’export OpenAPI et les guides doivent rester synchronisés pour éviter les questions répétées en onboarding.
