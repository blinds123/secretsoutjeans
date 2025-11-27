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

    // Step 3: Click the "$59 Ships Today" button
    console.log('\n3️⃣  STEP 3: Click "$59 Ships Today" button');
    console.log('-'.repeat(60));

    // Find and click the primary CTA button
    const shipTodayButton = await page.$('.cta-button.primary, button:has-text("Ships Today")');

    if (!shipTodayButton) {
      throw new Error('$59 Ships Today button not found');
    }

    const buttonText = await shipTodayButton.textContent();
    console.log(`   Button text: ${buttonText.trim()}`);

    // Set up listener for navigation
    const navigationPromise = page.waitForNavigation({ timeout: 15000 }).catch(() => null);

    await shipTodayButton.click();
    await page.waitForTimeout(1000);
    await captureScreenshot('after-button-click');

    console.log('✅ PASS: Button clicked successfully');
    results.tests.push({
      step: 'Button Click',
      status: 'PASS',
      details: 'Primary CTA button clicked'
    });

    // Step 4: Verify NO popup appears
    console.log('\n4️⃣  STEP 4: Verify NO order bump popup appears');
    console.log('-'.repeat(60));

    await page.waitForTimeout(2000);

    // Check for popup elements
    const popupVisible = await page.isVisible('.modal-overlay, .popup-overlay, #orderBumpModal').catch(() => false);

    if (popupVisible) {
      await captureScreenshot('unexpected-popup-appeared');
      console.log('❌ FAIL: Order bump popup appeared (should not appear for $59 flow)');
      results.tests.push({
        step: 'No Popup Verification',
        status: 'FAIL',
        details: 'Order bump popup appeared unexpectedly'
      });
    } else {
      console.log('✅ PASS: No popup appeared - direct redirect to SimpleSwap');
      results.tests.push({
        step: 'No Popup Verification',
        status: 'PASS',
        details: 'No order bump popup appeared'
      });
    }

    // Step 5: Wait for redirect to SimpleSwap
    console.log('\n5️⃣  STEP 5: Wait for redirect to SimpleSwap');
    console.log('-'.repeat(60));

    await navigationPromise;
    await page.waitForTimeout(3000);
    await captureScreenshot('simpleswap-page');

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
    const hasExchangeId = finalUrl.includes('?id=') || finalUrl.includes('/exchange/');

    if (isSimpleSwapUrl) {
      console.log('✅ PASS: Redirected to SimpleSwap domain');
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

    if (hasExchangeId) {
      console.log('✅ PASS: Valid exchange ID found in URL');
      results.tests.push({
        step: 'Exchange ID Verification',
        status: 'PASS',
        details: 'Exchange ID parameter found in URL'
      });
    } else {
      console.log('⚠️  WARNING: No exchange ID found in URL (may still be valid)');
      results.tests.push({
        step: 'Exchange ID Verification',
        status: 'WARNING',
        details: 'No obvious exchange ID parameter found'
      });
    }

    // Check for SimpleSwap page elements
    await page.waitForTimeout(2000);
    const pageContent = await page.content();
    const hasSimpleSwapElements = pageContent.toLowerCase().includes('simpleswap') ||
                                  pageContent.toLowerCase().includes('exchange');

    if (hasSimpleSwapElements) {
      console.log('✅ PASS: SimpleSwap page content detected');
      results.tests.push({
        step: 'Page Content Verification',
        status: 'PASS',
        details: 'SimpleSwap content found on page'
      });
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
      overallStatus: failCount === 0 ? 'PASS' : 'FAIL'
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
