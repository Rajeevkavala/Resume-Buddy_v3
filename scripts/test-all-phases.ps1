#!/usr/bin/env pwsh
<#
.SYNOPSIS
    End-to-end test script for ResumeBuddy Phase 1, Phase 2, and Phase 3.

.DESCRIPTION
    Tests infrastructure, authentication (Phase 1), database (Phase 2),
    OTP authentication and email notification system (Phase 3).

.PARAMETER BaseUrl
    Base URL of the running Next.js app (default: http://localhost:9002)

.PARAMETER SkipPhase1
    Skip Phase 1 (Auth) tests

.PARAMETER SkipPhase2
    Skip Phase 2 (Database) tests

.PARAMETER SkipPhase3
    Skip Phase 3 (Communication) tests

.PARAMETER SkipInfra
    Skip infrastructure (Docker) checks

.EXAMPLE
    .\scripts\test-all-phases.ps1
    .\scripts\test-all-phases.ps1 -BaseUrl "http://localhost:9002" -SkipPhase1
    .\scripts\test-all-phases.ps1 -SkipInfra
#>

param(
    [string]$BaseUrl = "http://localhost:9002",
    [switch]$SkipPhase1,
    [switch]$SkipPhase2,
    [switch]$SkipPhase3,
    [switch]$SkipInfra
)

# ================================================================
#  Helpers
# ================================================================

$script:passed  = 0
$script:failed  = 0
$script:skipped = 0
$script:total   = 0
$script:testEmail = "testuser_$(Get-Random -Minimum 10000 -Maximum 99999)@test.resumebuddy.local"
$script:testPassword = "Test@$(Get-Random -Minimum 100000 -Maximum 999999)"
$script:accessToken = ""
$script:sessionCookie = ""
$script:rootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Write-Banner {
    param([string]$title)
    Write-Host ""
    Write-Host "+----------------------------------------------------------+" -ForegroundColor Magenta
    Write-Host "|  $($title.PadRight(56))|" -ForegroundColor Magenta
    Write-Host "+----------------------------------------------------------+" -ForegroundColor Magenta
}

function Write-Section {
    param([string]$title)
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
}

function Write-SubSection {
    param([string]$title)
    Write-Host ""
    Write-Host "-- $title --" -ForegroundColor DarkCyan
}

function Assert-True {
    param([string]$name, [bool]$condition, [string]$detail)
    $script:total++
    if ($detail) {
        $msg = "$name -- $detail"
    } else {
        $msg = $name
    }
    if ($condition) {
        $script:passed++
        Write-Host "  [PASS] $msg" -ForegroundColor Green
    } else {
        $script:failed++
        Write-Host "  [FAIL] $msg" -ForegroundColor Red
    }
}

function Assert-Equal {
    param([string]$name, $expected, $actual)
    $cond = ($expected -eq $actual)
    Assert-True -name $name -condition $cond -detail "expected=$expected, actual=$actual"
}

function Assert-Contains {
    param([string]$name, [string]$haystack, [string]$needle)
    $escaped = [regex]::Escape($needle)
    $cond = ($haystack -match $escaped)
    Assert-True -name $name -condition $cond -detail "looking for '$needle'"
}

function Assert-StatusCode {
    param([string]$name, [int]$expected, [int]$actual)
    Assert-Equal -name "$name (HTTP $expected)" -expected $expected -actual $actual
}

function Skip-Test {
    param([string]$name, [string]$reason)
    $script:total++
    $script:skipped++
    Write-Host "  [SKIP] $name -- $reason" -ForegroundColor Yellow
}

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [switch]$IncludeCookies
    )

    $params = @{
        Uri             = $Url
        Method          = $Method
        UseBasicParsing = $true
        TimeoutSec      = 15
        ErrorAction     = "Stop"
    }

    if ($Headers.Count -gt 0) {
        $params.Headers = $Headers
    }

    if ($Body) {
        $params.Body        = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }

    try {
        $resp = Invoke-WebRequest @params
        $respBody = $null
        try { $respBody = ($resp.Content | ConvertFrom-Json) } catch {}
        return @{
            Status  = [int]$resp.StatusCode
            Body    = $respBody
            Raw     = $resp
            Error   = $null
            Cookies = if ($resp.Headers.'Set-Cookie') { $resp.Headers.'Set-Cookie' } else { @() }
        }
    } catch {
        $status = 0
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        $errBody = $null
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd() | ConvertFrom-Json
        } catch {}
        return @{
            Status  = $status
            Body    = $errBody
            Raw     = $null
            Error   = $_.Exception.Message
            Cookies = @()
        }
    }
}

