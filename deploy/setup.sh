#!/bin/bash
# First-time server setup. Run once on a fresh Ubuntu/Debian server.
# Usage: bash deploy/setup.sh
set -e

# Navigate to project root regardless of where this script is called from
cd "$(dirname "$0")/.."

echo "=============================="
echo " CFD — First-Time Setup"
echo "=============================="

# ─── 1. Docker ───────────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "[1/4] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  CURRENT_USER="${SUDO_USER:-$USER}"
  if [ "$CURRENT_USER" != "root" ]; then
    usermod -aG docker "$CURRENT_USER"
    echo "  Added $CURRENT_USER to docker group. Re-login required for group to take effect."
  fi
else
  echo "[1/4] Docker already installed: $(docker --version)"
fi

# ─── 2. Create .env ──────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "[2/4] Creating .env with auto-generated secrets..."
  cp .env.example .env

  # Generate secure random values
  if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 64)
    BACKUP_KEY=$(openssl rand -hex 32)
    DB_PASS=$(openssl rand -base64 24 | tr -d '/+=\n')
  else
    JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))")
    BACKUP_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
    DB_PASS=$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('base64url'))")
  fi

  sed -i "s|change-me-to-a-strong-random-secret-in-production|${JWT_SECRET}|" .env
  sed -i "s|change-me-to-a-64-char-hex-string-for-aes256-encryption|${BACKUP_KEY}|" .env

  # Append Docker Compose DB credentials
  cat >> .env <<EOF

# --- PostgreSQL (Docker Compose) ---
POSTGRES_USER=cfd_user
POSTGRES_DB=cfd_db
POSTGRES_PASSWORD=${DB_PASS}
EOF

  echo ""
  echo "  .env created. Before continuing, set these required values:"
  echo ""
  echo "    APP_URL          → your domain, e.g. https://cfd.example.com"
  echo "    SMTP_HOST/USER   → email settings (for notifications)"
  echo "    GEMINI_API_KEY   → AI features (optional)"
  echo ""
  read -rp "  Press Enter after editing .env to continue, or Ctrl+C to abort: "
else
  echo "[2/4] .env already exists, skipping."
fi

# ─── 3. Build and start ──────────────────────────────────────────────────────
echo "[3/4] Building and starting containers (first build may take a few minutes)..."
docker compose up -d --build

# ─── 4. Done ─────────────────────────────────────────────────────────────────
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "[4/4] Setup complete!"
echo ""
docker compose ps
echo ""
echo "=============================="
echo " App is running at:"
echo "   http://${SERVER_IP}:5000"
echo ""
echo " For future deploys: bash deploy/deploy.sh"
echo "=============================="
