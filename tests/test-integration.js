/**
 * INTEGRATION TEST: Blue Sneaker Landing Page → SimpleSwap Pool Backend
 *
 * Tests the complete integration flow:
 * 1. Landing page loads with SIMPLESWAP_POOL_API configured
 * 2. processOrder function exists and is callable
 * 3. Clicking COMPLETE PURCHASE triggers backend call
 * 4. Backend returns valid exchange URL
 * 5. User is redirected to SimpleSwap with exchange ID
 */

const { chromium } = require('playwright');

// Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:8080';
const BACKEND_API = 'https://simpleswap-automation-1.onrender.com';
const TIMEOUT = 30000; // 30 seconds

async function runIntegrationTest() {
  console.log('🧪 INTEGRATION TEST: Landing Page → Backend → SimpleSwap\n');
  console.log(`Testing site: ${SITE_URL}`);
  console.log(`Backend API: ${BACKEND_API}\n`);

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[POOL]') || text.includes('[ORDER]')) {
        console.log(`📝 Console: ${text}`);
      }
    });

    // Collect network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('simpleswap')) {
        networkRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    // TEST 1: Page loads successfully
    console.log('TEST 1: Loading landing page...');
    try {
      await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
      console.log('✅ Page loaded successfully\n');
      passed++;
    } catch (error) {
      console.error('❌ Page failed to load:', error.message, '\n');
      failed++;
      throw error;
    }

    // TEST 2: Check for SIMPLESWAP_POOL_API in page source
    console.log('TEST 2: Checking for SIMPLESWAP_POOL_API constant...');
    try {
      const hasAPI = await page.evaluate(() => {
        return typeof SIMPLESWAP_POOL_API !== 'undefined' &&
               SIMPLESWAP_POOL_API.includes('simpleswap-automation');
      });

      if (hasAPI) {
        const apiValue = await page.evaluate(() => SIMPLESWAP_POOL_API);
        console.log(`✅ SIMPLESWAP_POOL_API found: ${apiValue}\n`);
        passed++;
      } else {
        console.error('❌ SIMPLESWAP_POOL_API not found or invalid\n');
        failed++;
      }
    } catch (error) {
      console.error('❌ Error checking API constant:', error.message, '\n');
      failed++;
    }

    // TEST 3: Verify processOrder function exists
    console.log('TEST 3: Checking for processOrder function...');
    try {
      const hasProcessOrder = await page.evaluate(() => {
        return typeof processOrder === 'function';
      });

      if (hasProcessOrder) {
        console.log('✅ processOrder function exists\n');
        passed++;
      } else {
        console.error('❌ processOrder function not found\n');
        failed++;
      }
    } catch (error) {
      console.error('❌ Error checking processOrder:', error.message, '\n');
      failed++;
    }

    // TEST 4: Find and verify COMPLETE PURCHASE button
    console.log('TEST 4: Finding COMPLETE PURCHASE button...');
    try {
      const button = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
      const isVisible = await button.isVisible({ timeout: 5000 });

      if (isVisible) {
        const buttonText = await button.textContent();
        console.log(`✅ Button found: "${buttonText}"\n`);
        passed++;
      } else {
        console.error('❌ Button not visible\n');
        failed++;
      }
    } catch (error) {
      console.error('❌ Button not found:', error.message, '\n');
      failed++;
    }

    // TEST 5: Click button and monitor console logs
    console.log('TEST 5: Clicking COMPLETE PURCHASE and monitoring flow...');
    try {
      // Clear previous logs
      consoleLogs.length = 0;

      // Set up navigation promise BEFORE clicking
      const navigationPromise = page.waitForURL(url => url.includes('simpleswap.io'), {
        timeout: 15000
      }).catch(() => null);

      // Click the button
      const button = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
      await button.click();

      console.log('🔄 Button clicked, waiting for backend response...');

      // Wait a moment for logs to appear
      await page.waitForTimeout(2000);

      // Check for expected console logs
      const hasOrderLog = consoleLogs.some(log => log.includes('[ORDER]'));
      const hasPoolLog = consoleLogs.some(log => log.includes('[POOL]'));

      if (hasOrderLog) {
        console.log('✅ [ORDER] log detected');
      } else {
        console.log('⚠️  [ORDER] log not found');
      }

      if (hasPoolLog) {
        console.log('✅ [POOL] log detected');
      } else {
        console.log('⚠️  [POOL] log not found');
      }

      // Wait for navigation to complete
      await navigationPromise;

      console.log('');
      passed++;
    } catch (error) {
      console.error('❌ Error during button click:', error.message, '\n');
      failed++;
    }

    // TEST 6: Verify redirect to SimpleSwap
    console.log('TEST 6: Verifying redirect to SimpleSwap...');
    try {
      const currentURL = page.url();

      if (currentURL.includes('simpleswap.io')) {
        console.log(`✅ Redirected to SimpleSwap: ${currentURL}\n`);
        passed++;

        // TEST 7: Check for exchange ID in URL
        console.log('TEST 7: Checking for exchange ID in URL...');
        const hasExchangeId = currentURL.includes('/exchange/') ||
                              currentURL.match(/id=[a-z0-9-]+/i);

        if (hasExchangeId) {
          // Extract exchange ID
          let exchangeId = null;
          const pathMatch = currentURL.match(/\/exchange\/([a-z0-9-]+)/i);
          const paramMatch = currentURL.match(/id=([a-z0-9-]+)/i);

          if (pathMatch) exchangeId = pathMatch[1];
          else if (paramMatch) exchangeId = paramMatch[1];

          console.log(`✅ Exchange ID found: ${exchangeId}\n`);
          passed++;
        } else {
          console.error('❌ No exchange ID found in URL\n');
          failed++;
        }
      } else {
        console.error(`❌ Not redirected to SimpleSwap. Current URL: ${currentURL}\n`);
        failed++;
      }
    } catch (error) {
      console.error('❌ Error checking redirect:', error.message, '\n');
      failed++;
    }

    // Take final screenshot
    await page.screenshot({
      path: '/Users/nelsonchan/Downloads/Blue Sneaker lander/tests/integration-final.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: tests/integration-final.png\n');

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error.message, '\n');
    failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('INTEGRATION TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run the test
runIntegrationTest().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
