# Multi-stage build for optimal production image
# Optimized for 500 concurrent users on DigitalOcean

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Production runtime
FROM node:20-slim AS runtime

WORKDIR /app

# Install only runtime dependencies for tectonic
RUN apt-get update -y \
  ; apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    xz-utils \
    libgraphite2-3 \
    libharfbuzz0b \
    libfontconfig1 \
    libfreetype6 \
  ; rm -rf /var/lib/apt/lists/* \
  ; apt-get clean

# Install tectonic (static binary)
# Pin version to keep builds reproducible.
ARG TECTONIC_VERSION=0.15.0
RUN curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \
  | tar -xz -C /usr/local/bin tectonic \
  && chmod +x /usr/local/bin/tectonic

# Pre-warm tectonic cache during build (downloads ~100MB of packages)
# This eliminates cold-start latency for first request
RUN mkdir -p /tmp/warmup \
  && echo '\documentclass{article}\begin{document}Hello\end{document}' > /tmp/warmup/test.tex \
  && cd /tmp/warmup && tectonic test.tex || true \
  && rm -rf /tmp/warmup

# Copy production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN groupadd -r latex && useradd -r -g latex latex \
  && mkdir -p /home/latex/.cache/Tectonic \
  && chown -R latex:latex /app /home/latex

USER latex

# Environment configuration
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
# Memory optimization for Node.js
ENV NODE_OPTIONS="--max-old-space-size=384"
# Reduce logging in production
ENV LOG_LEVEL=warn

EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/healthz || exit 1

CMD ["node", "dist/index.js"]
