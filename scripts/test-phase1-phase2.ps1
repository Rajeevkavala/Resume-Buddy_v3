#!/usr/bin/env pwsh
<#
.SYNOPSIS
    End-to-end test script for ResumeBuddy Phase 1 and Phase 2.

.DESCRIPTION
    Tests infrastructure, auth, database layer, and business logic.

.PARAMETER BaseUrl
    Base URL of the running Next.js app (default: http://localhost:9002)

.PARAMETER SkipInfra
    Skip infrastructure (Docker) checks

.PARAMETER SkipAuth
    Skip authentication tests

.PARAMETER SkipDatabase
    Skip database layer tests

.PARAMETER SkipBusinessLogic
    Skip business logic tests

.EXAMPLE
    .\scripts\test-phase1-phase2.ps1
    .\scripts\test-phase1-phase2.ps1 -BaseUrl "http://localhost:9002" -SkipInfra
#>

param(
    [string]$BaseUrl = "http://localhost:9002",
    [switch]$SkipInfra,
    [switch]$SkipAuth,
    [switch]$SkipDatabase,
    [switch]$SkipBusinessLogic
)

# ----------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------

$script:passed  = 0
$script:failed  = 0
$script:skipped = 0
$script:total   = 0

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
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session = $null
    )

    $params = @{
        Uri             = $Url
        Method          = $Method
        UseBasicParsing = $true
        TimeoutSec      = 15
        ErrorAction     = "Stop"
    }

    if ($Session) { $params.WebSession = $Session }
    if ($Body) {
        $params.Body        = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }

    try {
        $resp = Invoke-WebRequest @params
        return @{
            Status = [int]$resp.StatusCode
            Body   = ($resp.Content | ConvertFrom-Json)
            Raw    = $resp
            Error  = $null
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
            Status = $status
            Body   = $errBody
            Raw    = $null
            Error  = $_.Exception.Message
        }
    }
}

# Helper: run psql query and return trimmed result
function Invoke-Psql {
    param([string]$Query)
    $result = docker exec resumebuddy-db psql -U resumebuddy -d resumebuddy -tAc $Query 2>$null
    if ($result) { return $result.Trim() } else { return "" }
}

# Helper: run psql command (no output expected)
function Invoke-PsqlCmd {
    param([string]$Query)
    docker exec resumebuddy-db psql -U resumebuddy -d resumebuddy -c $Query 2>$null | Out-Null
}

# Helper: run psql command and capture all output including errors
function Invoke-PsqlCmdCapture {
    param([string]$Query)
    $result = docker exec resumebuddy-db psql -U resumebuddy -d resumebuddy -c $Query 2>&1 | Out-String
    return $result
}

# ----------------------------------------------------------------
# PHASE 1.1 - Infrastructure
# ----------------------------------------------------------------

if (-not $SkipInfra) {
    Write-Section -title "PHASE 1.1 - Infrastructure (Docker)"

    Write-SubSection -title "Docker Containers"

    # 1. PostgreSQL container
    $pgStatus = docker inspect --format '{{.State.Health.Status}}' resumebuddy-db 2>$null
    Assert-Equal -name "PostgreSQL container healthy" -expected "healthy" -actual $pgStatus

    # 2. Redis container
    $redisStatus = docker inspect --format '{{.State.Health.Status}}' resumebuddy-redis 2>$null
    Assert-Equal -name "Redis container healthy" -expected "healthy" -actual $redisStatus

    # 3. MinIO container
    $minioStatus = docker inspect --format '{{.State.Health.Status}}' resumebuddy-storage 2>$null
    Assert-Equal -name "MinIO container healthy" -expected "healthy" -actual $minioStatus

    Write-SubSection -title "Service Connectivity"

    # 4. PostgreSQL can execute queries
    $pgResult = Invoke-Psql -Query "SELECT 1;"
    Assert-Equal -name "PostgreSQL responds to SELECT 1" -expected "1" -actual $pgResult

    # 5. Redis responds to PING
    $redisPong = docker exec resumebuddy-redis redis-cli -a rajeevkavala123 PING 2>$null | Select-String "PONG"
    Assert-True -name "Redis responds to PING" -condition ($null -ne $redisPong)

    # 6. MinIO health endpoint
    try {
        $minioHealth = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5
        Assert-Equal -name "MinIO health endpoint returns 200" -expected 200 -actual ([int]$minioHealth.StatusCode)
    } catch {
        Assert-True -name "MinIO health endpoint reachable" -condition $false
    }

    Write-SubSection -title "Health API Endpoint"

    # 7. GET /api/health
    $health = Invoke-Api -Url "$BaseUrl/api/health"
    Assert-Equal -name "Health API returns 200" -expected 200 -actual $health.Status
    Assert-Equal -name "Database healthy" -expected "healthy" -actual $health.Body.services.database.status
    Assert-Equal -name "Redis healthy" -expected "healthy" -actual $health.Body.services.redis.status

    $dbLatency = $health.Body.services.database.latencyMs
    Assert-True -name "Database latency under 1000ms" -condition ($dbLatency -lt 1000) -detail "latency=${dbLatency}ms"

    $redisLatency = $health.Body.services.redis.latencyMs
    Assert-True -name "Redis latency under 1000ms" -condition ($redisLatency -lt 1000) -detail "latency=${redisLatency}ms"

    Assert-True -name "Version present" -condition ($null -ne $health.Body.version) -detail "version=$($health.Body.version)"
    Assert-True -name "Uptime greater than 0" -condition ($health.Body.uptime -gt 0) -detail "uptime=$($health.Body.uptime)s"
}

