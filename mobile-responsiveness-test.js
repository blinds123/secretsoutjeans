const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testMobileResponsiveness() {
  console.log('Starting mobile responsiveness test...\n');

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

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const issues = [];

  try {
    console.log('1. Navigating to the site...');
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✓ Site loaded successfully\n');

    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);

    // Check for horizontal overflow
    console.log('2. Checking for horizontal overflow...');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    if (bodyWidth > viewportWidth) {
      issues.push(`Horizontal overflow detected: Body width (${bodyWidth}px) exceeds viewport (${viewportWidth}px)`);
      console.log(`⚠ Horizontal overflow detected: ${bodyWidth}px > ${viewportWidth}px`);
    } else {
      console.log(`✓ No horizontal overflow (${bodyWidth}px)\n`);
    }

    // Screenshot 1: Hero Section
    console.log('3. Taking screenshot of Hero section...');
    await page.screenshot({
      path: path.join(screenshotDir, '1-hero-section.png'),
      fullPage: false
    });
    console.log('✓ Hero section screenshot saved\n');

    // Verify hero section elements
    console.log('4. Verifying hero section elements...');
    const heroTitle = await page.locator('h1').first();
    if (await heroTitle.isVisible()) {
      const fontSize = await heroTitle.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log(`✓ Hero title visible (font-size: ${fontSize})`);
    } else {
      issues.push('Hero title not visible');
      console.log('⚠ Hero title not visible');
    }

    // Scroll to product info section
    console.log('\n5. Scrolling to product info section...');
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.8));
    await page.waitForTimeout(1000);

    // Screenshot 2: Product Info and Buttons
    await page.screenshot({
      path: path.join(screenshotDir, '2-product-info-buttons.png'),
      fullPage: false
    });
    console.log('✓ Product info screenshot saved\n');

    // Verify size buttons
    console.log('6. Verifying size buttons...');
    const sizeButtons = await page.locator('.size-btn').all();
    console.log(`Found ${sizeButtons.length} size buttons`);

    if (sizeButtons.length > 0) {
      const firstButton = sizeButtons[0];
      const buttonBox = await firstButton.boundingBox();

      if (buttonBox) {
        console.log(`Button dimensions: ${buttonBox.width}px × ${buttonBox.height}px`);

        // Check if button meets minimum tappable size (44x44 recommended)
        if (buttonBox.width < 44 || buttonBox.height < 44) {
          issues.push(`Size button too small for mobile: ${buttonBox.width}px × ${buttonBox.height}px (recommended: 44x44)`);
          console.log(`⚠ Size button smaller than recommended 44x44px`);
        } else {
          console.log(`✓ Size button meets tappable size requirements`);
        }
      }
    } else {
      issues.push('No size buttons found');
      console.log('⚠ No size buttons found');
    }

    // Verify Pre-Order button
    console.log('\n7. Verifying Pre-Order button...');
    const preOrderButton = await page.locator('button:has-text("Pre-Order")').first();
    if (await preOrderButton.isVisible()) {
      const buttonBox = await preOrderButton.boundingBox();
      if (buttonBox) {
        console.log(`Pre-Order button: ${buttonBox.width}px × ${buttonBox.height}px`);
        if (buttonBox.width < 44 || buttonBox.height < 44) {
          issues.push(`Pre-Order button too small: ${buttonBox.width}px × ${buttonBox.height}px`);
          console.log(`⚠ Pre-Order button smaller than recommended`);
        } else {
          console.log(`✓ Pre-Order button meets tappable size`);
        }
      }
    }

    // Scroll to testimonials
    console.log('\n8. Scrolling to testimonials section...');
    const testimonialsSection = await page.locator('.testimonials-section, #testimonials').first();
    if (await testimonialsSection.isVisible()) {
      await testimonialsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, '3-testimonials-section.png'),
        fullPage: false
      });
      console.log('✓ Testimonials screenshot saved');

      // Check testimonial cards
      const testimonialCards = await page.locator('.testimonial-card, .testimonial').all();
      console.log(`Found ${testimonialCards.length} testimonial cards`);
    } else {
      console.log('⚠ Testimonials section not found');
    }

    // Scroll to footer
    console.log('\n9. Scrolling to footer...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, '4-footer.png'),
      fullPage: false
    });
    console.log('✓ Footer screenshot saved\n');

    // Full page screenshot
    console.log('10. Taking full page screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, '5-full-page.png'),
      fullPage: true
    });
    console.log('✓ Full page screenshot saved\n');

    // Test checkout flow
    console.log('11. Testing checkout flow on mobile...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Select a size
    console.log('  - Tapping a size button...');
    const sizeButtonToClick = await page.locator('.size-btn').first();
    if (await sizeButtonToClick.isVisible()) {
      await sizeButtonToClick.tap();
      await page.waitForTimeout(500);
      console.log('  ✓ Size button tapped');

      await page.screenshot({
        path: path.join(screenshotDir, '6-size-selected.png'),
        fullPage: false
      });
    } else {
      issues.push('Could not find size button to tap');
      console.log('  ⚠ Size button not found');
    }

    // Tap Pre-Order button
    console.log('  - Tapping $19 Pre-Order button...');
    const preOrderBtn = await page.locator('button:has-text("Pre-Order")').first();
    if (await preOrderBtn.isVisible()) {
      await preOrderBtn.tap();
      await page.waitForTimeout(2000);
      console.log('  ✓ Pre-Order button tapped');

      // Check if popup appeared
      console.log('  - Checking for popup...');
      const popup = await page.locator('.popup, .modal, [role="dialog"]').first();
      const popupVisible = await popup.isVisible().catch(() => false);

      if (popupVisible) {
        console.log('  ✓ Popup appeared');

        await page.screenshot({
          path: path.join(screenshotDir, '7-popup-visible.png'),
          fullPage: false
        });

        // Check popup responsiveness
        const popupBox = await popup.boundingBox();
        if (popupBox) {
          if (popupBox.width > viewportWidth) {
            issues.push(`Popup wider than viewport: ${popupBox.width}px > ${viewportWidth}px`);
            console.log(`  ⚠ Popup too wide: ${popupBox.width}px`);
          } else {
            console.log(`  ✓ Popup fits within viewport (${popupBox.width}px)`);
          }
        }

        // Find and tap decline button
        console.log('  - Looking for decline button...');
        const declineButton = await page.locator('button:has-text("No"), button:has-text("Decline"), button:has-text("Skip"), .decline-btn, .popup-decline').first();

        if (await declineButton.isVisible()) {
          console.log('  ✓ Decline button found');
          await declineButton.tap();
          await page.waitForTimeout(2000);
          console.log('  ✓ Decline button tapped');

          await page.screenshot({
            path: path.join(screenshotDir, '8-after-decline.png'),
            fullPage: false
          });

          // Check if redirected
          const currentUrl = page.url();
          console.log(`  Current URL: ${currentUrl}`);

          if (currentUrl.includes('checkout') || currentUrl !== 'https://secrets-out-jeans-2024.netlify.app/') {
            console.log('  ✓ Redirect occurred');
          } else {
            console.log('  ℹ No redirect detected (may be expected behavior)');
          }
        } else {
          issues.push('Decline button not found in popup');
          console.log('  ⚠ Decline button not found');
        }
      } else {
        issues.push('Popup did not appear after tapping Pre-Order');
        console.log('  ⚠ Popup did not appear');
      }
    } else {
      issues.push('Pre-Order button not visible for testing');
      console.log('  ⚠ Pre-Order button not visible');
    }

    // Check for images
    console.log('\n12. Verifying images scale properly...');
    const images = await page.locator('img').all();
    console.log(`Found ${images.length} images`);

    let imageIssues = 0;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const isVisible = await img.isVisible();

      if (isVisible) {
        const imgBox = await img.boundingBox();
        if (imgBox && imgBox.width > viewportWidth) {
          imageIssues++;
          const src = await img.getAttribute('src');
          issues.push(`Image ${i + 1} wider than viewport: ${imgBox.width}px (src: ${src?.substring(0, 50)}...)`);
        }
      }
    }

    if (imageIssues === 0) {
      console.log('✓ All visible images scale properly');
    } else {
      console.log(`⚠ ${imageIssues} images exceed viewport width`);
    }

    // Check text readability
    console.log('\n13. Checking text readability...');
    const textElements = await page.locator('p, span, a, button').all();
    let smallTextCount = 0;

    for (const element of textElements.slice(0, 20)) {
      const fontSize = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseFloat(style.fontSize);
      });

      if (fontSize < 12) {
        smallTextCount++;
      }
    }

    if (smallTextCount > 0) {
      issues.push(`${smallTextCount} text elements have font size smaller than 12px`);
      console.log(`⚠ ${smallTextCount} text elements may be too small`);
    } else {
      console.log('✓ Text appears readable (font-size >= 12px)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('MOBILE RESPONSIVENESS TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`Screenshots saved to: ${screenshotDir}\n`);

    if (issues.length === 0) {
      console.log('✅ No issues found! Site is mobile-responsive.\n');
    } else {
      console.log(`⚠️  Found ${issues.length} issue(s):\n`);
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'error-screenshot.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

testMobileResponsiveness();
