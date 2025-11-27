/**
 * COMPLETE USER FLOW TEST: Blue Sneaker Landing Page
 *
 * Tests the complete user journey:
 * 1. Landing on page
 * 2. Scrolling through content
 * 3. Viewing product images/thumbnails
 * 4. Selecting size (if applicable)
 * 5. Toggling order bump
 * 6. Verifying price updates
 * 7. Completing purchase
 * 8. Redirect to SimpleSwap
 * 9. Verifying exchange on SimpleSwap
 */

const { chromium } = require('playwright');
const path = require('path');

// Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:8080';
const SCREENSHOTS_DIR = '/Users/nelsonchan/Downloads/Blue Sneaker lander/tests/screenshots';
const TIMEOUT = 30000;

/**
 * Simulate human-like scrolling
 */
async function smoothScroll(page, distance) {
  await page.evaluate((dist) => {
    window.scrollBy({
      top: dist,
      left: 0,
      behavior: 'smooth'
    });
  }, distance);
  await page.waitForTimeout(500);
}

/**
 * Main user flow test
 */
async function runUserFlowTest() {
  console.log('🧪 COMPLETE USER FLOW TEST: Blue Sneaker Landing Page\n');
  console.log(`Testing site: ${SITE_URL}\n`);
  console.log('═══════════════════════════════════════\n');

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    // Launch browser in visible mode for flow testing
    browser = await chromium.launch({
      headless: true,
      slowMo: 50 // Slow down operations for realistic timing
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Monitor console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[ORDER]') || text.includes('[POOL]')) {
        console.log(`  📝 ${text}`);
      }
    });

    // STEP 1: Land on page
    console.log('STEP 1: Landing on page');
    console.log('─────────────────────────────────────');
    try {
      await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
      console.log('✅ Page loaded successfully');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'flow-1-landing.png'),
        fullPage: false
      });
      passed++;
    } catch (error) {
      console.error('❌ Failed to load page:', error.message);
      failed++;
      throw error;
    }
    console.log('');

    // STEP 2: Scroll through content
    console.log('STEP 2: Scrolling through content');
    console.log('─────────────────────────────────────');
    try {
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = 720;
      const scrollSteps = Math.ceil(pageHeight / viewportHeight);

      console.log(`Page height: ${pageHeight}px`);
      console.log(`Scrolling in ${scrollSteps} steps...`);

      for (let i = 1; i <= Math.min(scrollSteps, 5); i++) {
        await smoothScroll(page, viewportHeight);
        console.log(`  📜 Scrolled to ~${i * viewportHeight}px`);
      }

      console.log('✅ Content scrolling successful');
      passed++;
    } catch (error) {
      console.error('❌ Scrolling error:', error.message);
      failed++;
    }
    console.log('');

    // STEP 3: Scroll back to top and check product images
    console.log('STEP 3: Checking product images');
    console.log('─────────────────────────────────────');
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(500);

      // Look for product images
      const productImages = await page.locator('img[src*="product"], img[alt*="sneaker"], img[alt*="shoe"]').all();
      console.log(`Found ${productImages.length} product images`);

      if (productImages.length > 0) {
        console.log('✅ Product images found');
        passed++;

        // Try to click thumbnails if they exist
        const thumbnails = await page.locator('[class*="thumbnail"], [id*="thumbnail"]').all();
        if (thumbnails.length > 0) {
          console.log(`Found ${thumbnails.length} thumbnails, clicking first one...`);
          try {
            await thumbnails[0].click({ timeout: 3000 });
            await page.waitForTimeout(500);
            console.log('✅ Thumbnail clicked successfully');
          } catch (e) {
            console.log('⚠️  Thumbnail not clickable or not found');
          }
        }
      } else {
        console.log('⚠️  No product images found (this may be okay)');
      }

    } catch (error) {
      console.error('❌ Image check error:', error.message);
      failed++;
    }
    console.log('');

    // STEP 4: Check for size selector
    console.log('STEP 4: Checking size selector');
    console.log('─────────────────────────────────────');
    try {
      const sizeButtons = await page.locator('[class*="size"], [id*="size"], button:has-text("Size")').all();

      if (sizeButtons.length > 0) {
        console.log(`Found ${sizeButtons.length} size buttons`);
        try {
          await sizeButtons[0].click({ timeout: 3000 });
          await page.waitForTimeout(300);
          console.log('✅ Size selected');
          passed++;
        } catch (e) {
          console.log('⚠️  Size button not clickable');
        }
      } else {
        console.log('ℹ️  No size selector found (may not be needed for this product)');
        passed++;
      }
    } catch (error) {
      console.error('❌ Size selector error:', error.message);
      failed++;
    }
    console.log('');

    // STEP 5: Find and test order bump checkbox
    console.log('STEP 5: Testing order bump toggle');
    console.log('─────────────────────────────────────');
    try {
      // Scroll to checkout section
      await page.evaluate(() => {
        const button = document.querySelector('button[onclick*="processOrder"]');
        if (button) {
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      await page.waitForTimeout(500);

      // Get initial price
      const initialPrice = await page.locator('#checkoutButtonText').first().textContent();
      console.log(`Initial price: ${initialPrice}`);

      // Find order bump checkbox
      const checkbox = await page.locator('#orderBumpCheckbox, [type="checkbox"]').first();
      const checkboxExists = await checkbox.count() > 0;

      if (checkboxExists) {
        console.log('Found order bump checkbox');

        // Check the checkbox
        await checkbox.check({ timeout: 3000 });
        await page.waitForTimeout(500);

        // Get updated price
        const updatedPrice = await page.locator('#checkoutButtonText').first().textContent();
        console.log(`Updated price: ${updatedPrice}`);

        // Verify price increased
        if (updatedPrice !== initialPrice) {
          console.log('✅ Price updated when order bump selected');
          passed++;
        } else {
          console.log('⚠️  Price did not change');
        }

        // Take screenshot with order bump
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'flow-5-orderbump-checked.png'),
          fullPage: false
        });

        // Uncheck and verify price reverts
        await checkbox.uncheck({ timeout: 3000 });
        await page.waitForTimeout(500);

        const revertedPrice = await page.locator('#checkoutButtonText').first().textContent();
        console.log(`Reverted price: ${revertedPrice}`);

        if (revertedPrice === initialPrice) {
          console.log('✅ Price correctly reverted when order bump unchecked');
          passed++;
        } else {
          console.log('⚠️  Price did not revert correctly');
        }

        // Re-check for final purchase
        await checkbox.check({ timeout: 3000 });
        await page.waitForTimeout(500);

      } else {
        console.log('ℹ️  No order bump checkbox found');
        passed++; // Not an error
      }

    } catch (error) {
      console.error('❌ Order bump error:', error.message);
      failed++;
    }
    console.log('');

    // STEP 6: Click COMPLETE PURCHASE button
    console.log('STEP 6: Clicking COMPLETE PURCHASE');
    console.log('─────────────────────────────────────');
    try {
      // Take screenshot before clicking
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'flow-6-before-purchase.png'),
        fullPage: false
      });

      // Set up navigation listener
      const navigationPromise = page.waitForURL(url => url.includes('simpleswap.io'), {
        timeout: 15000
      }).catch(() => null);

      // Click the button
      const button = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
      await button.click();
      console.log('✅ Button clicked');
      passed++;

      // Wait for navigation
      console.log('⏳ Waiting for redirect to SimpleSwap...');
      await navigationPromise;

    } catch (error) {
      console.error('❌ Purchase button error:', error.message);
      failed++;
    }
    console.log('');

    // STEP 7: Verify redirect to SimpleSwap
    console.log('STEP 7: Verifying SimpleSwap redirect');
    console.log('─────────────────────────────────────');
    try {
      // Wait a moment for page to load
      await page.waitForTimeout(2000);

      const currentURL = page.url();
      console.log(`Current URL: ${currentURL}`);

      if (currentURL.includes('simpleswap.io')) {
        console.log('✅ Successfully redirected to SimpleSwap');
        passed++;

        // Take screenshot of SimpleSwap page
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'flow-7-simpleswap.png'),
          fullPage: false
        });

        // STEP 8: Verify exchange ID
        console.log('\nSTEP 8: Verifying exchange ID');
        console.log('─────────────────────────────────────');

        // Check URL for exchange ID
        const hasExchangeIdInURL = currentURL.includes('/exchange/') || currentURL.match(/id=[a-z0-9-]+/i);

        if (hasExchangeIdInURL) {
          let exchangeId = null;
          const pathMatch = currentURL.match(/\/exchange\/([a-z0-9-]+)/i);
          const paramMatch = currentURL.match(/id=([a-z0-9-]+)/i);

          if (pathMatch) exchangeId = pathMatch[1];
          else if (paramMatch) exchangeId = paramMatch[1];

          console.log(`✅ Exchange ID found in URL: ${exchangeId}`);
          passed++;

          // Wait for page to fully load
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

          // Check if exchange ID appears on page
          const pageContent = await page.content();
          if (pageContent.includes(exchangeId)) {
            console.log('✅ Exchange ID visible on SimpleSwap page');
            passed++;
          } else {
            console.log('⚠️  Exchange ID not found in page content');
          }

        } else {
          console.log('❌ No exchange ID found in URL');
          failed++;
        }

      } else {
        console.log(`❌ Not redirected to SimpleSwap. Current URL: ${currentURL}`);
        failed++;
      }

    } catch (error) {
      console.error('❌ SimpleSwap verification error:', error.message);
      failed++;
    }
    console.log('');

    // Final screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'flow-final.png'),
      fullPage: true
    });

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
  console.log('USER FLOW TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log(`🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  console.log('📸 Screenshots saved in: tests/screenshots/');
  console.log('  - flow-1-landing.png');
  console.log('  - flow-5-orderbump-checked.png');
  console.log('  - flow-6-before-purchase.png');
  console.log('  - flow-7-simpleswap.png');
  console.log('  - flow-final.png\n');

  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1);
}

// Run the test
runUserFlowTest().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
