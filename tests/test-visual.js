/**
 * VISUAL REGRESSION TEST: Blue Sneaker Landing Page
 *
 * Tests visual and functional aspects:
 * 1. Takes screenshots of key pages/states
 * 2. Verifies button visibility and clickability
 * 3. Checks mobile responsive layout
 * 4. Verifies images load correctly
 * 5. Checks for console errors
 * 6. Tests key UI elements
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:8080';
const SCREENSHOTS_DIR = '/Users/nelsonchan/Downloads/Blue Sneaker lander/tests/screenshots';
const TIMEOUT = 30000;

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'mobile-iphone' },
  tablet: { width: 768, height: 1024, name: 'tablet-ipad' },
  desktop: { width: 1920, height: 1080, name: 'desktop-1080p' }
};

/**
 * Ensure screenshots directory exists
 */
async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshots directory:', error.message);
  }
}

/**
 * Check for console errors
 */
function setupConsoleMonitoring(page) {
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  return { errors, warnings };
}

/**
 * Test page loading and basic elements
 */
async function testPageLoad(page) {
  console.log('TEST 1: Page Load & Basic Elements');
  console.log('─────────────────────────────────────');

  const results = { passed: 0, failed: 0 };

  try {
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    console.log('✅ Page loaded successfully');
    results.passed++;
  } catch (error) {
    console.error('❌ Page failed to load:', error.message);
    results.failed++;
    return results;
  }

  // Check for key elements
  const checks = [
    { selector: 'button:has-text("COMPLETE PURCHASE")', name: 'Purchase Button' },
    { selector: 'h1, h2', name: 'Headings' },
    { selector: 'img', name: 'Images' },
    { selector: '[id*="price"], [class*="price"]', name: 'Price Display' }
  ];

  for (const check of checks) {
    try {
      const element = await page.locator(check.selector).first();
      const isVisible = await element.isVisible({ timeout: 5000 });
      if (isVisible) {
        console.log(`✅ ${check.name} visible`);
        results.passed++;
      } else {
        console.log(`❌ ${check.name} not visible`);
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name} not found`);
      results.failed++;
    }
  }

  console.log('');
  return results;
}

/**
 * Test button functionality
 */
async function testButtonFunctionality(page) {
  console.log('TEST 2: Button Visibility & Clickability');
  console.log('─────────────────────────────────────');

  const results = { passed: 0, failed: 0 };

  try {
    const button = await page.locator('button:has-text("COMPLETE PURCHASE")').first();

    // Check visibility
    const isVisible = await button.isVisible({ timeout: 5000 });
    if (isVisible) {
      console.log('✅ Button is visible');
      results.passed++;
    } else {
      console.log('❌ Button is not visible');
      results.failed++;
    }

    // Check enabled state
    const isEnabled = await button.isEnabled();
    if (isEnabled) {
      console.log('✅ Button is enabled');
      results.passed++;
    } else {
      console.log('❌ Button is disabled');
      results.failed++;
    }

    // Check bounding box (clickable area)
    const box = await button.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      console.log(`✅ Button has clickable area: ${Math.round(box.width)}x${Math.round(box.height)}px`);
      results.passed++;
    } else {
      console.log('❌ Button has no clickable area');
      results.failed++;
    }

    // Check button text
    const text = await button.textContent();
    if (text && text.includes('COMPLETE PURCHASE')) {
      console.log(`✅ Button text correct: "${text}"`);
      results.passed++;
    } else {
      console.log('❌ Button text incorrect');
      results.failed++;
    }

  } catch (error) {
    console.error('❌ Button test error:', error.message);
    results.failed++;
  }

  console.log('');
  return results;
}

/**
 * Test image loading
 */
async function testImageLoading(page) {
  console.log('TEST 3: Image Loading');
  console.log('─────────────────────────────────────');

  const results = { passed: 0, failed: 0 };

  try {
    // Get all images
    const images = await page.locator('img').all();
    console.log(`Found ${images.length} images on page`);

    let loadedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < Math.min(images.length, 20); i++) {
      const img = images[i];

      try {
        // Check if image is visible
        const isVisible = await img.isVisible({ timeout: 2000 });

        if (isVisible) {
          // Check natural dimensions (indicates successful load)
          const naturalWidth = await img.evaluate(el => el.naturalWidth);
          const naturalHeight = await img.evaluate(el => el.naturalHeight);

          if (naturalWidth > 0 && naturalHeight > 0) {
            loadedCount++;
          } else {
            failedCount++;
          }
        }
      } catch (error) {
        // Image not visible or errored
        failedCount++;
      }
    }

    console.log(`✅ Images loaded: ${loadedCount}`);
    if (failedCount > 0) {
      console.log(`⚠️  Images failed: ${failedCount}`);
    }

    if (loadedCount > 0) {
      results.passed++;
    }
    if (failedCount > 5) {
      results.failed++;
    }

  } catch (error) {
    console.error('❌ Image test error:', error.message);
    results.failed++;
  }

  console.log('');
  return results;
}

/**
 * Test responsive design across viewports
 */
async function testResponsiveDesign(browser) {
  console.log('TEST 4: Responsive Design (Multiple Viewports)');
  console.log('─────────────────────────────────────');

  const results = { passed: 0, failed: 0 };

  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n📱 Testing ${key} (${viewport.width}x${viewport.height})`);

    try {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${viewport.name}-home.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot: screenshots/${viewport.name}-home.png`);

      // Check button visibility on this viewport
      const button = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
      const isVisible = await button.isVisible({ timeout: 5000 });

      if (isVisible) {
        console.log(`✅ Button visible on ${key}`);
        results.passed++;
      } else {
        console.log(`❌ Button not visible on ${key}`);
        results.failed++;
      }

      await context.close();

    } catch (error) {
      console.error(`❌ Error testing ${key}:`, error.message);
      results.failed++;
    }
  }

  console.log('');
  return results;
}

/**
 * Take full page screenshots
 */
async function takeFullPageScreenshots(page) {
  console.log('TEST 5: Full Page Screenshots');
  console.log('─────────────────────────────────────');

  const results = { passed: 0, failed: 0 };

  const screenshots = [
    { name: 'full-page', action: null },
    { name: 'order-bump-checked', action: async () => {
      try {
        const checkbox = await page.locator('#orderBumpCheckbox').first();
        await checkbox.check({ timeout: 5000 });
      } catch (e) {}
    }}
  ];

  for (const shot of screenshots) {
    try {
      if (shot.action) {
        await shot.action();
      }

      const screenshotPath = path.join(SCREENSHOTS_DIR, `${shot.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot: screenshots/${shot.name}.png`);
      results.passed++;

    } catch (error) {
      console.error(`❌ Error taking ${shot.name} screenshot:`, error.message);
      results.failed++;
    }
  }

  console.log('');
  return results;
}

/**
 * Main test runner
 */
async function runVisualTests() {
  console.log('🧪 VISUAL REGRESSION TEST: Blue Sneaker Landing Page\n');
  console.log(`Testing site: ${SITE_URL}\n`);
  console.log('═══════════════════════════════════════\n');

  await ensureScreenshotsDir();

  let browser;
  const totalResults = { passed: 0, failed: 0 };
  let consoleErrors = [];
  let consoleWarnings = [];

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Setup console monitoring
    const monitoring = setupConsoleMonitoring(page);
    consoleErrors = monitoring.errors;
    consoleWarnings = monitoring.warnings;

    // Run tests
    const loadResults = await testPageLoad(page);
    totalResults.passed += loadResults.passed;
    totalResults.failed += loadResults.failed;

    const buttonResults = await testButtonFunctionality(page);
    totalResults.passed += buttonResults.passed;
    totalResults.failed += buttonResults.failed;

    const imageResults = await testImageLoading(page);
    totalResults.passed += imageResults.passed;
    totalResults.failed += imageResults.failed;

    const screenshotResults = await takeFullPageScreenshots(page);
    totalResults.passed += screenshotResults.passed;
    totalResults.failed += screenshotResults.failed;

    await context.close();

    // Test responsive design (creates new contexts)
    const responsiveResults = await testResponsiveDesign(browser);
    totalResults.passed += responsiveResults.passed;
    totalResults.failed += responsiveResults.failed;

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error.message, '\n');
    totalResults.failed++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print console errors summary
  if (consoleErrors.length > 0) {
    console.log('═══════════════════════════════════════');
    console.log('CONSOLE ERRORS DETECTED');
    console.log('═══════════════════════════════════════');
    consoleErrors.slice(0, 10).forEach(err => console.log(`❌ ${err}`));
    if (consoleErrors.length > 10) {
      console.log(`... and ${consoleErrors.length - 10} more errors`);
    }
    console.log('');
  }

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('VISUAL TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${totalResults.passed}`);
  console.log(`❌ Failed: ${totalResults.failed}`);
  console.log(`📊 Total:  ${totalResults.passed + totalResults.failed}`);
  console.log(`🐛 Console Errors: ${consoleErrors.length}`);
  console.log(`⚠️  Console Warnings: ${consoleWarnings.length}`);
  console.log(`🎯 Success Rate: ${Math.round((totalResults.passed / (totalResults.passed + totalResults.failed)) * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  // Exit with appropriate code
  const hasErrors = consoleErrors.length > 5; // Allow a few errors
  process.exit(totalResults.failed === 0 && !hasErrors ? 0 : 1);
}

// Run the tests
runVisualTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