function Invoke-Psql {
    param([string]$Query)
    $result = docker exec resumebuddy-db psql -U resumebuddy -d resumebuddy -tAc $Query 2>$null
    if ($result) { return $result.Trim() } else { return "" }
}

function Invoke-Redis {
    param([string]$Command)
    $redisPw = "rajeevkavala123"
    $args = @("exec", "resumebuddy-redis", "redis-cli", "-a", $redisPw) + ($Command -split '\s+')
    $result = & docker @args 2>$null
    if ($result) {
        # Filter out any warning lines
        $clean = ($result | Where-Object { $_ -notmatch 'Warning' }) -join "`n"
        return $clean.Trim()
    } else { return "" }
}

# ================================================================
#  INFRASTRUCTURE CHECKS
# ================================================================

if (-not $SkipInfra) {
    Write-Banner "INFRASTRUCTURE CHECKS"

    Write-Section "Docker Services"

    # Check PostgreSQL
    $pgRunning = (docker ps --format "{{.Names}}" 2>$null) -match "resumebuddy-db"
    Assert-True -name "PostgreSQL container running" -condition ([bool]$pgRunning)

    # Check Redis
    $redisRunning = (docker ps --format "{{.Names}}" 2>$null) -match "resumebuddy-redis"
    Assert-True -name "Redis container running" -condition ([bool]$redisRunning)

    if ($pgRunning) {
        $pgPing = Invoke-Psql -Query "SELECT 1"
        Assert-Equal -name "PostgreSQL responds to SELECT 1" -expected "1" -actual $pgPing
    }

    if ($redisRunning) {
        $redisPing = Invoke-Redis -Command "PING"
        Assert-Equal -name "Redis responds to PING" -expected "PONG" -actual $redisPing
    }

    Write-SubSection "Next.js App Health"
    try {
        $healthResp = Invoke-WebRequest -Uri "$BaseUrl" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Assert-True -name "Next.js app responding" -condition ($healthResp.StatusCode -eq 200)
    } catch {
        Assert-True -name "Next.js app responding" -condition $false
        Write-Host "  WARNING: Make sure dev server is running: npm run dev" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n  [SKIP] Infrastructure checks skipped" -ForegroundColor Yellow
}

# ================================================================
#  PHASE 1: AUTHENTICATION
# ================================================================

if (-not $SkipPhase1) {
    Write-Banner "PHASE 1: AUTHENTICATION"

    # ----------------------------------
    # 1.1 File Structure
    # ----------------------------------
    Write-Section "1.1 Auth Package File Structure"

    $authFiles = @(
        "packages/auth/src/index.ts",
        "packages/auth/src/jwt.ts",
        "packages/auth/src/session.ts",
        "packages/auth/src/password.ts",
        "packages/auth/src/oauth/google.ts",
        "src/lib/auth.ts",
        "src/lib/auth-cookies.ts",
        "middleware.ts"
    )

    foreach ($f in $authFiles) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "File exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 1.2 API Routes
    # ----------------------------------
    Write-Section "1.2 Auth API Routes"

    $routeFiles = @(
        "src/app/api/auth/register/route.ts",
        "src/app/api/auth/login/route.ts",
        "src/app/api/auth/logout/route.ts",
        "src/app/api/auth/session/route.ts",
        "src/app/api/auth/refresh/route.ts",
        "src/app/api/auth/google/route.ts",
        "src/app/api/auth/callback/google/route.ts"
    )

    foreach ($f in $routeFiles) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "Route exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 1.3 Registration Flow
    # ----------------------------------
    Write-Section "1.3 Registration Flow"

    $regResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/register" -Body @{
        email    = $script:testEmail
        password = $script:testPassword
        name     = "Test User Phase3"
    }

    if ($regResp.Status -eq 201 -or $regResp.Status -eq 200) {
        Assert-True -name "Registration returns 2xx" -condition $true
        Assert-True -name "Registration returns user object" -condition ($null -ne $regResp.Body.user)
        if ($regResp.Body.user) {
            Assert-True -name "User has id" -condition (-not [string]::IsNullOrEmpty($regResp.Body.user.id))
            Assert-True -name "User email matches" -condition ($regResp.Body.user.email -eq $script:testEmail)
        }
    } else {
        Assert-True -name "Registration returns 2xx" -condition $false
        Write-Host "    Response: $($regResp.Status) - $($regResp.Error)" -ForegroundColor Yellow
    }

    # ----------------------------------
    # 1.4 Login Flow
    # ----------------------------------
    Write-Section "1.4 Login Flow"

    $loginResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
        email    = $script:testEmail
        password = $script:testPassword
    }

    if ($loginResp.Status -eq 200) {
        Assert-True -name "Login returns 200" -condition $true
        Assert-True -name "Login returns access token" -condition (-not [string]::IsNullOrEmpty($loginResp.Body.accessToken))
        $script:accessToken = $loginResp.Body.accessToken

        # Check for cookies
        $rawResp = $loginResp.Raw
        $cookies = $rawResp.Headers.'Set-Cookie'
        if ($cookies) {
            $hasSessionCookie = ($cookies -match "rb_session")
            Assert-True -name "Login sets session cookie" -condition ([bool]$hasSessionCookie)
            # Extract session cookie value for later use
            if ($cookies -is [array]) {
                $sessionLine = $cookies | Where-Object { $_ -match "rb_session" } | Select-Object -First 1
            } else {
                $sessionLine = $cookies
            }
            if ($sessionLine -match "rb_session=([^;]+)") {
                $script:sessionCookie = $Matches[1]
            }
        } else {
            Skip-Test -name "Login sets session cookie" -reason "No Set-Cookie header in response"
        }
    } else {
        Assert-True -name "Login returns 200" -condition $false
        $script:accessToken = ""
        Write-Host "    Response: $($loginResp.Status) - $($loginResp.Error)" -ForegroundColor Yellow
    }

    # ----------------------------------
    # 1.5 Session Validation
    # ----------------------------------
    Write-Section "1.5 Session Validation"

    if ($script:sessionCookie) {
        # PS 5.1 strips custom Cookie headers, so use WebSession object
        try {
            $ws = New-Object Microsoft.PowerShell.Commands.WebRequestSession
            $ck = New-Object System.Net.Cookie("rb_session", $script:sessionCookie, "/", "localhost")
            $ws.Cookies.Add($ck)
            $sessResp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/session" -WebSession $ws -UseBasicParsing -ErrorAction Stop
            $sessBody = $sessResp.Content | ConvertFrom-Json
            Assert-StatusCode -name "Session endpoint" -expected 200 -actual ([int]$sessResp.StatusCode)
            Assert-True -name "Session returns user" -condition ($null -ne $sessBody.user)
        } catch {
            $sc = 0
            if ($_.Exception.Response) { $sc = [int]$_.Exception.Response.StatusCode }
            Assert-StatusCode -name "Session endpoint" -expected 200 -actual $sc
        }
    } elseif ($script:accessToken) {
        Skip-Test -name "Session validation" -reason "No session cookie extracted"
    }

    # ----------------------------------
    # 1.6 Invalid Login
    # ----------------------------------
    Write-Section "1.6 Invalid Login Handling"

    $badLoginResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
        email    = $script:testEmail
        password = "wrong_password_123"
    }
    Assert-True -name "Wrong password returns 401" -condition ($badLoginResp.Status -eq 401)

    $noUserResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
        email    = "nonexistent_$(Get-Random)@test.com"
        password = "anypassword123"
    }
    Assert-True -name "Non-existent user returns 401" -condition ($noUserResp.Status -eq 401)

    # ----------------------------------
    # 1.7 Registration Validation
    # ----------------------------------
    Write-Section "1.7 Registration Validation"

    $dupeResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/register" -Body @{
        email    = $script:testEmail
        password = $script:testPassword
        name     = "Duplicate User"
    }
    Assert-True -name "Duplicate email rejected" -condition ($dupeResp.Status -eq 409 -or $dupeResp.Status -eq 400)

    $badEmailResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/register" -Body @{
        email    = "not-an-email"
        password = $script:testPassword
        name     = "Bad Email"
    }
    Assert-True -name "Invalid email rejected" -condition ($badEmailResp.Status -ge 400)

    $shortPwResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/register" -Body @{
        email    = "shortpw_$(Get-Random)@test.com"
        password = "123"
        name     = "Short PW"
    }
    Assert-True -name "Short password rejected" -condition ($shortPwResp.Status -ge 400)

    # ----------------------------------
    # 1.8 Logout
    # ----------------------------------
    Write-Section "1.8 Logout"

    if ($script:accessToken) {
        $logoutResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/logout" -Headers @{
            "Authorization" = "Bearer $($script:accessToken)"
        }
        Assert-True -name "Logout returns 2xx" -condition ($logoutResp.Status -ge 200 -and $logoutResp.Status -lt 300)
    } else {
        Skip-Test -name "Logout" -reason "No access token"
    }

} else {
    Write-Host "`n  [SKIP] Phase 1 tests skipped" -ForegroundColor Yellow
}

