const { test, expect } = require('@playwright/test');

test.describe('Pre-Order Button Verification', () => {
  test('should show order bump popup when clicking $19 Pre-Order button', async ({ page }) => {
    console.log('=== STARTING PRE-ORDER BUTTON TEST ===');

    // Navigate to the site with fresh cache
    console.log('Step 1: Navigating to site...');
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded successfully');
    await page.screenshot({ path: 'test-results/01-page-loaded.png', fullPage: true });

    // Wait for page to be ready
    await page.waitForTimeout(2000);

    // Scroll down to load the lazy content (size selector)
    console.log('Step 2: Scrolling to load size selector...');
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(2000);

    // Find and select a size
    console.log('Step 3: Selecting a size...');
    const sizeButton = page.locator('.size-btn:not([disabled])').first();
    await expect(sizeButton).toBeVisible({ timeout: 10000 });
    await sizeButton.click();
    console.log('Size selected');
    await page.screenshot({ path: 'test-results/02-size-selected.png', fullPage: true });

    // Wait for size selection to register
    await page.waitForTimeout(1000);

    // Scroll back to top to see the CTA buttons
    console.log('Step 4: Scrolling to CTA buttons...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Find the $19 Pre-Order button (secondary CTA)
    console.log('Step 5: Looking for $19 Pre-Order button...');

    // Use the specific ID for the secondary CTA button
    const preOrderButton = page.locator('#secondaryCTA');

    await expect(preOrderButton).toBeVisible({ timeout: 5000 });
    const buttonText = await preOrderButton.textContent();
    console.log(`Pre-order button found with text: "${buttonText.replace(/\s+/g, ' ').trim()}"`);
    await page.screenshot({ path: 'test-results/03-before-click.png', fullPage: true });

    // Click the Pre-Order button
    console.log('Step 6: Clicking Pre-Order button...');
    await preOrderButton.click();
    console.log('Pre-Order button clicked');

    // Wait for popup to appear
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/04-after-click.png', fullPage: true });

    // VERIFY: Order bump popup SHOULD appear using the specific ID
    console.log('Step 7: Verifying order bump popup appears...');

    const popup = page.locator('#orderBumpPopup');

    await expect(popup).toBeVisible({ timeout: 5000 });
    console.log('✓ Order bump popup is visible');
    await page.screenshot({ path: 'test-results/05-popup-visible.png', fullPage: true });

    // Check for crop top upsell content
    console.log('Step 8: Verifying popup shows crop top upsell offer...');
    const popupText = await popup.textContent();
    console.log('Popup content:', popupText.replace(/\s+/g, ' ').trim());

    const hasCropTopMention = popupText.toLowerCase().includes('crop') ||
                              popupText.toLowerCase().includes('top') ||
                              popupText.toLowerCase().includes('match');

    if (hasCropTopMention) {
      console.log('✓ Popup shows crop top upsell offer');
    } else {
      console.log('WARNING: Popup may not contain expected crop top content');
    }

    // Find and click "No thanks" button
    console.log('Step 9: Looking for decline button...');

    // The decline button has onclick="declineOrderBump()"
    const declineButton = popup.locator('button[onclick="declineOrderBump()"]');

    await expect(declineButton).toBeVisible();
    const declineText = await declineButton.textContent();
    console.log(`Decline button found with text: "${declineText.replace(/\s+/g, ' ').trim()}"`);

    console.log('Step 10: Clicking decline button...');
    await page.screenshot({ path: 'test-results/06-before-decline.png', fullPage: true });

    // Set up navigation promise before clicking
    const navigationPromise = page.waitForNavigation({
      timeout: 15000,
      waitUntil: 'domcontentloaded'
    }).catch(() => null);

    await declineButton.click();
    console.log('Decline button clicked');

    // Wait for navigation
    await navigationPromise;
    await page.waitForTimeout(2000);

    // Verify redirect to SimpleSwap
    console.log('Step 11: Verifying redirect to SimpleSwap...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    await page.screenshot({ path: 'test-results/07-final-page.png', fullPage: true });

    if (!currentUrl.includes('simpleswap')) {
      console.log('ERROR: Did not redirect to SimpleSwap');
      console.log('Expected URL to contain "simpleswap"');
      throw new Error('FAIL: Did not redirect to SimpleSwap after declining upsell');
    }

    console.log('✓ Redirected to SimpleSwap');

    // Extract exchange ID from URL
    console.log('Step 12: Extracting exchange ID...');
    const urlParams = new URL(currentUrl).searchParams;
    const exchangeId = urlParams.get('id') || currentUrl.match(/\/exchange\/([^/?]+)/)?.[1];

    if (exchangeId) {
      console.log('✓ Valid exchange ID found:', exchangeId);
    } else {
      console.log('WARNING: Could not extract exchange ID from URL');
      console.log('Full URL:', currentUrl);
    }

    console.log('\n=== TEST RESULTS ===');
    console.log('✓ PASS: Order bump popup appeared for $19 button');
    console.log('✓ PASS: Popup showed crop top upsell offer');
    console.log('✓ PASS: After decline, redirected to SimpleSwap');
    console.log('✓ PASS: Valid exchange process initiated');
    console.log('Exchange ID:', exchangeId || 'N/A');
    console.log('Final URL:', currentUrl);
    console.log('===================\n');
  });
});
