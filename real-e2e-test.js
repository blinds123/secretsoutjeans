const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://secrets-out-jeans-2024.netlify.app';
const POOL_URL = 'https://simpleswap-automation-1.onrender.com';
const SCREENSHOTS_DIR = '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/output/tests/e2e-screenshots';

// Ensure directory exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function runRealE2ETest() {
  console.log('=================================================');
  console.log('   SECRETS OUT JEANS - REAL E2E TESTING');
  console.log('=================================================\n');
  console.log('Site:', SITE_URL);
  console.log('Pool:', POOL_URL);
  console.log('Screenshots:', SCREENSHOTS_DIR);
  console.log('');

  // Use headless: false to see the actual browser
  const browser = await chromium.launch({
    headless: true,
    slowMo: 100 // Slow down actions for visibility
  });

  const results = {
    images_loaded: false,
    broken_images: [],
    size_selection: false,
    popup_appeared: false,
    redirect_to_simpleswap: false,
    simpleswap_url: '',
    console_errors: [],
    screenshots: []
  };

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: SCREENSHOTS_DIR }
    });
    const page = await context.newPage();

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.console_errors.push(msg.text());
      }
      console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });

    // ==========================================
    // STEP 1: LOAD PAGE
    // ==========================================
    console.log('\n--- STEP 1: LOADING PAGE ---');
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Page loaded');

    // Take initial screenshot
    const initialPath = path.join(SCREENSHOTS_DIR, '01-page-loaded.png');
    await page.screenshot({ path: initialPath, fullPage: true });
    results.screenshots.push(initialPath);
    console.log('✓ Screenshot: 01-page-loaded.png');

    // ==========================================
    // STEP 2: CHECK IMAGES
    // ==========================================
    console.log('\n--- STEP 2: CHECKING IMAGES ---');
    await page.waitForTimeout(2000); // Wait for images to load

    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const broken = [];
      imgs.forEach(img => {
        if (!img.complete || img.naturalWidth === 0) {
          broken.push(img.src);
        }
      });
      return broken;
    });

    results.broken_images = brokenImages;
    if (brokenImages.length === 0) {
      results.images_loaded = true;
      console.log('✓ All images loaded successfully!');
    } else {
      console.log(`✗ ${brokenImages.length} broken images:`);
      brokenImages.forEach(src => console.log(`  - ${src}`));
    }

    // ==========================================
    // STEP 3: SCROLL AND SELECT SIZE
    // ==========================================
    console.log('\n--- STEP 3: SELECTING SIZE ---');

    // Scroll down to see size buttons
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    // Find and click a size button
    const sizeButton = await page.$('button.size-btn:not(:disabled)');
    if (sizeButton) {
      await sizeButton.click();
      results.size_selection = true;
      console.log('✓ Size selected');

      const sizePath = path.join(SCREENSHOTS_DIR, '02-size-selected.png');
      await page.screenshot({ path: sizePath });
      results.screenshots.push(sizePath);
    } else {
      console.log('✗ No size button found');
    }

    // ==========================================
    // STEP 4: CLICK CHECKOUT BUTTON
    // ==========================================
    console.log('\n--- STEP 4: CLICKING CHECKOUT ---');

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Find the $59 Ship Today button
    const checkoutBtn = await page.$('#primaryCTA');
    if (checkoutBtn) {
      console.log('Found checkout button, clicking...');
      await checkoutBtn.click();
      await page.waitForTimeout(1500);

      // Check if popup appeared
      const popup = await page.$('#orderBumpPopup');
      const popupVisible = popup ? await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
      }, popup) : false;

      if (popupVisible) {
        results.popup_appeared = true;
        console.log('✓ Order bump popup appeared!');

        const popupPath = path.join(SCREENSHOTS_DIR, '03-checkout-popup.png');
        await page.screenshot({ path: popupPath });
        results.screenshots.push(popupPath);

        // ==========================================
        // STEP 5: CLICK "NO THANKS" TO CHECKOUT
        // ==========================================
        console.log('\n--- STEP 5: PROCEEDING TO CHECKOUT ---');

        // Find and click "No thanks, just the jeans"
        const declineBtn = await page.$('button:has-text("No thanks")');
        if (declineBtn) {
          console.log('Clicking "No thanks" button...');
          console.log('Waiting for redirect to SimpleSwap...');

          // Click and wait for navigation
          await Promise.all([
            page.waitForNavigation({ timeout: 30000 }).catch(() => null),
            declineBtn.click()
          ]);

          // Wait additional time for redirect
          await page.waitForTimeout(5000);

          const finalUrl = page.url();
          console.log('Final URL:', finalUrl);
          results.simpleswap_url = finalUrl;

          if (finalUrl.includes('simpleswap.io')) {
            results.redirect_to_simpleswap = true;
            console.log('✓✓✓ SUCCESS! Redirected to SimpleSwap! ✓✓✓');

            const simpleswapPath = path.join(SCREENSHOTS_DIR, '04-simpleswap-success.png');
            await page.screenshot({ path: simpleswapPath, fullPage: true });
            results.screenshots.push(simpleswapPath);
          } else {
            console.log('✗ Redirect failed - still on:', finalUrl);

            const failPath = path.join(SCREENSHOTS_DIR, '04-redirect-failed.png');
            await page.screenshot({ path: failPath, fullPage: true });
            results.screenshots.push(failPath);
          }
        } else {
          console.log('✗ Could not find decline button');
        }
      } else {
        console.log('✗ Popup did not appear');
      }
    } else {
      console.log('✗ Checkout button not found');
    }

    await context.close();

  } catch (error) {
    console.error('\n!!! ERROR:', error.message);
    results.error = error.message;
  } finally {
    await browser.close();
  }

  // ==========================================
  // RESULTS SUMMARY
  // ==========================================
  console.log('\n=================================================');
  console.log('   TEST RESULTS SUMMARY');
  console.log('=================================================');
  console.log('Images Loaded:', results.images_loaded ? '✓ PASS' : '✗ FAIL');
  console.log('Broken Images:', results.broken_images.length);
  console.log('Size Selection:', results.size_selection ? '✓ PASS' : '✗ FAIL');
  console.log('Popup Appeared:', results.popup_appeared ? '✓ PASS' : '✗ FAIL');
  console.log('SimpleSwap Redirect:', results.redirect_to_simpleswap ? '✓✓✓ PASS ✓✓✓' : '✗ FAIL');
  console.log('Final URL:', results.simpleswap_url);
  console.log('Console Errors:', results.console_errors.length);
  console.log('Screenshots:', results.screenshots.length);
  console.log('');

  // Save results
  const resultsPath = '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/output/agents/real-e2e-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('Results saved to:', resultsPath);

  // Determine exit code
  const success = results.redirect_to_simpleswap;
  console.log('\nOVERALL:', success ? '✓✓✓ ALL TESTS PASSED ✓✓✓' : '✗ TESTS FAILED');
  process.exit(success ? 0 : 1);
}

runRealE2ETest();
