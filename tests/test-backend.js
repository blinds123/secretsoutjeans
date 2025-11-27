/**
 * BACKEND API TEST: SimpleSwap Pool Backend
 *
 * Tests the backend API endpoints:
 * 1. Health check
 * 2. Stats endpoint (pool counts)
 * 3. Buy-now endpoint for each price point ($29, $39, $69, $79)
 * 4. Response time measurements
 * 5. Exchange URL validation
 * 6. Pool depletion warnings
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_API = process.env.BACKEND_API || 'https://simpleswap-automation-1.onrender.com';
const TIMEOUT = 30000; // 30 seconds
const PRICE_POINTS = [29, 39, 69, 79];

/**
 * Make HTTP request (supports both http and https)
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: TIMEOUT
    };

    const startTime = Date.now();

    const req = lib.request(requestOptions, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;

        try {
          const json = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json,
            responseTime,
            raw: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test health endpoint
 */
async function testHealth() {
  console.log('TEST 1: Health Check');
  console.log('─────────────────────────────────────');

  try {
    const response = await makeRequest(`${BACKEND_API}/health`);

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response Time: ${response.responseTime}ms`);

    if (response.statusCode === 200) {
      console.log('Body:', JSON.stringify(response.body, null, 2));
      console.log('✅ Health check passed\n');
      return { passed: true, responseTime: response.responseTime };
    } else {
      console.log('❌ Health check failed - unexpected status code\n');
      return { passed: false, responseTime: response.responseTime };
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message, '\n');
    return { passed: false, responseTime: null };
  }
}

/**
 * Test stats endpoint
 */
async function testStats() {
  console.log('TEST 2: Stats Endpoint (Pool Counts)');
  console.log('─────────────────────────────────────');

  try {
    const response = await makeRequest(`${BACKEND_API}/stats`);

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response Time: ${response.responseTime}ms`);

    if (response.statusCode === 200 && response.body) {
      console.log('Pool Statistics:');
      console.log(JSON.stringify(response.body, null, 2));

      // Check pool counts
      const pools = response.body.pools || response.body;
      let warnings = [];

      for (const [price, count] of Object.entries(pools)) {
        console.log(`  💰 $${price}: ${count} exchanges available`);

        if (count < 5) {
          warnings.push(`⚠️  WARNING: Pool $${price} is running low (${count} remaining)`);
        }
        if (count === 0) {
          warnings.push(`🚨 CRITICAL: Pool $${price} is EMPTY!`);
        }
      }

      if (warnings.length > 0) {
        console.log('\n⚠️  POOL WARNINGS:');
        warnings.forEach(w => console.log(w));
      }

      console.log('✅ Stats check passed\n');
      return { passed: true, responseTime: response.responseTime, pools };
    } else {
      console.log('❌ Stats check failed\n');
      return { passed: false, responseTime: response.responseTime };
    }
  } catch (error) {
    console.error('❌ Stats check error:', error.message, '\n');
    return { passed: false, responseTime: null };
  }
}

/**
 * Test buy-now endpoint for a specific price
 */
async function testBuyNow(price) {
  console.log(`TEST: Buy-Now Endpoint ($${price})`);
  console.log('─────────────────────────────────────');

  try {
    const response = await makeRequest(`${BACKEND_API}/buy-now?amount=${price}`);

    console.log(`Status: ${response.statusCode}`);
    console.log(`Response Time: ${response.responseTime}ms`);

    if (response.statusCode === 200 && response.body) {
      const { id, url } = response.body;

      console.log(`Exchange ID: ${id || 'N/A'}`);
      console.log(`Exchange URL: ${url || 'N/A'}`);

      // Validate exchange URL
      if (url && url.includes('simpleswap.io')) {
        console.log('✅ Valid SimpleSwap URL received');

        // Check if URL contains exchange ID
        if (url.includes('/exchange/') || url.includes('?id=')) {
          console.log('✅ Exchange ID present in URL');
          console.log(`✅ Buy-now test passed for $${price}\n`);
          return { passed: true, responseTime: response.responseTime, url, id };
        } else {
          console.log('⚠️  Exchange ID not found in URL');
          console.log(`✅ Buy-now test passed for $${price} (with warning)\n`);
          return { passed: true, responseTime: response.responseTime, url, id };
        }
      } else {
        console.log('❌ Invalid or missing exchange URL\n');
        return { passed: false, responseTime: response.responseTime };
      }
    } else if (response.statusCode === 503) {
      console.log(`⚠️  Pool depleted for $${price} (503 Service Unavailable)\n`);
      return { passed: false, responseTime: response.responseTime, depleted: true };
    } else {
      console.log(`❌ Buy-now test failed for $${price}\n`);
      return { passed: false, responseTime: response.responseTime };
    }
  } catch (error) {
    console.error(`❌ Buy-now test error for $${price}:`, error.message, '\n');
    return { passed: false, responseTime: null };
  }
}

/**
 * Main test runner
 */
async function runBackendTests() {
  console.log('🧪 BACKEND API TEST: SimpleSwap Pool Backend\n');
  console.log(`Testing backend: ${BACKEND_API}\n`);
  console.log('═══════════════════════════════════════\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    responseTimes: []
  };

  // Test 1: Health Check
  const healthResult = await testHealth();
  if (healthResult.passed) results.passed++;
  else results.failed++;
  if (healthResult.responseTime) results.responseTimes.push(healthResult.responseTime);

  // Test 2: Stats
  const statsResult = await testStats();
  if (statsResult.passed) results.passed++;
  else results.failed++;
  if (statsResult.responseTime) results.responseTimes.push(statsResult.responseTime);

  // Test 3-6: Buy-now for each price point
  console.log('═══════════════════════════════════════');
  console.log('TESTING BUY-NOW ENDPOINTS');
  console.log('═══════════════════════════════════════\n');

  for (const price of PRICE_POINTS) {
    const buyResult = await testBuyNow(price);
    if (buyResult.passed) results.passed++;
    else {
      results.failed++;
      if (buyResult.depleted) results.warnings++;
    }
    if (buyResult.responseTime) results.responseTimes.push(buyResult.responseTime);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate average response time
  const avgResponseTime = results.responseTimes.length > 0
    ? Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length)
    : 0;

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('BACKEND TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings} (depleted pools)`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  console.log(`⚡ Avg Response Time: ${avgResponseTime}ms`);
  console.log(`🎯 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  // Performance warnings
  if (avgResponseTime > 3000) {
    console.log('⚠️  WARNING: Average response time exceeds 3 seconds');
  }
  if (avgResponseTime > 5000) {
    console.log('🚨 CRITICAL: Average response time exceeds 5 seconds');
  }

  // Exit with appropriate code
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run the tests
runBackendTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
