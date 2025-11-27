const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down to observe behavior
  });

  // Create context with cache disabled and CSP bypass
  const context = await browser.newContext({
    bypassCSP: true,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  // Set route to add cache-busting headers
  await context.route('**/*', (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });

  const page = await context.newPage();

  // Enable console logging from page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('\n🔍 FINAL VERIFICATION: $59 "Ships Today" Button');
  console.log('=' .repeat(80));
  
  try {
    // Navigate to the site with cache busting
    const testUrl = `https://secrets-out-jeans-2024.netlify.app/?nocache=${Date.now()}`;
    console.log(`\n1️⃣ Navigating to: ${testUrl}`);
    await page.goto(testUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ Page loaded');

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/1-initial-load.png',
      fullPage: true
    });
    console.log('📸 Screenshot: 1-initial-load.png');

    // Check what version of code is being served
    console.log('\n2️⃣ Checking served code version...');
    const pageContent = await page.content();

    if (pageContent.includes("if (type === 'primary') {")) {
      console.log('✅ CORRECT: New code detected (type === primary check)');
      if (pageContent.includes('processOrder(59)')) {
        console.log('✅ CORRECT: processOrder(59) call found');
      } else {
        console.log('⚠️  WARNING: processOrder(59) call NOT found');
      }
    } else {
      console.log('❌ FAIL: Old code still being served (missing type === primary check)');
    }

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Check if size selection exists
    console.log('\n3️⃣ Selecting size...');
    const sizeButtons = await page.$$('.size-btn');
    console.log(`Found ${sizeButtons.length} size buttons`);

    if (sizeButtons.length > 0) {
      await sizeButtons[0].click();
      console.log('✅ Size selected');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/2-size-selected.png',
        fullPage: true
      });
      console.log('📸 Screenshot: 2-size-selected.png');
    } else {
      console.log('⚠️  No size buttons found, proceeding anyway');
    }

    // Find the $59 Ships Today button
    console.log('\n4️⃣ Looking for "$59 Ships Today" button...');
    
    // Try multiple selectors to find the button
    let shipsButton = null;
    const selectors = [
      'button:has-text("$59")',
      'button:has-text("Ships Today")',
      '.primary-btn:has-text("$59")',
      'button.primary-btn',
      '[onclick*="handlePrimaryOrder"]'
    ];
    
    for (const selector of selectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          const text = await button.textContent();
          console.log(`Found button with selector "${selector}": "${text.trim()}"`);
          if (text.includes('$59') || text.includes('Ships Today')) {
            shipsButton = button;
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!shipsButton) {
      console.log('❌ FAIL: Could not find "$59 Ships Today" button');
      await page.screenshot({
        path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/fail-button-not-found.png',
        fullPage: true
      });
      await browser.close();
      return;
    }

    console.log('✅ Found "$59 Ships Today" button');

    // Take screenshot before clicking
    await page.screenshot({
      path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/3-before-click.png',
      fullPage: true
    });
    console.log('📸 Screenshot: 3-before-click.png');

    // Set up popup detection
    console.log('\n5️⃣ Setting up popup detection...');
    let popupAppeared = false;
    
    page.on('dialog', async (dialog) => {
      console.log('⚠️  ALERT/DIALOG DETECTED:', dialog.message());
      popupAppeared = true;
      await dialog.dismiss();
    });
    
    // Monitor for modal/popup elements
    const popupDetector = page.evaluateHandle(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const text = node.textContent || '';
              if (text.includes('Special Offer') || 
                  text.includes('Order Bump') || 
                  text.includes('Add to Order') ||
                  text.includes('exclusive offer')) {
                window.popupDetected = true;
              }
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.popupDetected = false;
    });
    
    // Listen for navigation
    let redirectUrl = null;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        redirectUrl = frame.url();
        console.log('🔄 Navigation detected:', redirectUrl);
      }
    });
    
    // Click the button
    console.log('\n6️⃣ Clicking "$59 Ships Today" button...');
    const clickTime = Date.now();
    await shipsButton.click();
    console.log('✅ Button clicked');

    // Wait and observe for popup
    console.log('\n7️⃣ Monitoring for popup (3 seconds)...');
    await page.waitForTimeout(3000);

    // Check if popup appeared in DOM
    const popupDetected = await page.evaluate(() => window.popupDetected);
    const modalVisible = await page.$('.modal:visible, .popup:visible, [class*="order-bump"]:visible');

    if (popupDetected || modalVisible || popupAppeared) {
      console.log('\n❌ FAIL: ORDER BUMP POPUP APPEARED');
      console.log('This violates the requirement for direct redirect.');
      await page.screenshot({
        path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/fail-popup-appeared.png',
        fullPage: true
      });
    } else {
      console.log('✅ PASS: No popup detected');
    }

    // Check for redirect to SimpleSwap
    console.log('\n8️⃣ Checking for SimpleSwap redirect...');

    // Wait for navigation to SimpleSwap (up to 15 seconds)
    try {
      await page.waitForURL(/simpleswap\.io/, { timeout: 15000 });
      const timeToRedirect = Date.now() - clickTime;
      console.log(`✅ Redirected in ${timeToRedirect}ms`);
    } catch (error) {
      console.log('⚠️  Navigation timeout - checking current URL');
    }

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('simpleswap.io')) {
      console.log('✅ PASS: Redirected to SimpleSwap');

      // Extract exchange ID
      const urlParams = new URL(currentUrl);
      const exchangeId = urlParams.searchParams.get('id') ||
                        currentUrl.match(/\/exchange\/([a-zA-Z0-9]+)/)?.[1];

      if (exchangeId) {
        console.log('✅ Exchange ID found:', exchangeId);
      } else {
        console.log('⚠️  Warning: Could not extract exchange ID from URL');
      }

      // Wait for SimpleSwap page to load
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/4-simpleswap-page.png',
        fullPage: true
      });
      console.log('📸 Screenshot: 4-simpleswap-page.png');
    } else {
      console.log('❌ FAIL: Did not redirect to SimpleSwap');
      console.log('Expected: simpleswap.io');
      console.log('Got:', currentUrl);
      await page.screenshot({
        path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/fail-no-redirect.png',
        fullPage: true
      });
    }
    
    // Final verdict
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERDICT:');
    console.log('='.repeat(80));

    const noPopup = !popupDetected && !modalVisible && !popupAppeared;
    const redirectedToSimpleSwap = currentUrl.includes('simpleswap.io');
    const hasExchangeId = currentUrl.includes('id=');

    if (noPopup && redirectedToSimpleSwap && hasExchangeId) {
      console.log('✅ ✅ ✅ PASS - ALL CRITERIA MET ✅ ✅ ✅');
      console.log('✅ No order bump popup appeared');
      console.log('✅ Direct redirect to SimpleSwap successful');
      console.log('✅ Valid exchange ID in URL');
      console.log(`\nFinal URL: ${currentUrl}`);
    } else {
      console.log('❌ ❌ ❌ FAIL - CRITERIA NOT MET ❌ ❌ ❌');
      if (!noPopup) console.log('❌ Order bump popup appeared');
      if (!redirectedToSimpleSwap) console.log('❌ Did not redirect to SimpleSwap');
      if (!hasExchangeId) console.log('❌ No exchange ID in URL');
      console.log(`\nCurrent URL: ${currentUrl}`);
    }
    console.log('='.repeat(80));
    console.log('\n📸 Screenshots saved in: /screenshots/');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    console.error(error.stack);
    await page.screenshot({
      path: '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/screenshots/error-screenshot.png',
      fullPage: true
    });
  } finally {
    console.log('\n⏸️  Keeping browser open for 5 seconds for observation...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('✅ Test completed');
  }
})();
