# ============================================================
# Fast Sync .env.production to Vercel (resume-buddy-v3)
# ============================================================

$envFile = ".env.production"
if (-not (Test-Path $envFile)) {
    Write-Error "$envFile not found!"
    exit 1
}

$projectName = "resume-buddy-v3"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Syncing .env.production Variables to Vercel ($projectName)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

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

    Write-Host "Setting $key for [production, preview, development]..." -NoNewline
    $val | npx vercel env add $key production preview development --project $projectName --force *>$null
    Write-Host " [OK]" -ForegroundColor Green
    $count++
}

Write-Host "`nSuccessfully synced $count environment variables to Vercel ($projectName)!" -ForegroundColor Green
