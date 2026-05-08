# ─── Stage 1: Build frontend ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
# Result: /app/dist/ ← React static files served by Express in production

# ─── Stage 2: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only (tsx is in dependencies, so it's included)
COPY package*.json ./
RUN npm ci --omit=dev

# React frontend (built in stage 1)
COPY --from=builder /app/dist ./dist

# Server source — tsx runs TypeScript directly, no separate compile step needed
COPY server.ts .
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY drizzle/ ./drizzle/
COPY tsconfig.json .
COPY tsconfig.server.json .

# Report templates (not gitignored, must be in image)
COPY storage/ ./storage/

# Upload directory — actual files come from the Docker volume at runtime
RUN mkdir -p assets/attachments/realisasi

EXPOSE 5000

COPY scripts/docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
