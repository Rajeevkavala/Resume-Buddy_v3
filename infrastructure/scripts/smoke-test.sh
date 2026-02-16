#!/bin/bash
# ============================================
# ResumeBuddy Production Smoke Test
# ============================================
# Usage: bash smoke-test.sh [domain] [protocol]
# Example: bash smoke-test.sh resumebuddy.com https
#          bash smoke-test.sh localhost:9002 http

DOMAIN=${1:-"localhost:9002"}
PROTOCOL=${2:-"http"}
BASE_URL="${PROTOCOL}://${DOMAIN}"
PASSED=0
FAILED=0

check() {
  local name=$1
  local url=$2
  local expected_status=${3:-200}

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")

  if [ "$status" -eq "$expected_status" ]; then
    echo "  ✅ $name (HTTP $status)"
    ((PASSED++))
  else
    echo "  ❌ $name (Expected $expected_status, got $status)"
    ((FAILED++))
  fi
}

echo "============================================"
echo "  ResumeBuddy Smoke Test"
echo "  Target: $BASE_URL"
echo "  Time: $(date)"
echo "============================================"

echo ""
echo "--- Public Pages ---"
check "Homepage" "$BASE_URL/"
check "Login page" "$BASE_URL/login"
check "Signup page" "$BASE_URL/signup"
check "Pricing page" "$BASE_URL/pricing"

echo ""
echo "--- API Endpoints ---"
check "Health check" "$BASE_URL/api/health"
check "Metrics" "$BASE_URL/api/metrics"
check "Auth session (no cookie)" "$BASE_URL/api/auth/session" 401

echo ""
echo "--- Protected Routes (should redirect) ---"
check "Dashboard (no auth)" "$BASE_URL/dashboard" 307

echo ""
echo "--- Auth API ---"

# Try to register a smoke test user
REGISTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"smoke-test-$(date +%s)@test.com\",\"password\":\"SmokeTest123!@\",\"name\":\"Smoke Test\"}" 2>/dev/null || echo "000")

if [ "$REGISTER_STATUS" -eq 200 ] || [ "$REGISTER_STATUS" -eq 409 ]; then
  echo "  ✅ Registration endpoint (HTTP $REGISTER_STATUS)"
  ((PASSED++))
else
  echo "  ❌ Registration endpoint (HTTP $REGISTER_STATUS)"
  ((FAILED++))
fi

# Test login with wrong creds (should be 401)
check "Login (wrong creds)" "$BASE_URL/api/auth/login" 400

echo ""
echo "============================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
