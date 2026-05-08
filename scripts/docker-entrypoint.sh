#!/bin/sh
set -e

echo "[CFD] Running database migrations..."
npx tsx scripts/migrate.ts

echo "[CFD] Starting server..."
exec npx tsx server.ts
