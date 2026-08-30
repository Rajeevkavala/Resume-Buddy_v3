# ============================================================
# Sync .env.production & SSH Keys to GitHub Repository Secrets
# ============================================================

$envFile = ".env.production"
if (-not (Test-Path $envFile)) {
    Write-Error "$envFile not found!"
    exit 1
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Syncing Production Secrets to GitHub Actions" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Sync all variables from .env.production
$lines = Get-Content $envFile
$count = 0

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
        continue
    }

    $idx = $trimmed.IndexOf('=')
    if ($idx -le 0) { continue }

    $key = $trimmed.Substring(0, $idx).Trim()
    $val = $trimmed.Substring($idx + 1).Trim()

    # Strip quotes if wrapped
    if ($val.StartsWith('"') -and $val.EndsWith('"') -and $val.Length -ge 2) {
        $val = $val.Substring(1, $val.Length - 2)
    } elseif ($val.StartsWith("'") -and $val.EndsWith("'") -and $val.Length -ge 2) {
        $val = $val.Substring(1, $val.Length - 2)
    }

    if ([string]::IsNullOrWhiteSpace($key)) { continue }

    Write-Host "Setting secret: $key..." -NoNewline
    $val | gh secret set $key
    Write-Host " [OK]" -ForegroundColor Green
    $count++
}

# 2. Add EC2 host and SSH Key
$ec2Host = if ($env:PROBE_TARGET_EC2_HOST) { $env:PROBE_TARGET_EC2_HOST } elseif ($env:EC2_HOST) { $env:EC2_HOST } else { "13.207.140.19" }
Write-Host "Setting secret: EC2_HOST ($ec2Host)..." -NoNewline
$ec2Host | gh secret set EC2_HOST
Write-Host " [OK]" -ForegroundColor Green
$count++

if (Test-Path "resumebuddy-key.pem") {
    Write-Host "Setting secret: EC2_SSH_PRIVATE_KEY..." -NoNewline
    Get-Content -Raw "resumebuddy-key.pem" | gh secret set EC2_SSH_PRIVATE_KEY
    Write-Host " [OK]" -ForegroundColor Green
    $count++
}

Write-Host "`nSuccessfully synced $count secrets to GitHub Repository!" -ForegroundColor Green
