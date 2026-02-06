#!/bin/sh

echo "Starting backend service..."
echo "Waiting for database..."
until nc -z postgres 5432; do
  echo "Database not ready, waiting..."
  sleep 2
done
echo "Database is ready!"

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Running database seed..."
npx ts-node prisma/seed.ts

echo "Starting NestJS application..."
node dist/src/main.js
