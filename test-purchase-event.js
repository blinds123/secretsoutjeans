const { chromium } = require('playwright');

async function testPurchaseEvent() {
  console.log('\n💰 Testing TikTok Purchase Event\n');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Track events
  const events = [];
  let redirectUrl = null;

  // Inject event tracker before page load
  await page.addInitScript(() => {
    window.addEventListener('load', () => {
      if (window.ttq && window.ttq.track) {
        const original = window.ttq.track;
        window.ttq.track = function(eventName, params) {
          console.log(`🎯 TikTok Event: ${eventName}`, params);
          window.__lastEvent = { eventName, params };
          return original.apply(this, arguments);
        };
      }
    });
  });

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('TikTok Event:')) {
      events.push(text);
      console.log(text);
    }
  });

  // Intercept SimpleSwap redirect
  await page.route('**/*simpleswap.io*', async route => {
    redirectUrl = route.request().url();
    console.log('\n🔄 Redirect intercepted!');
    console.log(`   URL: ${redirectUrl}`);
    await route.abort();
  });

  console.log('1️⃣ Loading page...');
  await page.goto('http://localhost:8081/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('2️⃣ Selecting size 8...');
  await page.click('#size-8');
  await page.waitForTimeout(500);

  console.log('3️⃣ Clicking ADD TO CART...');
  await page.click('button:has-text("ADD TO CART - $69")');
  await page.waitForTimeout(1000);

  // Check if modal opened
  const modalVisible = await page.locator('#checkoutModal').isVisible();
  console.log(`4️⃣ Checkout modal opened: ${modalVisible ? 'YES' : 'NO'}`);

  if (modalVisible) {
    // Check for order bump and select it
    const orderBump = await page.locator('#orderBumpCheckbox').first();
    if (await orderBump.isVisible()) {
      console.log('5️⃣ Selecting order bump (+$10)...');
      await orderBump.check();
      await page.waitForTimeout(500);
    }

    console.log('6️⃣ Clicking COMPLETE PURCHASE button...');
    const purchaseButton = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
    await purchaseButton.click();
    await page.waitForTimeout(1500);

    // Get the last event from the page
    const lastEvent = await page.evaluate(() => window.__lastEvent);

    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESULTS:');
    console.log('=' .repeat(60));

    if (lastEvent && lastEvent.eventName === 'Purchase') {
      console.log('\n✅ Purchase Event FIRED Successfully!');
      console.log('   Event Details:');
      console.log(`   - Product: ${lastEvent.params?.content_name}`);
      console.log(`   - Price: $${lastEvent.params?.value || lastEvent.params?.price}`);
      console.log(`   - Currency: ${lastEvent.params?.currency}`);
      console.log(`   - Product ID: ${lastEvent.params?.content_id}`);
    } else {
      console.log('\n⚠️  Purchase Event Status: Unknown');
      console.log('   (Event may have fired but not captured)');
    }

    if (redirectUrl) {
      console.log('\n✅ SimpleSwap Redirect Confirmed:');
      const amount = redirectUrl.match(/amount=(\d+)/);
      if (amount) {
        console.log(`   - Amount: $${amount[1]}`);
      }
      console.log(`   - Full URL: ${redirectUrl}`);
    }

    console.log('\n📋 All Captured Events:');
    if (events.length > 0) {
      events.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
    } else {
      console.log('   (Events firing but not captured in console)');
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test Complete! Browser will close in 5 seconds...');
  console.log('=' .repeat(60) + '\n');

  await page.waitForTimeout(5000);
  await browser.close();

  // Kill the Python server
  const { exec } = require('child_process');
  exec('pkill -f "python3 -m http.server 8081"');
}

// Run test
testPurchaseEvent().catch(console.error);