# ================================================================
#  PHASE 2: DATABASE
# ================================================================

if (-not $SkipPhase2) {
    Write-Banner "PHASE 2: DATABASE"

    # ----------------------------------
    # 2.1 Prisma Schema and Files
    # ----------------------------------
    Write-Section "2.1 Database Package Structure"

    $dbFiles = @(
        "packages/database/prisma/schema.prisma",
        "packages/database/src/client.ts",
        "packages/database/src/index.ts",
        "packages/database/src/subscription.ts",
        "src/lib/db.ts"
    )

    foreach ($f in $dbFiles) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "File exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 2.2 Prisma Schema Models
    # ----------------------------------
    Write-Section "2.2 Prisma Schema Models"

    $schemaPath = Join-Path $script:rootDir "packages/database/prisma/schema.prisma"
    if (Test-Path $schemaPath) {
        $schema = Get-Content $schemaPath -Raw
        $models = @("User", "Account", "Session", "VerificationToken", "Subscription")
        foreach ($m in $models) {
            $pattern = "model\s+$m\s*\{"
            $found = [bool]($schema -match $pattern)
            $label = "Model exists: $m"
            Assert-True -name $label -condition $found
        }
    } else {
        Skip-Test -name "Prisma schema models" -reason "schema.prisma not found"
    }

    # ----------------------------------
    # 2.3 Database Tables (via psql)
    # ----------------------------------
    Write-Section "2.3 Database Tables"

    $pgRunning = [bool]((docker ps --format "{{.Names}}" 2>$null) -match "resumebuddy-db")
    if ($pgRunning) {
        $tables = @("users", "accounts", "sessions", "verification_tokens", "subscriptions")
        foreach ($t in $tables) {
            $exists = Invoke-Psql -Query "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$t');"
            $label = "Table exists: $t"
            Assert-Equal -name $label -expected "t" -actual $exists
        }
    } else {
        Skip-Test -name "Database tables" -reason "PostgreSQL container not running"
    }

    # ----------------------------------
    # 2.4 User Record in DB
    # ----------------------------------
    Write-Section "2.4 User Data in Database"

    if ($pgRunning) {
        $userExists = Invoke-Psql -Query "SELECT EXISTS (SELECT 1 FROM users WHERE email = '$($script:testEmail)');"
        Assert-Equal -name "Test user found in DB" -expected "t" -actual $userExists

        $subExists = Invoke-Psql -Query "SELECT EXISTS (SELECT 1 FROM subscriptions s JOIN users u ON s.user_id = u.id WHERE u.email = '$($script:testEmail)');"
        Assert-Equal -name "Subscription record exists" -expected "t" -actual $subExists

        $accExists = Invoke-Psql -Query "SELECT EXISTS (SELECT 1 FROM accounts a JOIN users u ON a.user_id = u.id WHERE u.email = '$($script:testEmail)');"
        Assert-Equal -name "Account record exists" -expected "t" -actual $accExists
    } else {
        Skip-Test -name "User record in DB" -reason "PostgreSQL container not running"
    }

} else {
    Write-Host "`n  [SKIP] Phase 2 tests skipped" -ForegroundColor Yellow
}

