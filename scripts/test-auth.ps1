Write-Host "=== Phase 1 Auth API Tests ===" -ForegroundColor Cyan
$baseUrl = "http://localhost:3000"
$testEmail = "testuser_$(Get-Random)@example.com"
$testPassword = "SecurePass123!"
$testName = "Test User"

# 1. Health Check
Write-Host "`n[1] Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "  ✅ Health: $($health.status)" -ForegroundColor Green
    Write-Host "  DB: $($health.services.database), Redis: $($health.services.redis)"
} catch {
    Write-Host "  ❌ Health check failed: $_" -ForegroundColor Red
}

# 2. Register
Write-Host "`n[2] Register ($testEmail)..." -ForegroundColor Yellow
try {
    $regBody = @{ email = $testEmail; password = $testPassword; name = $testName } | ConvertTo-Json
    $regResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST -ContentType "application/json" -Body $regBody -SessionVariable authSession
    $regData = $regResponse.Content | ConvertFrom-Json
    Write-Host "  ✅ Registered: $($regData.user.email), ID: $($regData.user.id)" -ForegroundColor Green
    Write-Host "  Token expires in: $($regData.expiresIn)s"
} catch {
    Write-Host "  ❌ Register failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Get Session
Write-Host "`n[3] Get Session..." -ForegroundColor Yellow
try {
    $sesResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/session" -Method GET -WebSession $authSession
    $sesData = $sesResponse.Content | ConvertFrom-Json
    Write-Host "  ✅ Session valid: $($sesData.user.email)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Session check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Refresh Token
Write-Host "`n[4] Refresh Token..." -ForegroundColor Yellow
try {
    $refResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/refresh" -Method POST -WebSession $authSession
    $refData = $refResponse.Content | ConvertFrom-Json
    Write-Host "  ✅ Token refreshed, new expiry: $($refData.expiresIn)s" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Refresh failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Logout
Write-Host "`n[5] Logout..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$baseUrl/api/auth/logout" -Method POST -WebSession $authSession | Out-Null
    Write-Host "  ✅ Logged out" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Logout failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Verify Session Invalidated
Write-Host "`n[6] Verify session invalidated..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$baseUrl/api/auth/session" -Method GET -WebSession $authSession -ErrorAction Stop | Out-Null
    Write-Host "  ❌ Session still valid (should be invalidated)" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode
    if ($status -eq 401 -or $status -eq "Unauthorized") {
        Write-Host "  ✅ Session correctly invalidated (401)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Unexpected status: $status" -ForegroundColor Yellow
    }
}

# 7. Login
Write-Host "`n[7] Login..." -ForegroundColor Yellow
try {
    $loginBody = @{ email = $testEmail; password = $testPassword } | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST -ContentType "application/json" -Body $loginBody -SessionVariable loginSession
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "  ✅ Logged in: $($loginData.user.email)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Duplicate Registration
Write-Host "`n[8] Duplicate registration (should fail)..." -ForegroundColor Yellow
try {
    $dupBody = @{ email = $testEmail; password = "AnotherPass123!"; name = "Dup" } | ConvertTo-Json
    Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST -ContentType "application/json" -Body $dupBody -ErrorAction Stop | Out-Null
    Write-Host "  ❌ Should have rejected duplicate" -ForegroundColor Red
} catch {
    Write-Host "  ✅ Correctly rejected duplicate registration" -ForegroundColor Green
}

# 9. Wrong Password
Write-Host "`n[9] Wrong password (should fail)..." -ForegroundColor Yellow
try {
    $wrongBody = @{ email = $testEmail; password = "WrongPassword!" } | ConvertTo-Json
    Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST -ContentType "application/json" -Body $wrongBody -ErrorAction Stop | Out-Null
    Write-Host "  ❌ Should have rejected wrong password" -ForegroundColor Red
} catch {
    Write-Host "  ✅ Correctly rejected wrong password" -ForegroundColor Green
}

# 10. Validation
Write-Host "`n[10] Validation (short password)..." -ForegroundColor Yellow
try {
    $badBody = @{ email = "a@b.c"; password = "12"; name = "" } | ConvertTo-Json
    Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST -ContentType "application/json" -Body $badBody -ErrorAction Stop | Out-Null
    Write-Host "  ❌ Should have rejected invalid input" -ForegroundColor Red
} catch {
    Write-Host "  ✅ Correctly rejected invalid input" -ForegroundColor Green
}

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan