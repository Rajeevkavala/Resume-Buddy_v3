# ============================================================
# Dockerfile - Standalone WebSocket Server
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --no-package-lock
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

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