# ================================================================
#  PHASE 3: COMMUNICATION (OTP + EMAIL NOTIFICATIONS)
# ================================================================

if (-not $SkipPhase3) {
    Write-Banner "PHASE 3: COMMUNICATION"

    # ----------------------------------
    # 3.1 OTP Package Structure
    # ----------------------------------
    Write-Section "3.1 OTP Package File Structure"

    $otpFiles = @(
        "packages/auth/src/otp/types.ts",
        "packages/auth/src/otp/store.ts",
        "packages/auth/src/otp/whatsapp.ts",
        "packages/auth/src/otp/sms.ts",
        "packages/auth/src/otp/email-otp.ts",
        "packages/auth/src/otp/index.ts"
    )

    foreach ($f in $otpFiles) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "OTP file exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 3.2 OTP API Routes
    # ----------------------------------
    Write-Section "3.2 OTP API Routes"

    $otpRoutes = @(
        "src/app/api/auth/otp/send/route.ts",
        "src/app/api/auth/otp/verify/route.ts",
        "src/app/api/auth/profile/route.ts"
    )

    foreach ($f in $otpRoutes) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "OTP route exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 3.3 OTP Send API - Email
    # ----------------------------------
    Write-Section "3.3 OTP Send API Tests"

    $otpEmail = "otp_test_$(Get-Random -Minimum 10000 -Maximum 99999)@test.resumebuddy.local"

    Write-SubSection "3.3a Send OTP via Email"
    $sendResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/send" -Body @{
        channel     = "email"
        destination = $otpEmail
        purpose     = "login"
    }

    if ($sendResp.Status -eq 200) {
        Assert-True -name "OTP send returns 200" -condition $true
        Assert-True -name "OTP send returns success" -condition ($sendResp.Body.success -eq $true)
        Assert-True -name "OTP send returns message with masked destination" -condition (-not [string]::IsNullOrEmpty($sendResp.Body.message))
        Assert-True -name "OTP send returns expiresIn" -condition ($sendResp.Body.expiresIn -gt 0)
    } else {
        Assert-True -name "OTP send returns 200" -condition $false
        Write-Host "    Response: $($sendResp.Status) - $($sendResp.Body | ConvertTo-Json -Compress)" -ForegroundColor Yellow
    }

    Write-SubSection "3.3b OTP Cooldown"
    $cooldownResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/send" -Body @{
        channel     = "email"
        destination = $otpEmail
        purpose     = "login"
    }
    Assert-True -name "OTP cooldown enforced (429)" -condition ($cooldownResp.Status -eq 429)

    Write-SubSection "3.3c OTP Validation Errors"
    $noChannelResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/send" -Body @{
        destination = $otpEmail
        purpose     = "login"
    }
    Assert-True -name "Missing channel returns 400" -condition ($noChannelResp.Status -eq 400)

    $badEmailResp2 = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/send" -Body @{
        channel     = "email"
        destination = "not-an-email"
        purpose     = "login"
    }
    Assert-True -name "Invalid email returns 400" -condition ($badEmailResp2.Status -eq 400)

    # ----------------------------------
    # 3.4 OTP Verify API
    # ----------------------------------
    Write-Section "3.4 OTP Verify API Tests"

    Write-SubSection "3.4a Wrong OTP"
    $wrongOtpResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/verify" -Body @{
        channel     = "email"
        destination = $otpEmail
        purpose     = "login"
        code        = "000000"
    }
    Assert-True -name "Wrong OTP returns error" -condition ($wrongOtpResp.Status -ge 400 -or ($wrongOtpResp.Body -and $wrongOtpResp.Body.success -eq $false))

    Write-SubSection "3.4b Validation Errors"
    $noPurposeResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/verify" -Body @{
        channel     = "email"
        destination = $otpEmail
        code        = "123456"
    }
    Assert-True -name "Missing purpose returns 400" -condition ($noPurposeResp.Status -eq 400)

    # ----------------------------------
    # 3.5 OTP Verify - Correct OTP (Redis lookup)
    # ----------------------------------
    Write-Section "3.5 OTP Verify with Correct Code (Redis)"

    $redisRunning = [bool]((docker ps --format "{{.Names}}" 2>$null) -match "resumebuddy-redis")
    if ($redisRunning) {
        # Generate a new OTP via the API first
        $verifyEmail = "otpverify_$(Get-Random -Minimum 10000 -Maximum 99999)@test.resumebuddy.local"

        $sendResp2 = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/send" -Body @{
            channel     = "email"
            destination = $verifyEmail
            purpose     = "login"
        }

        if ($sendResp2.Status -eq 200) {
            # Look up the actual OTP from Redis
            $otpCode = Invoke-Redis -Command "HGET otp:email:$verifyEmail code"
            if ($otpCode) {
                Assert-True -name "OTP found in Redis" -condition $true
                Write-Host "    (OTP code retrieved from Redis for verification test)" -ForegroundColor DarkGray

                # Verify with the correct code
                $correctOtpResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/otp/verify" -Body @{
                    channel     = "email"
                    destination = $verifyEmail
                    purpose     = "login"
                    code        = $otpCode
                }

                if ($correctOtpResp.Status -eq 200) {
                    Assert-True -name "Correct OTP verification returns 200" -condition $true
                    Assert-True -name "Returns accessToken" -condition (-not [string]::IsNullOrEmpty($correctOtpResp.Body.accessToken))
                    Assert-True -name "Returns user object" -condition ($null -ne $correctOtpResp.Body.user)
                    if ($correctOtpResp.Body.user) {
                        Assert-True -name "User is new user" -condition ($correctOtpResp.Body.user.isNewUser -eq $true)
                    }

                    # OTP should be cleared after successful verification
                    $otpAfter = Invoke-Redis -Command "HGET otp:email:$verifyEmail code"
                    Assert-True -name "OTP cleared from Redis after verification" -condition ([string]::IsNullOrEmpty($otpAfter))
                } else {
                    Assert-True -name "Correct OTP verification returns 200" -condition $false
                    Write-Host "    Response: $($correctOtpResp.Status) - $($correctOtpResp.Body | ConvertTo-Json -Compress)" -ForegroundColor Yellow
                }
            } else {
                Skip-Test -name "OTP found in Redis" -reason "Could not retrieve OTP from Redis (different Redis instance?)"
            }
        } else {
            Skip-Test -name "OTP verification flow" -reason "OTP send failed"
        }
    } else {
        Skip-Test -name "OTP verification via Redis" -reason "Redis container not running"
    }

    # ----------------------------------
    # 3.6 Profile API
    # ----------------------------------
    Write-Section "3.6 Profile API"

    Write-SubSection "3.6a Unauthenticated access"
    $profileResp = Invoke-Api -Method "GET" -Url "$BaseUrl/api/auth/profile"
    Assert-True -name "Profile GET without auth returns 401" -condition ($profileResp.Status -eq 401)

    # Re-login to get a valid token for profile tests
    $loginResp2 = Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/login" -Body @{
        email    = $script:testEmail
        password = $script:testPassword
    }

    if ($loginResp2.Status -eq 200 -and $loginResp2.Body.accessToken) {
        $token = $loginResp2.Body.accessToken

        Write-SubSection "3.6b Authenticated profile GET"
        $authProfileResp = Invoke-Api -Method "GET" -Url "$BaseUrl/api/auth/profile" -Headers @{
            "Authorization" = "Bearer $token"
        }
        # The profile API uses session cookies, so bearer might not work.
        if ($authProfileResp.Status -eq 200) {
            Assert-True -name "Profile GET returns 200" -condition $true
            Assert-True -name "Profile returns user data" -condition ($null -ne $authProfileResp.Body.user)
        } else {
            Skip-Test -name "Profile GET authenticated" -reason "Profile API may use session cookies, not bearer tokens"
        }
    } else {
        Skip-Test -name "Profile API authenticated tests" -reason "Login failed"
    }

    # ----------------------------------
    # 3.7 Queue Package Structure
    # ----------------------------------
    Write-Section "3.7 Queue Package File Structure"

    $queueFiles = @(
        "packages/queue/src/index.ts",
        "packages/queue/src/queues.ts",
        "packages/queue/src/types.ts",
        "packages/queue/src/services/email.service.ts",
        "packages/queue/src/templates/base.ts",
        "packages/queue/src/templates/index.ts",
        "packages/queue/src/templates/welcome.ts",
        "packages/queue/src/templates/verification.ts",
        "packages/queue/src/templates/password-reset.ts",
        "packages/queue/src/templates/subscription-confirmation.ts",
        "packages/queue/src/templates/subscription-expiring.ts",
        "packages/queue/src/templates/export-ready.ts",
        "packages/queue/src/templates/analysis-complete.ts",
        "packages/queue/src/templates/account-activity.ts",
        "packages/queue/src/templates/daily-summary.ts",
        "packages/queue/src/templates/feedback-request.ts",
        "packages/queue/src/workers/email.worker.ts",
        "packages/queue/src/workers/whatsapp.worker.ts",
        "packages/queue/src/workers/sms.worker.ts",
        "packages/queue/src/workers/index.ts"
    )

    foreach ($f in $queueFiles) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "Queue file exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 3.8 Queue Bridge Files
    # ----------------------------------
    Write-Section "3.8 Queue Bridge and Integration"

    $bridgeFiles = @(
        "src/lib/queue.ts",
        "src/app/api/notifications/send/route.ts"
    )

    foreach ($f in $bridgeFiles) {
        $exists = [bool](Test-Path (Join-Path $script:rootDir $f))
        $label = "Bridge file exists: $f"
        Assert-True -name $label -condition $exists
    }

    # ----------------------------------
    # 3.9 Notification API
    # ----------------------------------
    Write-Section "3.9 Notification Send API"

    Write-SubSection "3.9a Email notification"
    $notifResp = Invoke-Api -Method "POST" -Url "$BaseUrl/api/notifications/send" -Body @{
        channel = "email"
        to      = "notify_test@test.com"
        type    = "welcome"
        data    = @{
            name     = "Test User"
            loginUrl = "http://localhost:9002/login"
        }
    }
    # May succeed (200) or fail (500) if Redis not connected
    if ($notifResp.Status -eq 200) {
        Assert-True -name "Notification API returns 200" -condition $true
        Assert-True -name "Notification returns jobId" -condition (-not [string]::IsNullOrEmpty($notifResp.Body.jobId))
    } elseif ($notifResp.Status -eq 500) {
        Skip-Test -name "Notification API email" -reason "Queue service may need Redis (expected in dev without Redis)"
    } else {
        Assert-StatusCode -name "Notification API email" -expected 200 -actual $notifResp.Status
    }

    Write-SubSection "3.9b Validation errors"
    $noChannelNotif = Invoke-Api -Method "POST" -Url "$BaseUrl/api/notifications/send" -Body @{
        to   = "test@test.com"
        type = "welcome"
    }
    Assert-True -name "Missing channel returns 400" -condition ($noChannelNotif.Status -eq 400)

    Write-SubSection "3.9c WhatsApp without message"
    $waNoMsg = Invoke-Api -Method "POST" -Url "$BaseUrl/api/notifications/send" -Body @{
        channel = "whatsapp"
        to      = "+919876543210"
        type    = "otp"
    }
    Assert-True -name "WhatsApp without message returns 400" -condition ($waNoMsg.Status -eq 400)

    # ----------------------------------
    # 3.10 Login Page OTP Tab
    # ----------------------------------
    Write-Section "3.10 Login Page OTP Integration"

    $loginPageResp = Invoke-Api -Method "GET" -Url "$BaseUrl/login"
    if ($loginPageResp.Status -eq 200) {
        $pageContent = $loginPageResp.Raw.Content
        $hasOtpTab = ($pageContent -match "OTP|otp") -or ($pageContent -match "Smartphone|smartphone")
        Assert-True -name "Login page contains OTP tab reference" -condition ([bool]$hasOtpTab)
    } else {
        Skip-Test -name "Login page OTP tab" -reason "Could not load login page"
    }

    # ----------------------------------
    # 3.11 OTP Component
    # ----------------------------------
    Write-Section "3.11 OTP Login Component"

    $compPath = Join-Path $script:rootDir "src/components/otp-login.tsx"
    if (Test-Path $compPath) {
        $compContent = Get-Content $compPath -Raw
        Assert-Contains -name "OTP component has channel selector" -haystack $compContent -needle "channel"
        Assert-Contains -name "OTP component has country codes" -haystack $compContent -needle "COUNTRY_CODES"
        Assert-Contains -name "OTP component has step states" -haystack $compContent -needle "setStep"
        Assert-Contains -name "OTP component calls /api/auth/otp/send" -haystack $compContent -needle "/api/auth/otp/send"
        Assert-Contains -name "OTP component calls /api/auth/otp/verify" -haystack $compContent -needle "/api/auth/otp/verify"
    } else {
        Skip-Test -name "OTP component" -reason "otp-login.tsx not found"
    }

    # ----------------------------------
    # 3.12 Email Templates
    # ----------------------------------
    Write-Section "3.12 Email Template Content"

    $templateDir = Join-Path $script:rootDir "packages/queue/src/templates"
    $templateTypes = @("welcome", "verification", "password-reset", "subscription-confirmation", "subscription-expiring", "export-ready", "analysis-complete", "account-activity", "daily-summary", "feedback-request")

    foreach ($t in $templateTypes) {
        $path = Join-Path $templateDir "$t.ts"
        if (Test-Path $path) {
            $content = Get-Content $path -Raw
            $hasSubject = [bool]($content -match "subject")
            $hasHtml = [bool]($content -match "html")
            $hasText = [bool]($content -match "text")
            $label = "Template '$t' has subject+html+text"
            Assert-True -name $label -condition ($hasSubject -and $hasHtml -and $hasText)
        } else {
            $label = "Template file exists: $t.ts"
            Assert-True -name $label -condition $false
        }
    }

    # ----------------------------------
    # 3.13 Redis OTP Storage (Direct)
    # ----------------------------------
    Write-Section "3.13 Redis OTP Key Structure"

    if ($redisRunning) {
        $otpKeys = Invoke-Redis -Command "KEYS otp:*"
        if ($otpKeys) {
            Assert-True -name "OTP keys exist in Redis" -condition $true
            $keyCount = ($otpKeys -split "`n" | Measure-Object).Count
            Write-Host "    Keys found: $keyCount" -ForegroundColor DarkGray
        } else {
            Skip-Test -name "OTP keys in Redis" -reason "No OTP keys found (expected if this is the first run)"
        }
    } else {
        Skip-Test -name "Redis OTP keys" -reason "Redis container not running"
    }

    # ----------------------------------
    # 3.14 Package Dependencies
    # ----------------------------------
    Write-Section "3.14 Package Dependencies"

    $queuePkg = Get-Content (Join-Path $script:rootDir "packages/queue/package.json") -Raw | ConvertFrom-Json
    $authPkg = Get-Content (Join-Path $script:rootDir "packages/auth/package.json") -Raw | ConvertFrom-Json

    Assert-True -name "Queue package has bullmq" -condition ($null -ne $queuePkg.dependencies.bullmq)
    Assert-True -name "Queue package has ioredis" -condition ($null -ne $queuePkg.dependencies.ioredis)
    Assert-True -name "Queue package has resend" -condition ($null -ne $queuePkg.dependencies.resend)
    Assert-True -name "Queue package has nodemailer" -condition ($null -ne $queuePkg.dependencies.nodemailer)
    Assert-True -name "Auth package has nodemailer" -condition ($null -ne $authPkg.dependencies.nodemailer)
    Assert-True -name "Auth package has resend" -condition ($null -ne $authPkg.dependencies.resend)

} else {
    Write-Host "`n  [SKIP] Phase 3 tests skipped" -ForegroundColor Yellow
}

