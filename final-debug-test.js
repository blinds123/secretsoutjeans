const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture ALL console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log('💬', text);
  });

  page.on('pageerror', error => {
    console.error('❌ PAGE ERROR:', error.message);
  });

  console.log('🔍 FINAL DEBUG TEST');
  console.log('='.repeat(60));

  try {
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(2000);

    // Select size
    console.log('\n1️⃣ Selecting size...');
    await page.click('.size-btn');
    await page.waitForTimeout(1000);

    // Wrap handleAddToCart
    await page.evaluate(() => {
      const original = window.handleAddToCart;
      window.handleAddToCart = function(type) {
        console.log('🔴 handleAddToCart CALLED with type:', type);
        console.log('🔴 selectedSize:', window.selectedSize);
        console.log('🔴 currentOrderType:', window.currentOrderType);
        return original.call(this, type);
      };
    });

    console.log('\n2️⃣ Clicking primary CTA button...');

    // Get button details before clicking
    const buttonInfo = await page.evaluate(() => {
      const btn = document.getElementById('primaryCTA');
      return {
        exists: !!btn,
        onclick: btn ? btn.getAttribute('onclick') : null,
        disabled: btn ? btn.disabled : null,
        classList: btn ? Array.from(btn.classList) : []
      };
    });

    console.log('Button info:', JSON.stringify(buttonInfo, null, 2));

    // Click the button
    await page.click('#primaryCTA');
    console.log('✅ Button clicked');

    console.log('\n3️⃣ Waiting for function calls...');
    await page.waitForTimeout(5000);

    // Check what happened
    console.log('\n4️⃣ Checking state...');
    const state = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        selectedSize: window.selectedSize,
        currentOrderType: window.currentOrderType,
        requestInFlight: window.requestInFlight
      };
    });

    console.log('State:', JSON.stringify(state, null, 2));

    // Wait longer for redirect
    console.log('\n5️⃣ Waiting for redirect (10 more seconds)...');
    await page.waitForTimeout(10000);

    const finalUrl = page.url();
    console.log('\n📍 Final URL:', finalUrl);

    console.log('\n='.repeat(60));
    console.log('CONSOLE LOG SUMMARY:');
    console.log('='.repeat(60));
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('handleAddToCart') ||
      log.includes('processOrder') ||
      log.includes('getExchangeFromPool') ||
      log.includes('CHECKOUT') ||
      log.includes('POOL')
    );

    if (relevantLogs.length > 0) {
      relevantLogs.forEach(log => console.log('  📝', log));
    } else {
      console.log('  ⚠️  NO RELEVANT LOGS FOUND');
      console.log('\nAll console logs:');
      consoleLogs.forEach(log => console.log('  ', log));
    }

    console.log('\n='.repeat(60));
    if (finalUrl.includes('simpleswap')) {
      console.log('✅ ✅ ✅ SUCCESS ✅ ✅ ✅');
    } else {
      console.log('❌ ❌ ❌ FAILED ❌ ❌ ❌');
      console.log('Functions were not called or redirect did not happen');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
