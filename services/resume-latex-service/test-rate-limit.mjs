/**
 * Rate Limit Test Script for LaTeX Service
 * 
 * Tests the rate limiting functionality by sending multiple requests
 * and verifying that requests are blocked after exceeding the limit.
 * 
 * Usage: node test-rate-limit.mjs [baseUrl]
 * 
 * Default: http://localhost:8080
 */

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const ENDPOINT = `${BASE_URL}/v1/resume/latex/compile`;

// Simple test payload
const testPayload = {
  source: 'resumeText',
  templateId: 'faang',
  resumeText: `John Doe
Software Engineer | john@example.com | (555) 123-4567

SUMMARY
Experienced software engineer with 5+ years in web development.

EXPERIENCE
Senior Developer | Tech Corp | 2020-Present
- Built scalable web applications
- Led team of 5 developers

EDUCATION
BS Computer Science | State University | 2018

SKILLS
JavaScript, TypeScript, React, Node.js
`,
  options: {
    engine: 'tectonic',
    return: ['latex', 'pdf'],
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function sendRequest(requestNum) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    
    const duration = Date.now() - startTime;
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const retryAfter = response.headers.get('Retry-After');
    
    if (response.status === 200) {
      const data = await response.json();
      const cached = data.cached ? ' (cached)' : '';
      log('✅', `Request #${requestNum}: SUCCESS${cached} | Status: 200 | Remaining: ${remaining} | ${duration}ms`, colors.green);
      return { success: true, status: 200, remaining, duration };
    } else if (response.status === 429) {
      const data = await response.json();
      log('🚫', `Request #${requestNum}: RATE LIMITED | Status: 429 | Retry After: ${retryAfter}s | ${duration}ms`, colors.red);
      return { success: false, status: 429, retryAfter, duration };
    } else {
      const data = await response.json();
      log('⚠️ ', `Request #${requestNum}: ERROR | Status: ${response.status} | ${data.message} | ${duration}ms`, colors.yellow);
      return { success: false, status: response.status, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log('❌', `Request #${requestNum}: FAILED | ${error.message} | ${duration}ms`, colors.red);
    return { success: false, error: error.message, duration };
  }
}

async function testRateLimit() {
  console.log('\n' + '='.repeat(60));
  log('🧪', 'RATE LIMIT TEST', colors.cyan);
  console.log('='.repeat(60));
  log('📍', `Endpoint: ${ENDPOINT}`, colors.dim);
  log('📊', 'Expected: 10 requests/minute limit', colors.dim);
  console.log('='.repeat(60) + '\n');

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/healthz`);
    if (!healthCheck.ok) {
      throw new Error('Health check failed');
    }
    log('✅', 'Server is running\n', colors.green);
  } catch (error) {
    log('❌', `Server not reachable at ${BASE_URL}`, colors.red);
    log('💡', 'Make sure the LaTeX service is running:', colors.yellow);
    console.log('   docker run --rm -p 8080:8080 resume-latex-service\n');
    process.exit(1);
  }

  // Get initial metrics
  try {
    const metricsRes = await fetch(`${BASE_URL}/metrics`);
    const metrics = await metricsRes.json();
    log('📈', `Initial Rate Limit Stats: ${JSON.stringify(metrics.rateLimit)}`, colors.dim);
  } catch (e) {
    // Ignore if metrics not available
  }

  const results = {
    successful: 0,
    rateLimited: 0,
    errors: 0,
    totalDuration: 0,
  };

  // Send 15 requests to exceed the 10 request limit
  const totalRequests = 15;
  log('🚀', `Sending ${totalRequests} requests sequentially...\n`, colors.cyan);

  for (let i = 1; i <= totalRequests; i++) {
    const result = await sendRequest(i);
    results.totalDuration += result.duration || 0;
    
    if (result.status === 200) {
      results.successful++;
    } else if (result.status === 429) {
      results.rateLimited++;
    } else {
      results.errors++;
    }
    
    // Small delay between requests to avoid overwhelming
    if (i < totalRequests) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('📊', 'TEST SUMMARY', colors.cyan);
  console.log('='.repeat(60));
  log('✅', `Successful: ${results.successful}`, colors.green);
  log('🚫', `Rate Limited: ${results.rateLimited}`, colors.red);
  log('⚠️ ', `Errors: ${results.errors}`, colors.yellow);
  log('⏱️ ', `Total Duration: ${results.totalDuration}ms`, colors.dim);
  log('📊', `Avg Duration: ${Math.round(results.totalDuration / totalRequests)}ms`, colors.dim);
  console.log('='.repeat(60));

  // Validate results
  if (results.rateLimited >= 5) {
    log('✅', 'RATE LIMITING IS WORKING! Requests after limit were blocked.', colors.green);
  } else if (results.rateLimited > 0) {
    log('⚠️ ', 'Rate limiting is partially working.', colors.yellow);
  } else {
    log('❌', 'RATE LIMITING NOT WORKING! All requests succeeded.', colors.red);
  }

  // Get final metrics
  try {
    const metricsRes = await fetch(`${BASE_URL}/metrics`);
    const metrics = await metricsRes.json();
    console.log('\n' + '='.repeat(60));
    log('📈', 'FINAL SERVER METRICS', colors.cyan);
    console.log('='.repeat(60));
    console.log(JSON.stringify(metrics, null, 2));
  } catch (e) {
    // Ignore
  }

  console.log('\n');
}

// Test parallel requests
async function testParallelRequests() {
  console.log('\n' + '='.repeat(60));
  log('🧪', 'PARALLEL REQUESTS TEST', colors.cyan);
  console.log('='.repeat(60));
  log('📊', 'Sending 5 requests in parallel...', colors.dim);
  console.log('='.repeat(60) + '\n');

  const promises = [];
  for (let i = 1; i <= 5; i++) {
    promises.push(sendRequest(i));
  }

  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.status === 200).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log('\n' + '='.repeat(60));
  log('📊', `Parallel Results: ${successful} succeeded, ${rateLimited} rate limited`, colors.cyan);
  console.log('='.repeat(60) + '\n');
}

// Main
async function main() {
  await testRateLimit();
  
  // Wait for rate limit to reset (60 seconds) before parallel test
  log('⏳', 'Wait 60 seconds for rate limit reset to test parallel requests...', colors.yellow);
  log('💡', 'Or press Ctrl+C to exit.\n', colors.dim);
  
  await new Promise(r => setTimeout(r, 65000));
  await testParallelRequests();
}

main().catch(console.error);
