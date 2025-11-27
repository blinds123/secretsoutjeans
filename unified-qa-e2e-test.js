const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://secrets-out-jeans-2024.netlify.app';
const OUTPUT_FOLDER = '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans';
const SCREENSHOTS_DIR = path.join(OUTPUT_FOLDER, 'output/tests/screenshots');

// Ensure screenshot directory exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = {
  page_load: { success: false, errors: [], time_ms: 0 },
  mobile: { horizontal_scroll: false, viewport_ok: false, errors: [] },
  size_selection: { success: false, errors: [] },
  checkout_flow: {
    popup_appeared: false,
    redirect_worked: false,
    redirect_url: '',
    cors_error: false,
    errors: []
  },
  preorder_flow: {
    popup_appeared: false,
    order_bump_accepted: false,
    redirect_worked: false,
    redirect_url: '',
    errors: []
  },
  visual: { broken_images: [], urgency_elements: {}, trust_badges: false },
  screenshots: [],
  overall_status: 'PENDING'
};

async function runTests() {
  console.log('=== SECRETS OUT JEANS E2E TESTING ===\n');
  console.log('Site:', SITE_URL);
  console.log('Screenshots:', SCREENSHOTS_DIR);
  console.log('');

  const browser = await chromium.launch({ headless: true });

  try {
    // TEST 1: Page Load
    console.log('--- TEST 1: PAGE LOAD ---');
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const startTime = Date.now();
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    results.page_load.time_ms = Date.now() - startTime;
    results.page_load.success = true;
    results.page_load.errors = consoleErrors;
    console.log(`  ✓ Page loaded in ${results.page_load.time_ms}ms`);
    console.log(`  Console errors: ${consoleErrors.length}`);

    // Full page screenshot
    const fullPagePath = path.join(SCREENSHOTS_DIR, 'desktop-full-page.png');
    await page.screenshot({ path: fullPagePath, fullPage: true });
    results.screenshots.push(fullPagePath);
    console.log('  ✓ Desktop screenshot saved');

    // Check broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    results.visual.broken_images = brokenImages;
    console.log(`  Broken images: ${brokenImages.length}`);

    // Check urgency elements
    const hasLiveViewers = await page.$('.live-activity, #viewerCount') !== null;
    const hasStockWarning = await page.$('.stock-warning, #stockCount') !== null;
    results.visual.urgency_elements = { live_viewers: hasLiveViewers, stock_warning: hasStockWarning };
    console.log(`  Live viewers: ${hasLiveViewers ? '✓' : '✗'}`);
    console.log(`  Stock warning: ${hasStockWarning ? '✓' : '✗'}`);

    await context.close();

    // TEST 2: Mobile Responsiveness
    console.log('\n--- TEST 2: MOBILE RESPONSIVENESS ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const hasHorizontalScroll = await mobilePage.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    results.mobile.horizontal_scroll = hasHorizontalScroll;
    results.mobile.viewport_ok = !hasHorizontalScroll;
    console.log(`  Horizontal scroll: ${hasHorizontalScroll ? '✗ FOUND' : '✓ None'}`);

    const mobilePath = path.join(SCREENSHOTS_DIR, 'mobile-full-page.png');
    await mobilePage.screenshot({ path: mobilePath, fullPage: true });
    results.screenshots.push(mobilePath);
    console.log('  ✓ Mobile screenshot saved');

    await mobileContext.close();

    // TEST 3 & 4: Size Selection & Checkout Flow
    console.log('\n--- TEST 3 & 4: SIZE SELECTION & CHECKOUT ---');
    const checkoutContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const checkoutPage = await checkoutContext.newPage();

    // Listen for CORS errors
    checkoutPage.on('requestfailed', request => {
      const failure = request.failure();
      if (failure && failure.errorText.toLowerCase().includes('cors')) {
        results.checkout_flow.cors_error = true;
        results.checkout_flow.errors.push('CORS: ' + failure.errorText);
      }
    });

    await checkoutPage.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Scroll to size selector
    await checkoutPage.evaluate(() => window.scrollBy(0, 500));
    await checkoutPage.waitForTimeout(500);

    // Click on size M
    const sizeButton = await checkoutPage.$('button.size-btn:not(:disabled)');
    if (sizeButton) {
      await sizeButton.click();
      results.size_selection.success = true;
      console.log('  ✓ Size selected');

      const sizeSelectedPath = path.join(SCREENSHOTS_DIR, 'size-selected.png');
      await checkoutPage.screenshot({ path: sizeSelectedPath });
      results.screenshots.push(sizeSelectedPath);
    } else {
      results.size_selection.errors.push('No size button found');
      console.log('  ✗ Size button not found');
    }

    // Scroll back to top and click Ship Today button
    await checkoutPage.evaluate(() => window.scrollTo(0, 0));
    await checkoutPage.waitForTimeout(300);

    // Find and click the $59 button
    const shipTodayBtn = await checkoutPage.$('#primaryCTA, button:has-text("$59"), button:has-text("Ship Today")');
    if (shipTodayBtn) {
      console.log('  Clicking $59 Ship Today button...');
      await shipTodayBtn.click();
      await checkoutPage.waitForTimeout(1000);

      // Check if popup appeared
      const popup = await checkoutPage.$('#orderBumpPopup');
      const popupVisible = popup ? await popup.isVisible() : false;

      if (popupVisible) {
        results.checkout_flow.popup_appeared = true;
        console.log('  ✓ Order bump popup appeared');

        const popupPath = path.join(SCREENSHOTS_DIR, 'checkout-popup.png');
        await checkoutPage.screenshot({ path: popupPath });
        results.screenshots.push(popupPath);

        // Click "No thanks" button
        const declineBtn = await checkoutPage.$('button:has-text("No thanks")');
        if (declineBtn) {
          console.log('  Clicking "No thanks" to proceed to checkout...');

          // Wait for navigation
          const navigationPromise = checkoutPage.waitForNavigation({ timeout: 20000 }).catch(() => null);
          await declineBtn.click();

          await checkoutPage.waitForTimeout(5000);
          const finalUrl = checkoutPage.url();
          results.checkout_flow.redirect_url = finalUrl;

          if (finalUrl.includes('simpleswap.io')) {
            results.checkout_flow.redirect_worked = true;
            console.log('  ✓ REDIRECT SUCCESS to SimpleSwap!');
            console.log('  URL:', finalUrl);

            const simpleswapPath = path.join(SCREENSHOTS_DIR, 'simpleswap-redirect.png');
            await checkoutPage.screenshot({ path: simpleswapPath });
            results.screenshots.push(simpleswapPath);
          } else {
            console.log('  ✗ No redirect - still on:', finalUrl);
            results.checkout_flow.errors.push('No redirect occurred');
          }
        }
      } else {
        results.checkout_flow.errors.push('Popup did not appear');
        console.log('  ✗ Popup did not appear');
      }
    } else {
      results.checkout_flow.errors.push('Ship Today button not found');
      console.log('  ✗ Ship Today button not found');
    }

    await checkoutContext.close();

    // TEST 5: Pre-order flow with order bump
    console.log('\n--- TEST 5: PRE-ORDER WITH ORDER BUMP ---');
    const preorderContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const preorderPage = await preorderContext.newPage();
    await preorderPage.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Select size first
    await preorderPage.evaluate(() => window.scrollBy(0, 500));
    await preorderPage.waitForTimeout(500);
    const sizeBtn2 = await preorderPage.$('button.size-btn:not(:disabled)');
    if (sizeBtn2) await sizeBtn2.click();

    await preorderPage.evaluate(() => window.scrollTo(0, 0));
    await preorderPage.waitForTimeout(300);

    // Click pre-order button
    const preorderBtn = await preorderPage.$('#secondaryCTA, button:has-text("Pre-Order"), button:has-text("$19")');
    if (preorderBtn) {
      console.log('  Clicking $19 Pre-Order button...');
      await preorderBtn.click();
      await preorderPage.waitForTimeout(1000);

      const popup2 = await preorderPage.$('#orderBumpPopup');
      const popup2Visible = popup2 ? await popup2.isVisible() : false;

      if (popup2Visible) {
        results.preorder_flow.popup_appeared = true;
        console.log('  ✓ Order bump popup appeared');

        const preorderPopupPath = path.join(SCREENSHOTS_DIR, 'preorder-popup.png');
        await preorderPage.screenshot({ path: preorderPopupPath });
        results.screenshots.push(preorderPopupPath);

        // Click accept order bump
        const acceptBtn = await preorderPage.$('button:has-text("YES"), button:has-text("Add")');
        if (acceptBtn) {
          console.log('  Clicking to accept order bump ($29)...');
          await acceptBtn.click();

          await preorderPage.waitForTimeout(5000);
          const preorderUrl = preorderPage.url();
          results.preorder_flow.redirect_url = preorderUrl;

          if (preorderUrl.includes('simpleswap.io')) {
            results.preorder_flow.redirect_worked = true;
            results.preorder_flow.order_bump_accepted = true;
            console.log('  ✓ REDIRECT SUCCESS with order bump!');
            console.log('  URL:', preorderUrl);

            const preorderSwapPath = path.join(SCREENSHOTS_DIR, 'preorder-simpleswap.png');
            await preorderPage.screenshot({ path: preorderSwapPath });
            results.screenshots.push(preorderSwapPath);
          } else {
            console.log('  ✗ No redirect');
          }
        }
      }
    }

    await preorderContext.close();

    // TEST 6: Trust elements
    console.log('\n--- TEST 6: TRUST ELEMENTS ---');
    const trustContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const trustPage = await trustContext.newPage();
    await trustPage.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for trust badges
    const hasTrustBadges = await trustPage.$('.trust-badges, .trust-badge') !== null;
    results.visual.trust_badges = hasTrustBadges;
    console.log(`  Trust badges: ${hasTrustBadges ? '✓' : '✗'}`);

    // Wait for purchase toast
    console.log('  Waiting for purchase toast (up to 15s)...');
    try {
      await trustPage.waitForSelector('.purchase-toast.show, #purchaseToast.show', { timeout: 15000 });
      console.log('  ✓ Purchase toast appeared');

      const toastPath = path.join(SCREENSHOTS_DIR, 'purchase-toast.png');
      await trustPage.screenshot({ path: toastPath });
      results.screenshots.push(toastPath);
    } catch {
      console.log('  ⚠ Purchase toast did not appear in 15s');
    }

    await trustContext.close();

  } catch (error) {
    console.error('Test error:', error.message);
    results.overall_status = 'ERROR';
  } finally {
    await browser.close();
  }

  // Determine overall status
  if (results.checkout_flow.cors_error) {
    results.overall_status = 'CORS_FIX_REQUIRED';
  } else if (results.checkout_flow.redirect_worked && results.preorder_flow.redirect_worked) {
    results.overall_status = 'ALL_PASS';
  } else if (results.checkout_flow.redirect_worked || results.preorder_flow.redirect_worked) {
    results.overall_status = 'PARTIAL_PASS';
  } else {
    results.overall_status = 'FIXES_NEEDED';
  }

  console.log('\n=== RESULTS SUMMARY ===');
  console.log('Overall Status:', results.overall_status);
  console.log('Screenshots taken:', results.screenshots.length);
  console.log('Checkout redirect:', results.checkout_flow.redirect_worked ? '✓' : '✗');
  console.log('Pre-order redirect:', results.preorder_flow.redirect_worked ? '✓' : '✗');

  return results;
}

runTests().then(results => {
  const outputPath = path.join(OUTPUT_FOLDER, 'output/agents/unified-qa.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('\nResults saved to:', outputPath);
  process.exit(results.overall_status === 'ALL_PASS' ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