# ----------------------------------------------------------------
# PHASE 1.2 - Authentication
# ----------------------------------------------------------------

if (-not $SkipAuth) {
    Write-Section -title "PHASE 1.2 - Authentication System"

    $testEmail    = "test_$(Get-Random -Maximum 99999)@resumebuddy-test.com"
    $testPassword = 'SecureP@ss123!'
    $testName     = "Test User"

    Write-SubSection -title "Registration"

    # 1. Successful registration
    $reg = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Body @{
        email    = $testEmail
        password = $testPassword
        name     = $testName
    }
    Assert-Equal -name "Register returns 201" -expected 201 -actual $reg.Status
    Assert-True  -name "Register returns user object" -condition ($null -ne $reg.Body.user) -detail "user=$($reg.Body.user.email)"
    Assert-Equal -name "Registered email matches" -expected $testEmail -actual $reg.Body.user.email
    $hasToken = ($null -ne $reg.Body.accessToken) -and ($reg.Body.accessToken.Length -gt 20)
    Assert-True  -name "Register returns access token" -condition $hasToken
    Assert-True  -name "Register returns expiresIn" -condition ($reg.Body.expiresIn -gt 0) -detail "expiresIn=$($reg.Body.expiresIn)"
    Assert-Equal -name "Default tier is free" -expected "free" -actual $reg.Body.user.tier

    $userId = $reg.Body.user.id

    # 2. Duplicate registration should fail
    $dup = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Body @{
        email    = $testEmail
        password = "AnotherPass1!@"
        name     = "Dup User"
    }
    Assert-Equal -name "Duplicate registration returns 409" -expected 409 -actual $dup.Status

    # 3. Weak password should fail
    $weakEmail = "weak_$(Get-Random)@test.com"
    $weak = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Body @{
        email    = $weakEmail
        password = "12"
        name     = "Weak"
    }
    Assert-True -name "Weak password rejected (400)" -condition ($weak.Status -eq 400) -detail "status=$($weak.Status)"

    # 4. Invalid email should fail
    $badEmail = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Body @{
        email    = "not-an-email"
        password = $testPassword
        name     = "Bad Email"
    }
    Assert-True -name "Invalid email rejected (400)" -condition ($badEmail.Status -eq 400)

    Write-SubSection -title "Login"

    # 5. Successful login (with session capture)
    $loginResp = $null
    $loginSession = $null
    try {
        $loginBody = @{ email = $testEmail; password = $testPassword } | ConvertTo-Json
        $loginReq = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method POST `
            -ContentType "application/json" -Body $loginBody `
            -SessionVariable loginSession -UseBasicParsing -ErrorAction Stop
        $loginResp = $loginReq.Content | ConvertFrom-Json
        Assert-True  -name "Login returns 200" -condition $true
        Assert-Equal -name "Logged in user email matches" -expected $testEmail -actual $loginResp.user.email
        Assert-True  -name "Login returns access token" -condition ($null -ne $loginResp.accessToken)
    } catch {
        Assert-True -name "Login returns 200" -condition $false
        $loginSession = $null
    }

    # 6. Wrong password
    $wrongPw = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/login" -Body @{
        email    = $testEmail
        password = "WrongP@ss999!"
    }
    Assert-Equal -name "Wrong password returns 401" -expected 401 -actual $wrongPw.Status

    # 7. Non-existent user
    $fakeEmail = "nobody_$(Get-Random)@nowhere.com"
    $noUser = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/login" -Body @{
        email    = $fakeEmail
        password = $testPassword
    }
    Assert-Equal -name "Non-existent user returns 401" -expected 401 -actual $noUser.Status

    Write-SubSection -title "Session Management"

    if ($loginSession) {
        # 8. Get session
        try {
            $sesReq = Invoke-WebRequest -Uri "$BaseUrl/api/auth/session" -Method GET `
                -WebSession $loginSession -UseBasicParsing -ErrorAction Stop
            $sesData = $sesReq.Content | ConvertFrom-Json
            Assert-True -name "Session returns user" -condition ($null -ne $sesData.user) -detail "email=$($sesData.user.email)"
        } catch {
            Assert-True -name "Session GET succeeds" -condition $false
        }

        # 9. Refresh token
        try {
            $refReq = Invoke-WebRequest -Uri "$BaseUrl/api/auth/refresh" -Method POST `
                -WebSession $loginSession -UseBasicParsing -ErrorAction Stop
            $refData = $refReq.Content | ConvertFrom-Json
            Assert-True -name "Token refresh returns new token" -condition ($null -ne $refData.accessToken)
            Assert-True -name "Token refresh returns expiresIn" -condition ($refData.expiresIn -gt 0)
        } catch {
            Assert-True -name "Token refresh succeeds" -condition $false
        }

        # 10. Logout
        try {
            Invoke-WebRequest -Uri "$BaseUrl/api/auth/logout" -Method POST `
                -WebSession $loginSession -UseBasicParsing -ErrorAction Stop | Out-Null
            Assert-True -name "Logout returns 200" -condition $true
        } catch {
            Assert-True -name "Logout succeeds" -condition $false
        }

        # 11. Session should be invalid after logout
        try {
            Invoke-WebRequest -Uri "$BaseUrl/api/auth/session" -Method GET `
                -WebSession $loginSession -UseBasicParsing -ErrorAction Stop | Out-Null
            Assert-True -name "Session invalidated after logout" -condition $false
        } catch {
            $logoutStatus = 0
            if ($_.Exception.Response) { $logoutStatus = [int]$_.Exception.Response.StatusCode }
            Assert-True -name "Session invalidated after logout (401)" -condition ($logoutStatus -eq 401) -detail "status=$logoutStatus"
        }
    } else {
        Skip-Test -name "Session GET" -reason "login session not available"
        Skip-Test -name "Token refresh" -reason "login session not available"
        Skip-Test -name "Logout" -reason "login session not available"
        Skip-Test -name "Session invalidation" -reason "login session not available"
    }

    Write-SubSection -title "Route Protection"

    # 12. Unauthenticated session access should return 401
    $unauth = Invoke-Api -Url "$BaseUrl/api/auth/session"
    Assert-True -name "Unauthenticated session returns 401" -condition ($unauth.Status -eq 401) -detail "status=$($unauth.Status)"
}

