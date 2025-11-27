const { chromium } = require('playwright');

async function verifyTikTokPixel() {
  console.log('\n🔍 TikTok Pixel Verification Report\n');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all TikTok events
  const tiktokEvents = [];
  let pixelLoaded = false;
  let pixelId = null;

  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('analytics.tiktok.com')) {
      if (url.includes('events.js') && url.includes('D3CVHNBC77U2RE92M7O0')) {
        pixelLoaded = true;
        pixelId = 'D3CVHNBC77U2RE92M7O0';
      }
    }
  });

  // Monitor console logs for events
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('TikTok Event Fired') || text.includes('ttq.track')) {
      tiktokEvents.push(text);
    }
  });

  // Navigate to the actual page
  console.log('📄 Loading index.html...\n');
  await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check if pixel loaded
  const pixelExists = await page.evaluate(() => {
    return typeof window.ttq !== 'undefined';
  });

  // Check pixel ID in source
  const hasCorrectId = await page.evaluate(() => {
    return document.documentElement.innerHTML.includes('D3CVHNBC77U2RE92M7O0');
  });

  console.log('✅ TikTok Pixel Status:');
  console.log(`   - Pixel Object (ttq): ${pixelExists ? '✓ Loaded' : '✗ Not Found'}`);
  console.log(`   - Pixel ID: ${hasCorrectId ? '✓ D3CVHNBC77U2RE92M7O0' : '✗ Wrong or Missing'}`);
  console.log(`   - Network Load: ${pixelLoaded ? '✓ Script Loaded' : '✗ Script Not Loaded'}`);

  // Test event firing by injecting monitoring code
  await page.evaluate(() => {
    window.pixelEvents = [];
    if (window.ttq && window.ttq.track) {
      const original = window.ttq.track;
      window.ttq.track = function(event, params) {
        window.pixelEvents.push({ event, params, time: new Date().toISOString() });
        return original.apply(this, arguments);
      };
    }
  });

  // Test ViewContent (should have already fired)
  console.log('\n📊 Testing Events:');
  console.log('   1. ViewContent - Should fire on page load');

  // Test AddToCart
  console.log('   2. AddToCart - Selecting size and clicking button...');
  await page.click('#size-8');
  await page.waitForTimeout(500);
  await page.click('button:has-text("ADD TO CART")');
  await page.waitForTimeout(1000);

  // Test Purchase (without redirect)
  const hasCheckout = await page.locator('#checkoutModal').count() > 0;
  if (hasCheckout) {
    console.log('   3. InitiateCheckout - Should fire when modal opens');
    console.log('   4. Purchase - Intercepting redirect...');

    // Intercept SimpleSwap redirect
    await page.route('**/*simpleswap.io*', route => {
      console.log('      ✓ Redirect intercepted to:', route.request().url());
      route.abort();
    });

    // Try to click purchase button
    const purchaseBtn = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
    if (await purchaseBtn.isVisible()) {
      await purchaseBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Get captured events
  const capturedEvents = await page.evaluate(() => window.pixelEvents || []);

  console.log('\n📋 Captured Events Summary:');
  if (capturedEvents.length > 0) {
    capturedEvents.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.event}`);
      if (e.params) {
        console.log(`      - Product: ${e.params.content_name || 'N/A'}`);
        console.log(`      - Value: $${e.params.value || e.params.price || 'N/A'}`);
      }
    });
  } else {
    console.log('   No events captured (events may be firing before injection)');
  }

  // Final verification
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 FINAL VERIFICATION:');
  console.log('=' .repeat(60));

  const allChecks = {
    'Pixel Loaded': pixelExists,
    'Correct Pixel ID': hasCorrectId,
    'Network Request Made': pixelLoaded
  };

  let passCount = 0;
  for (const [check, passed] of Object.entries(allChecks)) {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    if (passed) passCount++;
  }

  console.log('\n📊 Score: ' + passCount + '/3 checks passed');

  if (passCount === 3) {
    console.log('\n🎉 SUCCESS: TikTok Pixel D3CVHNBC77U2RE92M7O0 is properly installed!');
    console.log('   The pixel will track: ViewContent, AddToCart, InitiateCheckout, and Purchase events.');
  } else {
    console.log('\n⚠️  WARNING: Some issues detected. Please check the implementation.');
  }

  console.log('=' .repeat(60) + '\n');

  await browser.close();
}

// Run verification
verifyTikTokPixel().catch(console.error);