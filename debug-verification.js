const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture ALL console messages including errors
  page.on('console', msg => {
    const msgType = msg.type();
    console.log(`[${msgType.toUpperCase()}]`, msg.text());
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.error('❌ PAGE ERROR:', error.message);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.error('❌ REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('🔍 DEBUG VERIFICATION');
  console.log('='.repeat(60));

  try {
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(2000);

    // Select size
    await page.click('.size-btn');
    await page.waitForTimeout(1000);

    // Inject debug code to monitor button click
    await page.evaluate(() => {
      console.log('=== INJECTING DEBUG CODE ===');

      // Check if functions exist
      console.log('handleAddToCart exists:', typeof handleAddToCart);
      console.log('processOrder exists:', typeof processOrder);
      console.log('getExchangeFromPool exists:', typeof getExchangeFromPool);
      console.log('SIMPLESWAP_POOL_API:', SIMPLESWAP_POOL_API);

      // Wrap processOrder to log
      const originalProcessOrder = window.processOrder;
      window.processOrder = async function(...args) {
        console.log('🔵 processOrder called with:', args);
        try {
          const result = await originalProcessOrder.apply(this, args);
          console.log('🔵 processOrder completed');
          return result;
        } catch (e) {
          console.error('🔴 processOrder error:', e);
          throw e;
        }
      };

      // Wrap getExchangeFromPool to log
      const originalGetExchange = window.getExchangeFromPool;
      window.getExchangeFromPool = async function(...args) {
        console.log('🔵 getExchangeFromPool called with:', args);
        try {
          const result = await originalGetExchange.apply(this, args);
          console.log('🔵 getExchangeFromPool completed');
          return result;
        } catch (e) {
          console.error('🔴 getExchangeFromPool error:', e);
          throw e;
        }
      };

      // Wrap fetch to log
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        console.log('🌐 FETCH called:', args[0]);
        try {
          const result = await originalFetch.apply(this, args);
          console.log('🌐 FETCH response:', result.status);
          return result;
        } catch (e) {
          console.error('🔴 FETCH error:', e);
          throw e;
        }
      };
    });

    console.log('\n🖱️  Clicking primary CTA...');
    await page.click('#primaryCTA');

    console.log('\n⏳ Waiting 15 seconds to observe...');
    await page.waitForTimeout(15000);

    const finalUrl = page.url();
    console.log('\n📍 Final URL:', finalUrl);

    if (finalUrl.includes('simpleswap')) {
      console.log('✅ SUCCESS');
    } else {
      console.log('❌ FAILED - No redirect');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
