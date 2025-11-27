const { test, expect } = require('@playwright/test');

test.describe('$59 Ships Today Button Test - Unique Deploy URL', () => {
  test('should redirect directly to SimpleSwap WITHOUT showing popup', async ({ page }) => {
    console.log('\n=== TESTING $59 BUTTON ON UNIQUE DEPLOY URL ===');

    // Navigate to the unique deploy URL that bypasses edge cache
    const uniqueUrl = 'https://6928195536e0d8e72b7476d6--secrets-out-jeans-2024.netlify.app';
    console.log('Step 1: Navigating to unique deploy URL...');
    console.log('URL:', uniqueUrl);
    await page.goto(uniqueUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded successfully');

    // Wait for page to be interactive
    await page.waitForTimeout(2000);

    // Scroll to load size selector
    console.log('Step 2: Scrolling to load size selector...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);

    // Select a size
    console.log('Step 3: Selecting a size...');
    const sizeButton = page.locator('.size-btn').first();
    await sizeButton.waitFor({ state: 'visible', timeout: 10000 });
    await sizeButton.click();
    console.log('Size selected');
    await page.waitForTimeout(500);

    // Scroll to CTA buttons
    console.log('Step 4: Scrolling to CTA buttons...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // Find the $59 Ships Today button (primary CTA)
    console.log('Step 5: Looking for $59 Ships Today button...');
    const shipsButton = page.locator('#primaryCTA');
    await shipsButton.waitFor({ state: 'visible', timeout: 10000 });
    const buttonText = await shipsButton.textContent();
    console.log('Ships Today button found with text:', buttonText.trim());

    // Verify it's the $59 button
    expect(buttonText).toContain('$59');
    expect(buttonText).toContain('GET MINE NOW');

    // Set up listeners BEFORE clicking
    console.log('Step 6: Setting up navigation listener...');

    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ timeout: 15000 }).catch(() => null);

    // Click the $59 button
    console.log('Step 7: Clicking $59 Ships Today button...');
    await shipsButton.click();
    console.log('Button clicked');

    // Wait a moment for any potential popup
    await page.waitForTimeout(1000);

    // CRITICAL CHECK: Verify NO popup appeared
    console.log('Step 8: Verifying NO popup appears...');
    const popup = page.locator('.order-bump-popup');
    const popupVisible = await popup.isVisible().catch(() => false);

    if (popupVisible) {
      console.log('❌ FAIL: Popup appeared when it should NOT have!');
      const popupContent = await popup.textContent();
      console.log('Popup content:', popupContent);
    } else {
      console.log('✓ PASS: No popup appeared (as expected)');
    }

    // Verify NO popup appeared
    expect(popupVisible).toBe(false);

    // Wait for navigation to complete
    await navigationPromise;
    await page.waitForTimeout(2000);

    // Verify redirect to SimpleSwap
    console.log('Step 9: Verifying redirect to SimpleSwap...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    expect(currentUrl).toContain('simpleswap.io');
    console.log('✓ PASS: Redirected to SimpleSwap');

    // Extract exchange ID
    console.log('Step 10: Extracting exchange ID...');
    const url = new URL(currentUrl);
    const exchangeId = url.searchParams.get('id');

    if (exchangeId) {
      console.log('✓ PASS: Valid exchange ID found:', exchangeId);
    } else {
      console.log('❌ FAIL: No exchange ID found');
    }

    expect(exchangeId).toBeTruthy();
    expect(exchangeId.length).toBeGreaterThan(10);

    console.log('\n=== TEST RESULTS ===');
    console.log('✓ PASS: No popup appeared for $59 button');
    console.log('✓ PASS: Direct redirect to SimpleSwap');
    console.log('✓ PASS: Valid exchange process initiated');
    console.log('Exchange ID:', exchangeId);
    console.log('Final URL:', currentUrl);
    console.log('===================\n');
  });
});
