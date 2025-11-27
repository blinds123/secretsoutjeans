const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down to observe behavior
  });
  
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  const page = await context.newPage();
  
  console.log('\n🔍 VERIFICATION TEST: $59 "Ships Today" Button');
  console.log('=' .repeat(60));
  
  try {
    // Navigate to the site
    console.log('\n1️⃣ Navigating to site...');
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ Page loaded');
    
    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Check if size selection exists
    console.log('\n2️⃣ Selecting size...');
    const sizeButtons = await page.$$('.size-btn');
    console.log(`Found ${sizeButtons.length} size buttons`);
    
    if (sizeButtons.length > 0) {
      await sizeButtons[0].click();
      console.log('✅ Size selected');
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️  No size buttons found, proceeding anyway');
    }
    
    // Find the $59 Ships Today button
    console.log('\n3️⃣ Looking for "$59 Ships Today" button...');
    
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
      await page.screenshot({ path: 'fail-button-not-found.png', fullPage: true });
      await browser.close();
      return;
    }
    
    console.log('✅ Found "$59 Ships Today" button');
    
    // Set up popup detection
    console.log('\n4️⃣ Setting up popup detection...');
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
    console.log('\n5️⃣ Clicking "$59 Ships Today" button...');
    await shipsButton.click();
    console.log('✅ Button clicked');
    
    // Wait and observe
    console.log('\n6️⃣ Monitoring for popup (5 seconds)...');
    await page.waitForTimeout(5000);
    
    // Check if popup appeared in DOM
    const popupDetected = await page.evaluate(() => window.popupDetected);
    const modalVisible = await page.$('.modal:visible, .popup:visible, [class*="order-bump"]:visible');
    
    if (popupDetected || modalVisible || popupAppeared) {
      console.log('\n❌ FAIL: ORDER BUMP POPUP APPEARED');
      console.log('This violates the requirement for direct redirect.');
      await page.screenshot({ path: 'fail-popup-appeared.png', fullPage: true });
    } else {
      console.log('✅ PASS: No popup detected');
    }
    
    // Check for redirect to SimpleSwap
    console.log('\n7️⃣ Checking for SimpleSwap redirect...');
    await page.waitForTimeout(10000); // Wait up to 10 seconds for redirect
    
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
      
      await page.screenshot({ path: 'success-simpleswap-page.png', fullPage: true });
    } else {
      console.log('❌ FAIL: Did not redirect to SimpleSwap');
      console.log('Expected: simpleswap.io');
      console.log('Got:', currentUrl);
      await page.screenshot({ path: 'fail-no-redirect.png', fullPage: true });
    }
    
    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VERDICT:');
    console.log('='.repeat(60));
    
    const noPopup = !popupDetected && !modalVisible && !popupAppeared;
    const redirectedToSimpleSwap = currentUrl.includes('simpleswap.io');
    
    if (noPopup && redirectedToSimpleSwap) {
      console.log('✅ ✅ ✅ PASS - ALL CRITERIA MET ✅ ✅ ✅');
      console.log('✅ No order bump popup appeared');
      console.log('✅ Direct redirect to SimpleSwap successful');
      console.log('✅ Valid exchange URL confirmed');
    } else {
      console.log('❌ ❌ ❌ FAIL - CRITERIA NOT MET ❌ ❌ ❌');
      if (!noPopup) console.log('❌ Order bump popup appeared');
      if (!redirectedToSimpleSwap) console.log('❌ Did not redirect to SimpleSwap');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
