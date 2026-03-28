# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifest files first (better layer caching)
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all deps (workspace-aware, hoisted to root node_modules)
RUN npm ci

# Build the NestJS app  →  apps/api/dist/
RUN npm run build -w @mappra/api

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Only copy what the runtime needs
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/packages        ./packages
COPY --from=builder /app/apps/api/dist   ./apps/api/dist

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
