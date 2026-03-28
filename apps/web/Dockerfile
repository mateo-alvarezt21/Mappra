# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm ci
RUN npm run build -w @mappra/web

# ── Stage 2: production image (nginx) ────────────────────────────────────────
FROM nginx:alpine

# Static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# nginx config (uses __API_URL__ placeholder)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint script: replaces __API_URL__ at startup then starts nginx
COPY apps/web/docker-entrypoint.sh /docker-entrypoint.d/40-api-url.sh
RUN chmod +x /docker-entrypoint.d/40-api-url.sh

EXPOSE 80
