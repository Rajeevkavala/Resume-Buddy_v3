# ============================================================
# Dockerfile - Standalone WebSocket Server
# ============================================================

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 wsuser

COPY --from=builder --chown=wsuser:nodejs /app/dist ./dist
COPY --from=builder --chown=wsuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=wsuser:nodejs /app/package.json ./package.json

USER wsuser
EXPOSE 3001
CMD ["node", "dist/server.js"]