# ----------------------------------------------------------------
# PHASE 2.1 - Database Layer
# ----------------------------------------------------------------

if (-not $SkipDatabase) {
    Write-Section -title "PHASE 2.1 - Database Layer (Prisma + PostgreSQL)"

    Write-SubSection -title "Schema Validation"

    # 1. Prisma schema validates
    $prismaOut = & npx prisma validate --schema packages/database/prisma/schema.prisma 2>&1 | Out-String
    Assert-Contains -name "Prisma schema is valid" -haystack $prismaOut -needle "is valid"

    Write-SubSection -title "Table Verification"

    # 2. Check all 12 tables exist
    $expectedTables = @(
        "users", "accounts", "sessions", "refresh_tokens",
        "verification_tokens", "subscriptions", "payments",
        "usage_records", "resume_data", "interviews",
        "stored_files", "generated_resumes"
    )

    $tablesRaw = Invoke-Psql -Query "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    $tableList = @()
    foreach ($line in ($tablesRaw -split "`n")) {
        $t = $line.Trim()
        if ($t -ne "") { $tableList += $t }
    }

    Assert-Equal -name "Total table count = 12" -expected 12 -actual $tableList.Count

    foreach ($tbl in $expectedTables) {
        Assert-True -name "Table '$tbl' exists" -condition ($tableList -contains $tbl)
    }

    Write-SubSection -title "Column Types"

    # 3. User.id is varchar(128) not uuid  (using concat() to avoid PS parse issue with ||)
    $colTypeQuery = "SELECT concat(data_type, '(', character_maximum_length, ')') FROM information_schema.columns WHERE table_name='users' AND column_name='id';"
    $userIdType = Invoke-Psql -Query $colTypeQuery
    Assert-Contains -name "User.id column is varchar(128)" -haystack $userIdType -needle "character varying(128)"

    # 4. Enums exist
    $enumsRaw = Invoke-Psql -Query "SELECT typname FROM pg_type WHERE typtype='e' ORDER BY typname;"
    $enumList = @()
    foreach ($line in ($enumsRaw -split "`n")) {
        $e = $line.Trim()
        if ($e -ne "") { $enumList += $e }
    }
    Assert-True -name "Enums created (count >= 8)" -condition ($enumList.Count -ge 8) -detail "found=$($enumList.Count)"

    Write-SubSection -title "CRUD Operations"

    # 5. Insert a test user directly via SQL
    $testUserId    = "test-crud-$(Get-Random -Maximum 99999)"
    $testUserEmail = "crud_$(Get-Random -Maximum 99999)@test.com"

    $insertUserSql = "INSERT INTO users (id, email, role, status, email_verified, phone_verified, created_at, updated_at) VALUES ('$testUserId', '$testUserEmail', 'USER', 'ACTIVE', false, false, NOW(), NOW()) ON CONFLICT DO NOTHING;"
    Invoke-PsqlCmd -Query $insertUserSql

    $insertCheck = Invoke-Psql -Query "SELECT email FROM users WHERE id='$testUserId';"
    Assert-Equal -name "User inserted and queryable" -expected $testUserEmail -actual $insertCheck

    # 6. Insert subscription for the test user
    $insertSubSql = "INSERT INTO subscriptions (id, user_id, tier, status, created_at, updated_at) VALUES (gen_random_uuid(), '$testUserId', 'FREE', 'ACTIVE', NOW(), NOW()) ON CONFLICT DO NOTHING;"
    Invoke-PsqlCmd -Query $insertSubSql

    $subCheck = Invoke-Psql -Query "SELECT tier FROM subscriptions WHERE user_id='$testUserId';"
    Assert-Equal -name "Subscription created with FREE tier" -expected "FREE" -actual $subCheck

    # 7. Insert usage record
    $insertUsageSql = "INSERT INTO usage_records (id, user_id, feature, count, date, created_at) VALUES (gen_random_uuid(), '$testUserId', 'analyze-resume', 1, CURRENT_DATE, NOW()) ON CONFLICT(user_id, feature, date) DO UPDATE SET count = usage_records.count + 1;"
    Invoke-PsqlCmd -Query $insertUsageSql

    $usageCheck = Invoke-Psql -Query "SELECT count FROM usage_records WHERE user_id='$testUserId' AND feature='analyze-resume';"
    Assert-True -name "Usage record inserted" -condition ([int]$usageCheck -ge 1) -detail "count=$usageCheck"

    # 8. Insert resume data
    $insertResumeSql = "INSERT INTO resume_data (id, user_id, resume_text, is_active, created_at, updated_at) VALUES (gen_random_uuid(), '$testUserId', 'Test resume text for CRUD validation', true, NOW(), NOW()) ON CONFLICT DO NOTHING;"
    Invoke-PsqlCmd -Query $insertResumeSql

    $resumeCheck = Invoke-Psql -Query "SELECT resume_text FROM resume_data WHERE user_id='$testUserId' AND is_active=true;"
    Assert-Contains -name "Resume data inserted" -haystack $resumeCheck -needle "Test resume text"

    Write-SubSection -title "Foreign Key Constraints"

    # 9. FK should prevent inserting with non-existent user
    $fkSql = "INSERT INTO subscriptions (id, user_id, tier, status, created_at, updated_at) VALUES (gen_random_uuid(), 'nonexistent-user-id-12345', 'FREE', 'ACTIVE', NOW(), NOW());"
    $fkResult = Invoke-PsqlCmdCapture -Query $fkSql
    Assert-Contains -name "FK constraint prevents orphan subscription" -haystack $fkResult -needle "violates foreign key"

    Write-SubSection -title "Indexes"

    # 10. Check critical indexes exist
    $indexesRaw = Invoke-Psql -Query "SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname;"
    Assert-Contains -name "users_email_key index exists" -haystack $indexesRaw -needle "users_email_key"
    Assert-Contains -name "usage_records userId+feature+date unique" -haystack $indexesRaw -needle "usage_records_user_id_feature_date_key"

    # Cleanup test data
    Invoke-PsqlCmd -Query "DELETE FROM users WHERE id='$testUserId';"
}

