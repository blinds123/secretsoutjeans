const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://secrets-out-jeans-2024.netlify.app';
const OUTPUT_FOLDER = '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans';

/**
 * DEBUG TEST: Deep dive into why redirects are failing
 *
 * This test will:
 * 1. Capture all network requests
 * 2. Log all console messages (including debug logs)
 * 3. Monitor for failed requests
 * 4. Check for JavaScript errors
 * 5. Verify API responses
 * 6. Track navigation attempts
 */

async function debugRedirectIssue() {
  console.log('=== DEBUG: REDIRECT FAILURE INVESTIGATION ===\n');

  const browser = await chromium.launch({ headless: false }); // Run in headed mode to see what happens
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const networkLog = [];
  const consoleLog = [];
  const errors = [];

  // Capture ALL network requests
  page.on('request', request => {
    networkLog.push({
      type: 'request',
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });

    if (request.url().includes('simpleswap') || request.url().includes('buy-now')) {
      console.log('🌐 [NETWORK] Request:', request.method(), request.url());
    }
  });

  // Capture ALL responses
  page.on('response', response => {
    if (response.url().includes('simpleswap') || response.url().includes('buy-now')) {
      console.log('📥 [NETWORK] Response:', response.status(), response.url());

      // Try to get response body
      response.json().then(json => {
        console.log('📦 [NETWORK] Response body:', JSON.stringify(json, null, 2));
        networkLog.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          body: json
        });
      }).catch(() => {
        response.text().then(text => {
          console.log('📦 [NETWORK] Response text:', text.substring(0, 200));
        }).catch(() => {});
      });
    }
  });

  // Capture ALL console messages (including our debug logs)
  page.on('console', msg => {
    const text = msg.text();
    consoleLog.push({ type: msg.type(), text });

    // Log important messages
    if (text.includes('[DEBUG]') || text.includes('[ERROR]') || text.includes('SimpleSwap') || text.includes('redirect')) {
      console.log(`💬 [CONSOLE ${msg.type()}]`, text);
    }
  });

  // Capture JavaScript errors
  page.on('pageerror', error => {
    console.log('❌ [JS ERROR]', error.message);
    errors.push({ type: 'pageerror', message: error.message, stack: error.stack });
  });

  // Monitor failed requests
  page.on('requestfailed', request => {
    console.log('🚫 [REQUEST FAILED]', request.url(), request.failure()?.errorText);
    errors.push({
      type: 'requestfailed',
      url: request.url(),
      error: request.failure()?.errorText
    });
  });

  // Monitor navigation events
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('🧭 [NAVIGATION]', frame.url());
    }
  });

  console.log('Loading page...\n');
  await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  console.log('\n--- STARTING CHECKOUT FLOW TEST ---\n');

  // Step 1: Select size
  console.log('Step 1: Scrolling to size selector...');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);

  const sizeButton = await page.$('button.size-btn:not(:disabled)');
  if (!sizeButton) {
    console.log('❌ No size button found!');
    await browser.close();
    return;
  }

  console.log('Step 2: Clicking size button...');
  await sizeButton.click();
  await page.waitForTimeout(300);
  console.log('✓ Size selected\n');

  // Step 3: Scroll back and click Ship Today button
  console.log('Step 3: Scrolling to top and finding checkout button...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const shipTodayBtn = await page.$('#primaryCTA, button:has-text("$59"), button:has-text("Ship Today")');
  if (!shipTodayBtn) {
    console.log('❌ Ship Today button not found!');
    await browser.close();
    return;
  }

  console.log('Step 4: Clicking "$59 Ship Today" button...');
  await shipTodayBtn.click();
  await page.waitForTimeout(1000);

  // Step 5: Check if popup appeared
  const popup = await page.$('#orderBumpPopup');
  const popupVisible = popup ? await popup.isVisible() : false;

  if (!popupVisible) {
    console.log('❌ Order bump popup did not appear!');
    await browser.close();
    return;
  }
  console.log('✓ Order bump popup appeared\n');

  // Step 6: Click "No thanks" and monitor everything
  console.log('Step 5: Clicking "No thanks, just the jeans"...');
  console.log('🔍 Monitoring for API call and redirect...\n');

  const declineBtn = await page.$('button:has-text("No thanks")');
  if (!declineBtn) {
    console.log('❌ Decline button not found!');
    await browser.close();
    return;
  }

  // Click and wait
  await declineBtn.click();

  console.log('⏳ Waiting 10 seconds to observe behavior...');
  await page.waitForTimeout(10000);

  const finalUrl = page.url();
  console.log('\n--- FINAL STATE ---');
  console.log('Current URL:', finalUrl);
  console.log('Expected: https://simpleswap.io/exchange?id=...');
  console.log('Redirect worked:', finalUrl.includes('simpleswap.io') ? '✅ YES' : '❌ NO');

  // Save debug data
  const debugData = {
    test_type: 'redirect_debug',
    final_url: finalUrl,
    redirect_success: finalUrl.includes('simpleswap.io'),
    network_log: networkLog.filter(log =>
      log.url?.includes('simpleswap') ||
      log.url?.includes('buy-now') ||
      log.url?.includes('render.com')
    ),
    console_log: consoleLog,
    errors: errors,
    timestamp: new Date().toISOString()
  };

  const debugPath = path.join(OUTPUT_FOLDER, 'output/agents/redirect-debug.json');
  fs.mkdirSync(path.dirname(debugPath), { recursive: true });
  fs.writeFileSync(debugPath, JSON.stringify(debugData, null, 2));

  console.log('\n--- SUMMARY ---');
  console.log('Network requests to API:', networkLog.filter(l => l.url?.includes('buy-now')).length);
  console.log('Console messages:', consoleLog.length);
  console.log('Errors:', errors.length);
  console.log('Debug data saved to:', debugPath);

  // Keep browser open for 5 more seconds to see final state
  console.log('\nKeeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);

  await browser.close();

  return debugData;
}

debugRedirectIssue().then(data => {
  console.log('\n✓ Debug test complete');
  process.exit(data.redirect_success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