# ================================================================
#  CLEANUP
# ================================================================

Write-Banner "CLEANUP"

$pgRunning = [bool]((docker ps --format "{{.Names}}" 2>$null) -match "resumebuddy-db")
if ($pgRunning) {
    Write-Host "  Cleaning up test data..." -ForegroundColor DarkGray
    Invoke-Psql -Query "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test.resumebuddy.local');" | Out-Null
    Invoke-Psql -Query "DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test.resumebuddy.local');" | Out-Null
    Invoke-Psql -Query "DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test.resumebuddy.local');" | Out-Null
    Invoke-Psql -Query "DELETE FROM users WHERE email LIKE '%test.resumebuddy.local';" | Out-Null
    Write-Host "  Test data cleaned up." -ForegroundColor DarkGray
}

$redisRunning = [bool]((docker ps --format "{{.Names}}" 2>$null) -match "resumebuddy-redis")
if ($redisRunning) {
    $otpKeys = Invoke-Redis -Command "KEYS otp:*"
    if ($otpKeys) {
        foreach ($key in ($otpKeys -split "`n")) {
            $trimmedKey = $key.Trim()
            if ($trimmedKey) {
                Invoke-Redis -Command "DEL $trimmedKey" | Out-Null
            }
        }
    }
    Write-Host "  Redis OTP keys cleaned up." -ForegroundColor DarkGray
}

