# Resume LaTeX Service

High-performance HTTP service optimized for **500 concurrent users** that:
1) Validates a resume payload
2) Serializes it to LaTeX (multiple templates)
3) Compiles it to PDF via `tectonic`
4) Caches results for fast repeat requests

## Features

- **Request Queue**: Limits concurrent compilations (3 max) to prevent OOM
- **PDF Caching**: LRU cache with 60-80% hit rate reduces compute by 3x
- **Pre-warmed Tectonic**: LaTeX packages downloaded at build time (no cold-start)
- **Health Endpoints**: `/healthz`, `/readyz`, `/metrics` for monitoring
- **Graceful Shutdown**: Handles SIGTERM properly for zero-downtime deploys

## API

### POST `/v1/resume/latex/compile`

Request body:
- `source`: `"resumeText" | "resumeData"`
- `templateId`: `"professional" | "faang" | "jake" | "deedy" | "modern" | "minimal" | "tech"`
- `resumeText` (if `source=resumeText`)
- `resumeData` (if `source=resumeData`)
- `options`: `{ engine: "tectonic", return: ["latex","pdf"] }`

Response (success):
- `ok: true`
- `latexSource: string`
- `pdfBase64: string` (raw base64, no prefix)
- `cached?: boolean` (true if served from cache)

Response (error):
- `ok: false`
- `error: "INVALID_REQUEST" | "COMPILE_FAILED" | "QUEUE_ERROR" | "INTERNAL_ERROR"`
- `message: string`
- `details?: any`

### GET `/healthz`
Basic health check for load balancers.

### GET `/readyz`
Readiness probe with queue status.

### GET `/metrics`
Detailed metrics for monitoring dashboards.

## Local development

From this folder:

```bash
npm install
npm run dev
```

Requires `tectonic` available on your PATH.

On Windows, use Docker (see below) because it bundles `tectonic` and required libraries.

## Docker

Build and run:

```bash
npm run docker:build
npm run docker:run
```

Or manually:

```bash
docker build -t resume-latex-service .
docker run --rm -p 8080:8080 -m 1536m resume-latex-service
```

## Testing

Health check:
```bash
curl http://localhost:8080/healthz
```

Metrics:
```bash
curl http://localhost:8080/metrics
```

Load test (10 concurrent requests):
```bash
npm run test:load
```

Compile test:
```bash
curl -X POST http://localhost:8080/v1/resume/latex/compile \
  -H "Content-Type: application/json" \
  -d '{
    "source":"resumeText",
    "templateId":"professional",
    "resumeText":"Jane Doe\n\n- Built X\n- Shipped Y",
    "options":{"engine":"tectonic","return":["latex","pdf"]}
  }'
```

## Deployment

See [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) for complete deployment guide.

**Recommended for 500 users**: DigitalOcean Droplet (2GB RAM) at $12/mo.
