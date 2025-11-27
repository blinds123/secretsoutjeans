import { test, expect } from '@playwright/test';

test('PRODUCTION VERIFICATION: $59 Ships Today button - Direct SimpleSwap redirect (NO popup)', async ({ page }) => {
  console.log('==========================================');
  console.log('PRODUCTION $59 BUTTON VERIFICATION TEST');
  console.log('==========================================');
  console.log('URL: https://secrets-out-jeans-2024.netlify.app');
  console.log('');

  // Navigate to production URL
  console.log('[1/5] Navigating to production site...');
  await page.goto('https://secrets-out-jeans-2024.netlify.app', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  console.log('      ✓ Page loaded successfully');

  await page.waitForTimeout(2000);

  // Scroll to ensure buttons are loaded
  console.log('[2/5] Scrolling to CTA section...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  console.log('      ✓ Scrolled to buttons');

  // Select a size
  console.log('[3/5] Selecting size...');
  const sizeButton = page.locator('button.size-option').first();
  await sizeButton.waitFor({ state: 'visible', timeout: 10000 });
  await sizeButton.click();
  await page.waitForTimeout(500);
  console.log('      ✓ Size selected');

  // Find the $59 Ships Today button
  console.log('[4/5] Finding $59 Ships Today button...');
  const button59 = page.locator('button:has-text("$59")').first();
  await button59.waitFor({ state: 'visible', timeout: 10000 });
  const buttonText = await button59.textContent();
  console.log(`      ✓ Button found: "${buttonText.trim()}"`);

  // Click and verify direct redirect (NO popup)
  console.log('[5/5] Clicking button and verifying redirect...');

  // Check for popup BEFORE click (should be 0)
  const popupBeforeClick = await page.locator('.modal, .popup, [role="dialog"], #orderBumpPopup').count();

  // Set up navigation listener
  const navigationPromise = page.waitForURL(/simpleswap\.io/, { timeout: 15000 });

  // Click button
  await button59.click();
  console.log('      - Button clicked');

  // Wait a moment to check if popup appears (it should NOT)
  await page.waitForTimeout(1000);
  const popupAfterClick = await page.locator('.modal, .popup, [role="dialog"], #orderBumpPopup').count();

  // Wait for SimpleSwap navigation
  await navigationPromise;
  const finalUrl = page.url();
  console.log('      ✓ Redirected to SimpleSwap');

  // Extract exchange ID
  const exchangeId = finalUrl.match(/id=([a-zA-Z0-9]+)/)?.[1];

  console.log('');
  console.log('==========================================');
  console.log('RESULTS');
  console.log('==========================================');

  if (popupAfterClick === 0) {
    console.log('✓ PASS: No popup appeared');
  } else {
    console.log('✗ FAIL: Popup detected');
  }

  if (finalUrl.includes('simpleswap.io')) {
    console.log('✓ PASS: Direct redirect to SimpleSwap');
  } else {
    console.log('✗ FAIL: Did not redirect to SimpleSwap');
  }

  if (exchangeId) {
    console.log('✓ PASS: Valid exchange ID found');
  } else {
    console.log('✗ FAIL: No exchange ID in URL');
  }

  console.log('');
  console.log('Exchange ID:', exchangeId);
  console.log('Exchange URL:', finalUrl);
  console.log('==========================================');

  // Final assertions
  expect(popupAfterClick).toBe(0);
  expect(finalUrl).toContain('simpleswap.io');
  expect(exchangeId).toBeTruthy();
  expect(exchangeId.length).toBeGreaterThan(10);
});
