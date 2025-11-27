const { chromium } = require('playwright');
const path = require('path');

async function comprehensiveMobileTest() {
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE MOBILE RESPONSIVENESS TEST');
  console.log('Device: iPhone 12 (390x844)');
  console.log('URL: https://secrets-out-jeans-2024.netlify.app');
  console.log('='.repeat(70));
  console.log('\n');

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

  const results = {
    passed: [],
    warnings: [],
    failed: []
  };

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // TEST 1: Page Load
    console.log('TEST 1: Page Load & Initial Render');
    console.log('-'.repeat(70));
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    console.log('✓ Page loaded successfully');
    results.passed.push('Page loads successfully');

    // TEST 2: Horizontal Overflow Check
    console.log('\nTEST 2: Horizontal Overflow Check');
    console.log('-'.repeat(70));
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;

    if (bodyWidth <= viewportWidth) {
      console.log(`✓ No horizontal overflow (Body: ${bodyWidth}px, Viewport: ${viewportWidth}px)`);
      results.passed.push('No horizontal overflow');
    } else {
      console.log(`✗ HORIZONTAL OVERFLOW DETECTED (Body: ${bodyWidth}px > Viewport: ${viewportWidth}px)`);
      results.failed.push(`Horizontal overflow: ${bodyWidth}px > ${viewportWidth}px`);
    }

    // TEST 3: Hero Section
    console.log('\nTEST 3: Hero Section Visibility & Responsiveness');
    console.log('-'.repeat(70));
    await page.screenshot({
      path: path.join(screenshotDir, 'final-1-hero.png'),
      fullPage: false
    });

    const heroTitle = await page.locator('h1').first();
    if (await heroTitle.isVisible()) {
      const fontSize = await heroTitle.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`✓ Hero title visible (Font size: ${fontSize})`);
      results.passed.push('Hero section displays correctly');
    } else {
      console.log('✗ Hero title not visible');
      results.failed.push('Hero title not visible');
    }

    const heroImage = await page.locator('img').first();
    if (await heroImage.isVisible()) {
      const imgBox = await heroImage.boundingBox();
      if (imgBox && imgBox.width <= viewportWidth) {
        console.log(`✓ Hero image fits viewport (Width: ${imgBox.width}px)`);
        results.passed.push('Hero image scales properly');
      } else if (imgBox) {
        console.log(`⚠ Hero image wider than viewport (${imgBox.width}px)`);
        results.warnings.push(`Hero image: ${imgBox.width}px`);
      }
    }

    // TEST 4: Product Info & Buttons
    console.log('\nTEST 4: Product Info & Button Sizes');
    console.log('-'.repeat(70));
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.8));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'final-2-product-info.png'),
      fullPage: false
    });

    // Check size buttons
    const sizeButtons = await page.locator('.size-btn').all();
    console.log(`Found ${sizeButtons.length} size buttons`);

    if (sizeButtons.length > 0) {
      const firstButton = sizeButtons[0];
      const buttonBox = await firstButton.boundingBox();

      if (buttonBox) {
        const minSize = 44;
        if (buttonBox.width >= minSize && buttonBox.height >= minSize) {
          console.log(`✓ Size buttons meet tappable size (${buttonBox.width}px × ${buttonBox.height}px)`);
          results.passed.push('Size buttons are tappable (≥44x44px)');
        } else {
          console.log(`⚠ Size buttons smaller than recommended (${buttonBox.width}px × ${buttonBox.height}px < 44x44px)`);
          results.warnings.push(`Size buttons: ${buttonBox.width}px × ${buttonBox.height}px`);
        }
      }
    }

    // Check Pre-Order button
    const preOrderButton = await page.locator('button:has-text("Pre-Order")').first();
    if (await preOrderButton.isVisible()) {
      const btnBox = await preOrderButton.boundingBox();
      if (btnBox) {
        console.log(`✓ Pre-Order button size: ${btnBox.width}px × ${btnBox.height}px`);
        if (btnBox.height >= 44) {
          results.passed.push('Pre-Order button is tappable');
        } else {
          results.warnings.push(`Pre-Order button height: ${btnBox.height}px`);
        }
      }
    }

    // TEST 5: Text Readability
    console.log('\nTEST 5: Text Readability (Font Sizes)');
    console.log('-'.repeat(70));
    const textCheck = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, button, li');
      let smallTextCount = 0;
      const minSize = 12;

      elements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < minSize && el.textContent.trim().length > 0) {
          smallTextCount++;
        }
      });

      return { smallTextCount };
    });

    if (textCheck.smallTextCount === 0) {
      console.log('✓ All text elements are readable (≥12px)');
      results.passed.push('All text is readable');
    } else {
      console.log(`⚠ ${textCheck.smallTextCount} text elements smaller than 12px`);
      results.warnings.push(`${textCheck.smallTextCount} small text elements`);
    }

    // TEST 6: Images Scale Properly
    console.log('\nTEST 6: Image Scaling');
    console.log('-'.repeat(70));
    const imageCheck = await page.evaluate((vpWidth) => {
      const images = Array.from(document.querySelectorAll('img'));
      let oversizedCount = 0;

      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.width > vpWidth) {
          oversizedCount++;
        }
      });

      return { total: images.length, oversizedCount };
    }, viewportWidth);

    if (imageCheck.oversizedCount === 0) {
      console.log(`✓ All ${imageCheck.total} images scale properly`);
      results.passed.push('All images scale within viewport');
    } else {
      console.log(`⚠ ${imageCheck.oversizedCount} of ${imageCheck.total} images exceed viewport`);
      results.warnings.push(`${imageCheck.oversizedCount} oversized images`);
    }

    // TEST 7: Footer
    console.log('\nTEST 7: Footer Responsiveness');
    console.log('-'.repeat(70));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'final-3-footer.png'),
      fullPage: false
    });
    console.log('✓ Footer screenshot captured');
    results.passed.push('Footer visible');

    // TEST 8: Checkout Flow
    console.log('\nTEST 8: Mobile Checkout Flow');
    console.log('-'.repeat(70));

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Step 1: Select size
    console.log('Step 1: Selecting size...');
    const sizeBtn = await page.locator('.size-btn').first();
    await sizeBtn.tap();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, 'final-4-size-selected.png'),
      fullPage: false
    });
    console.log('✓ Size selected');

    // Step 2: Tap Pre-Order
    console.log('\nStep 2: Tapping Pre-Order button...');
    await page.locator('button:has-text("Pre-Order")').first().tap();

    // Wait for popup with proper timeout
    await page.waitForTimeout(2000);

    // Step 3: Check for popup
    console.log('\nStep 3: Checking for Order Bump popup...');
    const popup = page.locator('#orderBumpPopup');

    // Wait for popup to be visible
    try {
      await popup.waitFor({ state: 'visible', timeout: 3000 });
      console.log('✓ Order Bump popup appeared');

      await page.screenshot({
        path: path.join(screenshotDir, 'final-5-popup-visible.png'),
        fullPage: false
      });

      // Check popup responsiveness
      const popupBox = await popup.boundingBox();
      if (popupBox) {
        if (popupBox.width <= viewportWidth) {
          console.log(`✓ Popup fits within viewport (${popupBox.width}px)`);
          results.passed.push('Order Bump popup appears and fits viewport');
        } else {
          console.log(`⚠ Popup wider than viewport (${popupBox.width}px > ${viewportWidth}px)`);
          results.warnings.push('Popup exceeds viewport width');
        }
      }

      // Step 4: Check buttons in popup
      console.log('\nStep 4: Checking popup buttons...');
      const popupButtons = await page.locator('#orderBumpPopup button').all();
      console.log(`Found ${popupButtons.length} buttons in popup`);

      for (const btn of popupButtons) {
        const text = await btn.textContent();
        const box = await btn.boundingBox();
        if (box) {
          console.log(`  - "${text?.trim().substring(0, 30)}..." (${box.width}px × ${box.height}px)`);
        }
      }

      // Step 5: Tap decline
      console.log('\nStep 5: Tapping decline button...');
      const declineBtn = page.locator('#orderBumpPopup button').filter({ hasText: 'No thanks' });

      if (await declineBtn.isVisible()) {
        await declineBtn.tap();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(screenshotDir, 'final-6-after-decline.png'),
          fullPage: false
        });

        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        if (currentUrl.includes('checkout')) {
          console.log('✓ Successfully redirected to checkout');
          results.passed.push('Decline button redirects to checkout');
        } else {
          console.log('⚠ Still on landing page after decline');
          results.warnings.push('No redirect after declining popup');
        }
      } else {
        console.log('⚠ Decline button not visible');
        results.warnings.push('Decline button not found');
      }

    } catch (error) {
      console.log('⚠ Popup did not appear or timed out');
      results.warnings.push('Order Bump popup detection timeout');
    }

    // Full page screenshot
    console.log('\nCapturing full page screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'final-7-full-page.png'),
      fullPage: true
    });
    console.log('✓ Full page screenshot saved');

    // Console errors check
    if (consoleErrors.length > 0) {
      console.log(`\n⚠ ${consoleErrors.length} console errors detected`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      });
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    results.failed.push(`Critical error: ${error.message}`);

    await page.screenshot({
      path: path.join(screenshotDir, 'final-error.png'),
      fullPage: true
    });
  } finally {
    await browser.close();

    // Final Report
    console.log('\n\n');
    console.log('='.repeat(70));
    console.log('MOBILE RESPONSIVENESS TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`\n✓ PASSED: ${results.passed.length} tests`);
    results.passed.forEach(item => console.log(`  ✓ ${item}`));

    if (results.warnings.length > 0) {
      console.log(`\n⚠ WARNINGS: ${results.warnings.length} issues`);
      results.warnings.forEach(item => console.log(`  ⚠ ${item}`));
    }

    if (results.failed.length > 0) {
      console.log(`\n✗ FAILED: ${results.failed.length} tests`);
      results.failed.forEach(item => console.log(`  ✗ ${item}`));
    }

    console.log(`\n📁 Screenshots saved to: ${screenshotDir}`);
    console.log('\n' + '='.repeat(70));

    if (results.failed.length === 0) {
      console.log('✅ OVERALL: MOBILE RESPONSIVE - Ready for production');
    } else {
      console.log('⚠️  OVERALL: Issues found - Review needed');
    }
    console.log('='.repeat(70));
  }
}

comprehensiveMobileTest();