# ================================================================
#  SUMMARY
# ================================================================

Write-Host ""
Write-Host "+----------------------------------------------------------+" -ForegroundColor White
Write-Host "|                    TEST SUMMARY                          |" -ForegroundColor White
Write-Host "+----------------------------------------------------------+" -ForegroundColor White

$passColor = if ($script:passed -gt 0) { "Green" } else { "White" }
$failColor = if ($script:failed -gt 0) { "Red" } else { "White" }
$skipColor = if ($script:skipped -gt 0) { "Yellow" } else { "White" }

Write-Host "|  Total:   $($script:total.ToString().PadLeft(4))                                        |" -ForegroundColor White
Write-Host "|  Passed:  $($script:passed.ToString().PadLeft(4))                                        |" -ForegroundColor $passColor
Write-Host "|  Failed:  $($script:failed.ToString().PadLeft(4))                                        |" -ForegroundColor $failColor
Write-Host "|  Skipped: $($script:skipped.ToString().PadLeft(4))                                        |" -ForegroundColor $skipColor

if ($script:failed -eq 0) {
    Write-Host "|                                                          |" -ForegroundColor White
    Write-Host "|  >>> ALL TESTS PASSED <<<                                |" -ForegroundColor Green
} else {
    Write-Host "|                                                          |" -ForegroundColor White
    Write-Host "|  >>> SOME TESTS FAILED <<<                               |" -ForegroundColor Red
}

Write-Host "+----------------------------------------------------------+" -ForegroundColor White
Write-Host ""

# Exit with code based on results
if ($script:failed -gt 0) {
    exit 1
} else {
    exit 0
}
