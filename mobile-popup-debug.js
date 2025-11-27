const { chromium } = require('playwright');
const path = require('path');

async function debugPopup() {
  console.log('Debugging popup visibility issue on mobile...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const screenshotDir = path.join(__dirname, 'mobile-screenshots');

  try {
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✓ Site loaded\n');

    await page.waitForTimeout(2000);

    // Select size
    await page.locator('.size-btn').first().tap();
    await page.waitForTimeout(500);
    console.log('✓ Size selected\n');

    // Tap Pre-Order
    console.log('Tapping Pre-Order button...');
    await page.locator('button:has-text("Pre-Order")').first().tap();
    await page.waitForTimeout(3000);

    // Debug popup element
    console.log('Checking popup element properties...\n');
    const popupInfo = await page.evaluate(() => {
      const popup = document.getElementById('orderBumpPopup');
      if (!popup) return { found: false };

      const style = window.getComputedStyle(popup);
      return {
        found: true,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
        width: style.width,
        height: style.height,
        position: style.position,
        top: style.top,
        left: style.left,
        transform: style.transform,
        classes: popup.className,
        innerHTML: popup.innerHTML.substring(0, 500)
      };
    });

    console.log('Popup properties:');
    console.log(JSON.stringify(popupInfo, null, 2));
    console.log('\n');

    // Try to make it visible
    if (popupInfo.found) {
      console.log('Attempting to make popup visible...');
      await page.evaluate(() => {
        const popup = document.getElementById('orderBumpPopup');
        if (popup) {
          popup.style.display = 'flex';
          popup.style.visibility = 'visible';
          popup.style.opacity = '1';
        }
      });

      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, 'popup-forced-visible.png'),
        fullPage: false
      });

      console.log('✓ Screenshot taken with forced visibility\n');

      // Now check if it's visible
      const isVisible = await page.locator('#orderBumpPopup').isVisible();
      console.log(`Popup visible after forcing: ${isVisible}\n`);

      if (isVisible) {
        // Look for buttons
        const buttons = await page.locator('#orderBumpPopup button').all();
        console.log(`Found ${buttons.length} buttons in popup:`);

        for (let i = 0; i < buttons.length; i++) {
          const text = await buttons[i].textContent();
          const classes = await buttons[i].getAttribute('class');
          console.log(`  ${i + 1}. "${text?.trim()}" - classes: ${classes}`);
        }

        // Try tapping decline button
        const declineBtn = page.locator('#orderBumpPopup button').filter({ hasText: 'No' }).first();
        const declineVisible = await declineBtn.isVisible().catch(() => false);

        if (declineVisible) {
          console.log('\nTapping decline button...');
          await declineBtn.tap();
          await page.waitForTimeout(2000);

          const currentUrl = page.url();
          console.log(`URL after decline: ${currentUrl}`);

          if (currentUrl.includes('checkout')) {
            console.log('✓ Successfully redirected to checkout');
          }
        }
      }
    }

    // Check for JavaScript that should trigger popup
    console.log('\nChecking for popup trigger functions...');
    const functions = await page.evaluate(() => {
      const funcs = [];
      if (typeof window.showOrderBumpPopup === 'function') {
        funcs.push('showOrderBumpPopup');
      }
      if (typeof window.hideOrderBumpPopup === 'function') {
        funcs.push('hideOrderBumpPopup');
      }
      return funcs;
    });

    console.log('Found functions:', functions);

    if (functions.includes('showOrderBumpPopup')) {
      console.log('\nManually triggering showOrderBumpPopup()...');
      await page.evaluate(() => {
        if (typeof window.showOrderBumpPopup === 'function') {
          window.showOrderBumpPopup();
        }
      });

      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, 'popup-manually-triggered.png'),
        fullPage: false
      });

      const isNowVisible = await page.locator('#orderBumpPopup').isVisible();
      console.log(`Popup visible after manual trigger: ${isNowVisible}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'error-popup-debug.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

debugPopup();