# ----------------------------------------------------------------
# PHASE 2.2 - Business Logic
# ----------------------------------------------------------------

if (-not $SkipBusinessLogic) {
    Write-Section -title "PHASE 2.2 - Business Logic (Subscription, Rate Limiting, Caching)"

    Write-SubSection -title "Rate Limit API"

    # 1. Rate limit status for unknown user
    $rlUser = "phase2-test-user-$(Get-Random)"
    $rl = Invoke-Api -Url "$BaseUrl/api/rate-limit/status?userId=$rlUser"
    Assert-Equal -name "Rate limit API returns 200" -expected 200 -actual $rl.Status
    Assert-True  -name "Rate limit returns success=true" -condition ($rl.Body.success -eq $true)
    Assert-Equal -name "Free tier daily limit = 5" -expected 5 -actual $rl.Body.daily.limit
    Assert-Equal -name "Used count starts at 0" -expected 0 -actual $rl.Body.daily.used
    Assert-Equal -name "Remaining = limit (5)" -expected 5 -actual $rl.Body.daily.remaining
    $resetMatch = $rl.Body.daily.resetAt -match '^\d{4}-\d{2}-\d{2}T'
    Assert-True  -name "ResetAt is a valid ISO date" -condition $resetMatch

    # 2. Rate limit config
    Assert-True -name "Config dailyLimit present" -condition ($rl.Body.config.dailyLimit -gt 0) -detail "dailyLimit=$($rl.Body.config.dailyLimit)"
    Assert-True -name "Config requestsPerMinute present" -condition ($rl.Body.config.requestsPerMinute -gt 0) -detail "rpm=$($rl.Body.config.requestsPerMinute)"
    Assert-True -name "Config operations list non-empty" -condition ($rl.Body.config.operations.Count -gt 0) -detail "ops=$($rl.Body.config.operations.Count)"

    Write-SubSection -title "Rate Limit - Daily Reset"

    # 3. POST reset (admin action)
    $resetUser = "reset-test-$(Get-Random)"
    $resetResult = Invoke-Api -Method POST -Url "$BaseUrl/api/rate-limit/status" -Body @{
        userId = $resetUser
        action = "reset"
    }
    $resetOk = ($resetResult.Body.success -eq $true) -or ($resetResult.Status -eq 200)
    Assert-True -name "Daily usage reset returns success" -condition $resetOk -detail "status=$($resetResult.Status)"

    Write-SubSection -title "Data Persistence (via API)"

    # Create a fresh user via register, then test data flow
    $dpEmail  = "datapersist_$(Get-Random -Maximum 99999)@test.com"
    $dpPasswd = 'DataTest1@#Secure'
    $dpReg = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Body @{
        email    = $dpEmail
        password = $dpPasswd
        name     = "Data Persist Test"
    }

    if ($dpReg.Status -eq 201) {
        $dpUserId = $dpReg.Body.user.id
        Assert-True -name "Test user created for data persistence" -condition $true -detail "id=$dpUserId"

        # 4. Verify user exists in PostgreSQL
        $dbUser = Invoke-Psql -Query "SELECT email FROM users WHERE id='$dpUserId';"
        Assert-Equal -name "User persisted in PostgreSQL" -expected $dpEmail -actual $dbUser

        # 5. Verify subscription auto-created
        $dbSub = Invoke-Psql -Query "SELECT tier FROM subscriptions WHERE user_id='$dpUserId';"
        Assert-Equal -name "Subscription auto-created (FREE)" -expected "FREE" -actual $dbSub

        # 6. Verify account created
        $dbAcct = Invoke-Psql -Query "SELECT provider FROM accounts WHERE user_id='$dpUserId';"
        Assert-Equal -name "Account record created (credentials)" -expected "credentials" -actual $dbAcct

        # 7. Verify refresh token stored
        $dbRefresh = Invoke-Psql -Query "SELECT COUNT(*) FROM refresh_tokens WHERE user_id='$dpUserId';"
        Assert-True -name "Refresh token stored in DB" -condition ([int]$dbRefresh -ge 1) -detail "count=$dbRefresh"
    } else {
        Skip-Test -name "Data persistence tests" -reason "Registration failed with status $($dpReg.Status)"
    }

    Write-SubSection -title "Redis Integration"

    # 8. Check Redis has session data
    try {
        $redisKeys = docker exec resumebuddy-redis redis-cli -a rajeevkavala123 KEYS "session:*" 2>$null | Out-String
        Assert-True -name "Redis has session keys" -condition ($redisKeys.Length -gt 5) -detail "keys found"
    } catch {
        Skip-Test -name "Redis session keys" -reason "Could not query Redis"
    }

    # 9. Redis keyspace info
    try {
        $redisInfo = docker exec resumebuddy-redis redis-cli -a rajeevkavala123 INFO keyspace 2>$null | Out-String
        Assert-True -name "Redis keyspace info accessible" -condition ($redisInfo -match "db0") -detail "has db0"
    } catch {
        Skip-Test -name "Redis keyspace" -reason "Could not query Redis INFO"
    }

    Write-SubSection -title "Subscription Service"

    # 10. Rate limit returns correct tier limits for free user
    if ($dpReg -and $dpReg.Status -eq 201) {
        $dpUserId = $dpReg.Body.user.id
        $tierCheck = Invoke-Api -Url "$BaseUrl/api/rate-limit/status?userId=$dpUserId"
        Assert-Equal -name "Registered user gets 5 daily AI credits" -expected 5 -actual $tierCheck.Body.daily.limit
        Assert-Equal -name "Registered user starts with 0 used" -expected 0 -actual $tierCheck.Body.daily.used

        # 11. Simulate Pro upgrade and verify limits (directly in DB)
        $proUpgradeSql = "UPDATE subscriptions SET tier='PRO', status='ACTIVE', current_period_end=(NOW() + INTERVAL '30 days') WHERE user_id='$dpUserId';"
        Invoke-PsqlCmd -Query $proUpgradeSql

        $proCheck = Invoke-Api -Url "$BaseUrl/api/rate-limit/status?userId=$dpUserId"
        Assert-Equal -name "Pro user gets 10 daily AI credits" -expected 10 -actual $proCheck.Body.daily.limit

        # 12. Revert to Free
        $revertSql = "UPDATE subscriptions SET tier='FREE', status='ACTIVE', current_period_end=NULL WHERE user_id='$dpUserId';"
        Invoke-PsqlCmd -Query $revertSql

        $freeCheck = Invoke-Api -Url "$BaseUrl/api/rate-limit/status?userId=$dpUserId"
        Assert-Equal -name "Reverted user back to 5 credits" -expected 5 -actual $freeCheck.Body.daily.limit
    } else {
        Skip-Test -name "Subscription tier limits" -reason "No test user available"
    }

    Write-SubSection -title "Usage Tracking"

    # 13. Insert usage records directly and check rate limit reflects them
    if ($dpReg -and $dpReg.Status -eq 201) {
        $dpUserId = $dpReg.Body.user.id

        # Use local date to match Node.js getStartOfToday() (pg driver uses local time, not UTC)
        $localToday = (Get-Date).ToString("yyyy-MM-dd")

        # Insert usage records for today using recognized AI features
        $feat1Sql = "INSERT INTO usage_records (id, user_id, feature, count, date, created_at) VALUES (gen_random_uuid(), '$dpUserId', 'generate-qa', 1, '$localToday', NOW()) ON CONFLICT(user_id, feature, date) DO UPDATE SET count = 1;"
        Invoke-PsqlCmd -Query $feat1Sql

        $feat2Sql = "INSERT INTO usage_records (id, user_id, feature, count, date, created_at) VALUES (gen_random_uuid(), '$dpUserId', 'improve-resume', 1, '$localToday', NOW()) ON CONFLICT(user_id, feature, date) DO UPDATE SET count = 1;"
        Invoke-PsqlCmd -Query $feat2Sql

        $mainUsageSql = "INSERT INTO usage_records (id, user_id, feature, count, date, created_at) VALUES (gen_random_uuid(), '$dpUserId', 'analyze-resume', 2, '$localToday', NOW()) ON CONFLICT(user_id, feature, date) DO UPDATE SET count = 2;"
        Invoke-PsqlCmd -Query $mainUsageSql

        $usageCheck = Invoke-Api -Url "$BaseUrl/api/rate-limit/status?userId=$dpUserId"
        Assert-True -name "Usage tracking reflects DB records" -condition ($usageCheck.Body.daily.used -ge 2) -detail "used=$($usageCheck.Body.daily.used)"
        Assert-True -name "Remaining decremented" -condition ($usageCheck.Body.daily.remaining -le 3) -detail "remaining=$($usageCheck.Body.daily.remaining)"
    }

    Write-SubSection -title "Webhook Endpoint"

    # 14. Razorpay webhook health check
    $whHealth = Invoke-Api -Url "$BaseUrl/api/webhooks/razorpay"
    Assert-Equal -name "Razorpay webhook GET returns 200" -expected 200 -actual $whHealth.Status
    Assert-Equal -name "Webhook status OK" -expected "ok" -actual $whHealth.Body.status
    Assert-True  -name "Webhook lists expected events" -condition ($whHealth.Body.events.Count -ge 2) -detail "events=$($whHealth.Body.events -join ',')"

    # 15. Razorpay webhook POST without signature should fail
    $whBad = Invoke-Api -Method POST -Url "$BaseUrl/api/webhooks/razorpay" -Body @{
        event = "order.paid"
    }
    $whBadOk = ($whBad.Status -eq 401) -or ($whBad.Status -eq 400) -or ($whBad.Status -eq 500)
    Assert-True -name "Unsigned webhook POST rejected" -condition $whBadOk -detail "status=$($whBad.Status)"

    Write-SubSection -title "No Firestore in Critical Paths"

    # 16. Verify key files do not import firestore
    $criticalFiles = @(
        "src/lib/subscription-service.ts",
        "src/lib/rate-limiter.ts",
        "src/lib/response-cache.ts",
        "src/lib/user-cache.ts",
        "src/lib/data-persistence.ts",
        "src/app/api/rate-limit/status/route.ts"
    )

    foreach ($f in $criticalFiles) {
        $fullPath = Join-Path (Join-Path $PSScriptRoot "..") $f
        if (Test-Path $fullPath) {
            $content = Get-Content $fullPath -Raw
            $importFirestore = $content -match 'from\s+[''"]@/lib/firestore[''"]'
            $importFbFirestore = $content -match 'from\s+[''"]firebase/firestore[''"]'
            $hasFirestore = $importFirestore -or $importFbFirestore
            Assert-True -name "No Firestore import in $f" -condition (-not $hasFirestore)
        } else {
            Skip-Test -name "No Firestore in $f" -reason "file not found"
        }
    }
}

# ----------------------------------------------------------------
# Summary
# ----------------------------------------------------------------

if ($script:failed -eq 0) {
    $summaryColor = "Green"
} else {
    $summaryColor = "Red"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor $summaryColor
Write-Host "                     TEST SUMMARY                         " -ForegroundColor $summaryColor
Write-Host "==========================================================" -ForegroundColor $summaryColor
Write-Host "  Total:   $($script:total)" -ForegroundColor White
Write-Host "  Passed:  $($script:passed)" -ForegroundColor Green
Write-Host "  Failed:  $($script:failed)" -ForegroundColor $summaryColor
Write-Host "  Skipped: $($script:skipped)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor $summaryColor

if ($script:failed -gt 0) {
    Write-Host ""
    Write-Host "  $($script:failed) test(s) failed. Review output above." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}
