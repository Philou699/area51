# Étape 1 : build
FROM node:20-alpine AS builder

# Dossier de travail
WORKDIR /app

# Copier les fichiers de config et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier tout le reste du projet
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler le code TypeScript en JavaScript
RUN npm run build

# Étape 2 : image finale (compatible avec argon2)
FROM node:20-bullseye-slim AS runner

# Installer les dépendances nécessaires
RUN apt-get update && apt-get install -y \
    netcat \
    curl \
    bash \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Créer un utilisateur non-root pour éviter les problèmes de permissions
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copier uniquement ce qui est nécessaire pour exécuter l'app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copier les scripts de démarrage
COPY start.sh ./
COPY docker-entrypoint.sh ./
RUN chmod +x start.sh docker-entrypoint.sh

# Changer la propriété des fichiers
RUN chown -R appuser:appuser /app

# Changer vers l'utilisateur non-root
USER appuser

EXPOSE 8080
EXPOSE 4040

# Utiliser le script d'entrée qui gère ngrok
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["./start.sh"]
