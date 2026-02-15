# ============================================================
# ResumeBuddy 2.0 - Local Development Setup Script (Windows)
# ============================================================
# Usage: .\infrastructure\scripts\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   ResumeBuddy 2.0 - Infrastructure Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Check Prerequisites ----
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "  [OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Docker is not installed." -ForegroundColor Red
    Write-Host "  Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Determine compose command
$composeCmd = $null
try {
    docker compose version | Out-Null
    $composeCmd = "docker compose"
    Write-Host "  [OK] Docker Compose (plugin) found" -ForegroundColor Green
} catch {
    try {
        docker-compose --version | Out-Null
        $composeCmd = "docker-compose"
        Write-Host "  [OK] Docker Compose (standalone) found" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Docker Compose is not installed." -ForegroundColor Red
        exit 1
    }
}

# ---- Resolve Paths ----
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$DockerDir = Join-Path $RootDir "infrastructure\docker"

# ---- Create .env if not exists ----
Write-Host "[2/6] Setting up environment variables..." -ForegroundColor Yellow

$envFile = Join-Path $DockerDir ".env"
$templateFile = Join-Path $RootDir ".env.template"

if (-not (Test-Path $envFile)) {
    if (Test-Path $templateFile) {
        Copy-Item $templateFile $envFile
        Write-Host "  [OK] Created .env from template" -ForegroundColor Green
        Write-Host "  [WARN] Please edit infrastructure\docker\.env with your actual values" -ForegroundColor Yellow
    } else {
        # Generate development defaults
        $envContent = @"
# Database
DB_USER=resumebuddy
DB_PASSWORD=resumebuddy_dev_2024
DB_NAME=resumebuddy
DATABASE_URL=postgresql://resumebuddy:resumebuddy_dev_2024@localhost:5432/resumebuddy

# Redis
REDIS_PASSWORD=redis_dev_2024
REDIS_URL=redis://:redis_dev_2024@localhost:6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minio_dev_secret_2024
MINIO_BUCKET=resumebuddy

# Auth
JWT_SECRET=dev_jwt_secret_change_in_production_32chars
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_prod_32c

# App
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
"@
        Set-Content -Path $envFile -Value $envContent -Encoding UTF8
        Write-Host "  [OK] Created .env with development defaults" -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] .env already exists" -ForegroundColor Green
}

# ---- Start Infrastructure Services ----
Write-Host "[3/6] Starting infrastructure services..." -ForegroundColor Yellow

Push-Location $DockerDir
try {
    if ($composeCmd -eq "docker compose") {
        docker compose up -d postgres redis minio
    } else {
        docker-compose up -d postgres redis minio
    }
} catch {
    Write-Host "  [ERROR] Failed to start services: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

# ---- Wait for Health Checks ----
Write-Host "[4/6] Waiting for services to be healthy..." -ForegroundColor Yellow

$maxRetries = 30
$retryInterval = 2

# Wait for PostgreSQL
Write-Host -NoNewline "  Waiting for PostgreSQL..."
for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        if ($composeCmd -eq "docker compose") {
            $result = docker compose exec -T postgres pg_isready -U resumebuddy 2>&1
        } else {
            $result = docker-compose exec -T postgres pg_isready -U resumebuddy 2>&1
        }
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK] Ready" -ForegroundColor Green
            break
        }
    } catch {}
    if ($i -eq $maxRetries) {
        Write-Host " [FAIL] Timeout" -ForegroundColor Red
        Write-Host "  PostgreSQL failed to start. Check logs with: docker compose logs postgres" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds $retryInterval
}

# Wait for Redis
Write-Host -NoNewline "  Waiting for Redis..."
for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        if ($composeCmd -eq "docker compose") {
            $result = docker compose exec -T redis redis-cli -a redis_dev_2024 ping 2>&1
        } else {
            $result = docker-compose exec -T redis redis-cli -a redis_dev_2024 ping 2>&1
        }
        if ($result -match "PONG") {
            Write-Host " [OK] Ready" -ForegroundColor Green
            break
        }
    } catch {}
    if ($i -eq $maxRetries) {
        Write-Host " [FAIL] Timeout" -ForegroundColor Red
        Write-Host "  Redis failed to start. Check logs with: docker compose logs redis" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds $retryInterval
}

# Wait for MinIO
Write-Host -NoNewline "  Waiting for MinIO..."
for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host " [OK] Ready" -ForegroundColor Green
            break
        }
    } catch {}
    if ($i -eq $maxRetries) {
        Write-Host " [FAIL] Timeout" -ForegroundColor Red
        Write-Host "  MinIO failed to start. Check logs with: docker compose logs minio" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host -NoNewline "."
    Start-Sleep -Seconds $retryInterval
}

# ---- Create MinIO Bucket ----
Write-Host "[5/6] Setting up MinIO bucket..." -ForegroundColor Yellow

try {
    if ($composeCmd -eq "docker compose") {
        docker compose up -d minio-setup
    } else {
        docker-compose up -d minio-setup
    }
    Start-Sleep -Seconds 3
    Write-Host "  [OK] MinIO bucket created (or already exists)" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] MinIO bucket setup may have failed. Check manually." -ForegroundColor Yellow
}

Pop-Location

# ---- Print Summary ----
Write-Host "[6/6] Setup complete!" -ForegroundColor Yellow

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "         Infrastructure is Ready!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  PostgreSQL : localhost:5432" -ForegroundColor White
Write-Host "  Redis      : localhost:6379" -ForegroundColor White
Write-Host "  MinIO API  : http://localhost:9000" -ForegroundColor White
Write-Host "  MinIO UI   : http://localhost:9001" -ForegroundColor White
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Edit infrastructure\docker\.env with your secrets" -ForegroundColor White
Write-Host "  2. Run 'pnpm install' in root directory" -ForegroundColor White
Write-Host "  3. Run 'pnpm dev' to start the Next.js app" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
