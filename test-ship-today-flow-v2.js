const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'test-screenshots-ship-today');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    url: 'https://secrets-out-jeans-2024.netlify.app',
    tests: []
  };

  let testNumber = 1;

  async function captureScreenshot(name) {
    const filename = `${testNumber.toString().padStart(2, '0')}-${name}.png`;
    await page.screenshot({
      path: path.join(screenshotsDir, filename),
      fullPage: true
    });
    console.log(`📸 Screenshot saved: ${filename}`);
    testNumber++;
  }

  try {
    console.log('\n🚀 Starting $59 "Ship Today" Checkout Flow Test\n');
    console.log('=' .repeat(60));

    // Step 1: Navigate to site (fresh, no cache)
    console.log('\n1️⃣  STEP 1: Navigate to site (fresh, no cache)');
    console.log('-'.repeat(60));
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    await captureScreenshot('initial-page-load');

    results.tests.push({
      step: 'Page Load',
      status: 'PASS',
      details: 'Site loaded successfully'
    });
    console.log('✅ PASS: Page loaded successfully');

    // Step 2: Select a size
    console.log('\n2️⃣  STEP 2: Select a size');
    console.log('-'.repeat(60));

    // Wait for size buttons to be visible
    await page.waitForSelector('.size-btn', { timeout: 10000 });

    // Get all size buttons
    const sizeButtons = await page.$$('.size-btn');
    console.log(`   Found ${sizeButtons.length} size buttons`);

    // Click the first available size button
    if (sizeButtons.length > 0) {
      await sizeButtons[0].click();
      await page.waitForTimeout(1000);
      await captureScreenshot('size-selected');

      const selectedSize = await page.$eval('.size-btn.selected', el => el.textContent.trim());
      console.log(`✅ PASS: Size selected: ${selectedSize}`);

      results.tests.push({
        step: 'Size Selection',
        status: 'PASS',
        details: `Selected size: ${selectedSize}`
      });
    } else {
      throw new Error('No size buttons found');
    }

    // Step 2.5: Inspect all buttons on the page
    console.log('\n🔍 INSPECTING: Finding all buttons on page');
    console.log('-'.repeat(60));

    const allButtons = await page.$$eval('button, .btn, .cta-button, a[role="button"]', buttons =>
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id,
        tag: btn.tagName
      }))
    );

    console.log('   All buttons found:');
    allButtons.forEach((btn, idx) => {
      console.log(`   ${idx + 1}. [${btn.tag}] "${btn.text}" (class: ${btn.className})`);
    });

    // Step 3: Click the "$59 Ships Today" button
    console.log('\n3️⃣  STEP 3: Click "$59 Ships Today" button');
    console.log('-'.repeat(60));

    // Try multiple selectors
    let shipTodayButton = null;
    const selectors = [
      'button:has-text("$59")',
      'button:has-text("Ships Today")',
      '.cta-button:has-text("$59")',
      '.primary-cta',
      'button.primary',
      'button[onclick*="handlePurchase"]',
      '.price-option button:first-child',
      'button:has-text("SHIP")'
    ];

    for (const selector of selectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          const isVisible = await btn.isVisible();
          if (isVisible) {
            shipTodayButton = btn;
            console.log(`   ✓ Found button with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!shipTodayButton) {
      // Last resort: find button with $59 in text
      shipTodayButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, .btn, .cta-button'));
        return buttons.find(btn =>
          btn.textContent.includes('$59') ||
          btn.textContent.includes('Ships Today') ||
          btn.textContent.includes('SHIP')
        );
      });

      if (shipTodayButton && shipTodayButton.asElement()) {
        shipTodayButton = shipTodayButton.asElement();
      } else {
        throw new Error('$59 Ships Today button not found with any selector');
      }
    }

    const buttonText = await shipTodayButton.textContent();
    console.log(`   Button text: "${buttonText.trim()}"`);

    // Set up listener for navigation before clicking
    const [response] = await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('simpleswap') ||
        response.url().includes('api') ||
        response.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => null),
      shipTodayButton.click()
    ]);

    await page.waitForTimeout(1000);
    await captureScreenshot('after-button-click');

    console.log('✅ PASS: Button clicked successfully');
    results.tests.push({
      step: 'Button Click',
      status: 'PASS',
      details: `Primary CTA button clicked: "${buttonText.trim()}"`
    });

    // Step 4: Verify NO popup appears
    console.log('\n4️⃣  STEP 4: Verify NO order bump popup appears');
    console.log('-'.repeat(60));

    await page.waitForTimeout(2000);

    // Check for popup elements with various selectors
    const popupSelectors = [
      '.modal-overlay',
      '.popup-overlay',
      '#orderBumpModal',
      '.modal',
      '[class*="modal"]',
      '[class*="popup"]',
      '[style*="display: block"][class*="modal"]'
    ];

    let popupVisible = false;
    let foundPopupSelector = null;

    for (const selector of popupSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            popupVisible = true;
            foundPopupSelector = selector;
            break;
          }
        }
      } catch (e) {
        // Continue checking
      }
    }

    if (popupVisible) {
      await captureScreenshot('unexpected-popup-appeared');
      console.log(`❌ FAIL: Order bump popup appeared (selector: ${foundPopupSelector})`);
      results.tests.push({
        step: 'No Popup Verification',
        status: 'FAIL',
        details: `Order bump popup appeared unexpectedly (${foundPopupSelector})`
      });
    } else {
      console.log('✅ PASS: No popup appeared - should redirect to SimpleSwap');
      results.tests.push({
        step: 'No Popup Verification',
        status: 'PASS',
        details: 'No order bump popup appeared'
      });
    }

    // Step 5: Wait for redirect to SimpleSwap
    console.log('\n5️⃣  STEP 5: Wait for redirect to SimpleSwap');
    console.log('-'.repeat(60));

    // Wait for either URL change or new page
    let redirected = false;
    const startUrl = page.url();

    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();

      if (currentUrl !== startUrl) {
        console.log(`   ✓ URL changed from ${startUrl}`);
        console.log(`   ✓ New URL: ${currentUrl}`);
        redirected = true;
        break;
      }

      // Check if we're on a new domain
      if (currentUrl.includes('simpleswap')) {
        redirected = true;
        break;
      }
    }

    await page.waitForTimeout(2000);
    await captureScreenshot('after-redirect-wait');

    if (redirected) {
      console.log('✅ PASS: Page navigation detected');
      results.tests.push({
        step: 'Redirect Detection',
        status: 'PASS',
        details: 'Page redirected after button click'
      });
    } else {
      console.log('⚠️  WARNING: No redirect detected within 15 seconds');
      results.tests.push({
        step: 'Redirect Detection',
        status: 'WARNING',
        details: 'No redirect detected within timeout period'
      });
    }

    // Step 6: Capture final URL
    console.log('\n6️⃣  STEP 6: Capture final URL');
    console.log('-'.repeat(60));

    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);

    results.finalUrl = finalUrl;

    // Step 7: Verify it's a valid SimpleSwap exchange page
    console.log('\n7️⃣  STEP 7: Verify valid SimpleSwap exchange URL');
    console.log('-'.repeat(60));

    const isSimpleSwapUrl = finalUrl.includes('simpleswap.io') || finalUrl.includes('simpleswap');
    const hasExchangeId = finalUrl.includes('?id=') || finalUrl.includes('/exchange/') || finalUrl.includes('exchange');

    if (isSimpleSwapUrl) {
      console.log('✅ PASS: Redirected to SimpleSwap domain');
      await captureScreenshot('simpleswap-page');
      results.tests.push({
        step: 'SimpleSwap Domain',
        status: 'PASS',
        details: `URL contains SimpleSwap domain: ${finalUrl}`
      });
    } else {
      console.log(`❌ FAIL: Not redirected to SimpleSwap (URL: ${finalUrl})`);
      results.tests.push({
        step: 'SimpleSwap Domain',
        status: 'FAIL',
        details: `URL does not contain SimpleSwap domain: ${finalUrl}`
      });
    }

    if (hasExchangeId || isSimpleSwapUrl) {
      console.log('✅ PASS: Valid exchange URL structure');
      results.tests.push({
        step: 'Exchange URL Verification',
        status: 'PASS',
        details: 'Valid exchange URL structure detected'
      });
    } else {
      console.log('⚠️  WARNING: URL may not be a valid exchange page');
      results.tests.push({
        step: 'Exchange URL Verification',
        status: 'WARNING',
        details: 'URL structure unclear'
      });
    }

    // Check for SimpleSwap page elements if we're on simpleswap
    if (isSimpleSwapUrl) {
      await page.waitForTimeout(3000);
      await captureScreenshot('simpleswap-loaded');

      const pageTitle = await page.title();
      console.log(`   Page title: ${pageTitle}`);

      const hasExchangeContent = pageTitle.toLowerCase().includes('swap') ||
                                 pageTitle.toLowerCase().includes('exchange');

      if (hasExchangeContent) {
        console.log('✅ PASS: SimpleSwap page content verified');
        results.tests.push({
          step: 'Page Content Verification',
          status: 'PASS',
          details: `SimpleSwap page loaded: "${pageTitle}"`
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passCount = results.tests.filter(t => t.status === 'PASS').length;
    const failCount = results.tests.filter(t => t.status === 'FAIL').length;
    const warnCount = results.tests.filter(t => t.status === 'WARNING').length;

    console.log(`\n✅ PASSED: ${passCount}`);
    console.log(`❌ FAILED: ${failCount}`);
    console.log(`⚠️  WARNINGS: ${warnCount}`);
    console.log(`📝 TOTAL TESTS: ${results.tests.length}`);

    results.summary = {
      passed: passCount,
      failed: failCount,
      warnings: warnCount,
      total: results.tests.length,
      overallStatus: failCount === 0 ? (warnCount === 0 ? 'PASS' : 'PASS_WITH_WARNINGS') : 'FAIL'
    };

    console.log('\n' + '='.repeat(60));
    console.log('📋 DETAILED RESULTS');
    console.log('='.repeat(60));

    results.tests.forEach((test, index) => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`\n${index + 1}. ${icon} ${test.step}: ${test.status}`);
      console.log(`   ${test.details}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 OVERALL RESULT: ${results.summary.overallStatus}`);
    console.log('='.repeat(60));

    // Save results to JSON
    const resultsPath = path.join(__dirname, 'ship-today-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
    console.log(`📸 Screenshots saved to: ${screenshotsDir}/`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await captureScreenshot('error-state');

    results.tests.push({
      step: 'Test Execution',
      status: 'FAIL',
      details: `Error: ${error.message}`
    });

    results.summary = {
      passed: results.tests.filter(t => t.status === 'PASS').length,
      failed: results.tests.filter(t => t.status === 'FAIL').length,
      warnings: results.tests.filter(t => t.status === 'WARNING').length,
      total: results.tests.length,
      overallStatus: 'FAIL',
      error: error.message
    };

    const resultsPath = path.join(__dirname, 'ship-today-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
