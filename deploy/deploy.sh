#!/bin/bash
# Subsequent deploys — run on the server after first-time setup.
# Usage: bash deploy/deploy.sh
set -e

# Navigate to project root regardless of where this script is called from
cd "$(dirname "$0")/.."

echo "=============================="
echo " CFD — Deploy"
echo "=============================="

if [ ! -f .env ]; then
  echo "ERROR: .env file not found."
  echo "  This is a fresh server. Run: bash deploy/setup.sh"
  exit 1
fi

echo "[1/3] Pulling latest code..."
git pull origin main

echo "[2/3] Building and restarting containers..."
docker compose up -d --build --remove-orphans

echo "[3/3] Done."
echo ""
docker compose ps
echo ""
echo "Logs (last 30 lines):"
docker compose logs app --tail=30
