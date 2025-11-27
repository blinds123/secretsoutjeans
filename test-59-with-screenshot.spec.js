const { test, expect } = require('@playwright/test');

test.describe('$59 Button Complete Verification with Screenshots', () => {
  test('Complete test with visual verification', async ({ page }) => {
    console.log('\n=== COMPREHENSIVE $59 BUTTON TEST ===');

    const uniqueUrl = 'https://6928195536e0d8e72b7476d6--secrets-out-jeans-2024.netlify.app';

    // Navigate
    console.log('1. Navigating to unique deploy URL...');
    await page.goto(uniqueUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Screenshot: Initial page
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 01-initial-page.png');

    // Scroll and select size
    console.log('2. Selecting size...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    const sizeButton = page.locator('.size-btn').first();
    await sizeButton.click();
    await page.waitForTimeout(500);

    // Screenshot: Size selected
    await page.screenshot({ path: 'test-results/02-size-selected.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 02-size-selected.png');

    // Scroll to buttons
    console.log('3. Scrolling to CTA buttons...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // Screenshot: Buttons visible
    await page.screenshot({ path: 'test-results/03-buttons-visible.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 03-buttons-visible.png');

    // Find and verify $59 button
    console.log('4. Verifying $59 button...');
    const primaryButton = page.locator('#primaryCTA');
    await primaryButton.waitFor({ state: 'visible', timeout: 10000 });
    const buttonText = await primaryButton.textContent();
    console.log('   Button text:', buttonText.trim());
    expect(buttonText).toContain('$59');

    // Click button
    console.log('5. Clicking $59 button...');
    const navigationPromise = page.waitForNavigation({ timeout: 15000 }).catch(() => null);
    await primaryButton.click();
    await page.waitForTimeout(1000);

    // Verify no popup
    console.log('6. Checking for popup...');
    const popup = page.locator('.order-bump-popup');
    const popupVisible = await popup.isVisible().catch(() => false);

    if (popupVisible) {
      await page.screenshot({ path: 'test-results/04-ERROR-popup-appeared.png', fullPage: true });
      console.log('   ❌ ERROR: Popup appeared! Screenshot: 04-ERROR-popup-appeared.png');
    } else {
      console.log('   ✓ PASS: No popup appeared');
    }
    expect(popupVisible).toBe(false);

    // Wait for navigation
    await navigationPromise;
    await page.waitForTimeout(2000);

    // Verify SimpleSwap
    console.log('7. Verifying SimpleSwap redirect...');
    const currentUrl = page.url();
    console.log('   Final URL:', currentUrl);

    // Screenshot: SimpleSwap page
    await page.screenshot({ path: 'test-results/05-simpleswap-page.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 05-simpleswap-page.png');

    expect(currentUrl).toContain('simpleswap.io');

    // Extract exchange ID
    const url = new URL(currentUrl);
    const exchangeId = url.searchParams.get('id');
    console.log('   Exchange ID:', exchangeId);

    expect(exchangeId).toBeTruthy();
    expect(exchangeId.length).toBeGreaterThan(10);

    console.log('\n=== FINAL RESULTS ===');
    console.log('✓ PASS: All tests passed');
    console.log('✓ No popup appeared');
    console.log('✓ Direct redirect to SimpleSwap');
    console.log('✓ Valid exchange ID:', exchangeId);
    console.log('✓ Screenshots saved in test-results/');
    console.log('===================\n');
  });
});
