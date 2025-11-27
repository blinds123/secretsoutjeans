const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://pink-pilates-set.netlify.app';
const OUTPUT_DIR = '/Users/nelsonchan/Downloads/secretsoutjeans/secretjeans/output';
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'tests', 'screenshots');
const AGENTS_DIR = path.join(OUTPUT_DIR, 'agents');

// Ensure directories exist
[SCREENSHOTS_DIR, AGENTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const results = {
    checkout: { cors_error: false, redirect_works: false, errors: [] },
    mobile: { horizontal_scroll: false, touch_targets_ok: true, errors: [] },
    visual: { broken_images: [], overflow_elements: [], issues: [] },
    urgency_elements: { live_viewers: false, stock_scarcity: false, purchase_toast: false },
    screenshots: [],
    overall_status: 'ALL_PASS',
    fixes_needed: [],
    timestamp: new Date().toISOString()
};

async function runTests() {
    console.log('🚀 Starting Comprehensive QA Test Suite...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Capture console errors and CORS issues
    const consoleErrors = [];
    const corsErrors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log('❌ Console Error:', msg.text());
        }
    });

    page.on('requestfailed', request => {
        const failure = request.failure();
        if (failure && failure.errorText.includes('CORS')) {
            corsErrors.push({
                url: request.url(),
                error: failure.errorText
            });
            console.log('🚫 CORS Error:', request.url(), failure.errorText);
        }
    });

    try {
        // ===== TEST 1: PAGE LOAD =====
        console.log('📄 TEST 1: Page Load');
        await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Page loaded successfully');

        // Take desktop screenshot
        const desktopScreenshot = path.join(SCREENSHOTS_DIR, 'desktop-view.png');
        await page.screenshot({ path: desktopScreenshot, fullPage: true });
        results.screenshots.push(desktopScreenshot);
        console.log('📸 Desktop screenshot saved');

        // Wait for initial content
        await page.waitForTimeout(2000);

        // ===== TEST 2: URGENCY ELEMENTS CHECK =====
        console.log('\n🔥 TEST 2: Urgency Elements');

        // Check for live viewers counter
        const liveViewersExists = await page.locator('text=/\\d+ people are viewing this now/i').count() > 0 ||
                                   await page.locator('text=/live viewers/i').count() > 0 ||
                                   await page.locator('.live-viewers').count() > 0;
        results.urgency_elements.live_viewers = liveViewersExists;
        console.log(liveViewersExists ? '✅ Live viewers counter found' : '⚠️  Live viewers counter not found');

        // Check for stock scarcity
        const stockScarcityExists = await page.locator('text=/only \\d+ left/i').count() > 0 ||
                                     await page.locator('text=/low stock/i').count() > 0 ||
                                     await page.locator('text=/limited stock/i').count() > 0 ||
                                     await page.locator('.stock-warning').count() > 0;
        results.urgency_elements.stock_scarcity = stockScarcityExists;
        console.log(stockScarcityExists ? '✅ Stock scarcity warning found' : '⚠️  Stock scarcity warning not found');

        // Check for purchase toast container
        const purchaseToastExists = await page.locator('#purchaseToast').count() > 0 ||
                                     await page.locator('.purchase-toast').count() > 0 ||
                                     await page.locator('[id*="toast"]').count() > 0;
        results.urgency_elements.purchase_toast = purchaseToastExists;
        console.log(purchaseToastExists ? '✅ Purchase toast container found' : '⚠️  Purchase toast container not found');

        // ===== TEST 3: VISUAL CHECKS =====
        console.log('\n🎨 TEST 3: Visual Checks');

        // Check for broken images
        const images = await page.locator('img').all();
        console.log(`Found ${images.length} images to check`);

        for (const img of images) {
            try {
                const src = await img.getAttribute('src');
                const isVisible = await img.isVisible();
                const naturalWidth = await img.evaluate(el => el.naturalWidth);

                if (isVisible && naturalWidth === 0) {
                    results.visual.broken_images.push(src);
                    console.log(`❌ Broken image: ${src}`);
                }
            } catch (e) {
                // Ignore errors for individual images
            }
        }

        if (results.visual.broken_images.length === 0) {
            console.log('✅ All images loaded successfully');
        } else {
            results.visual.issues.push(`Found ${results.visual.broken_images.length} broken images`);
        }

        // Check for horizontal overflow on desktop
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = page.viewportSize().width;
        if (bodyWidth > viewportWidth) {
            results.visual.overflow_elements.push('body');
            results.visual.issues.push('Horizontal overflow detected on desktop');
            console.log(`⚠️  Horizontal overflow: body width ${bodyWidth}px > viewport ${viewportWidth}px`);
        } else {
            console.log('✅ No horizontal overflow on desktop');
        }

        // ===== TEST 4: MOBILE RESPONSIVENESS =====
        console.log('\n📱 TEST 4: Mobile Responsiveness');

        // Switch to mobile viewport (iPhone 12 Pro)
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(1000);

        // Take mobile screenshot
        const mobileScreenshot = path.join(SCREENSHOTS_DIR, 'mobile-view.png');
        await page.screenshot({ path: mobileScreenshot, fullPage: true });
        results.screenshots.push(mobileScreenshot);
        console.log('📸 Mobile screenshot saved');

        // Check for horizontal scroll on mobile
        const mobileBodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const mobileViewportWidth = page.viewportSize().width;

        if (mobileBodyWidth > mobileViewportWidth + 10) { // 10px tolerance
            results.mobile.horizontal_scroll = true;
            results.mobile.errors.push(`Horizontal scroll detected: ${mobileBodyWidth}px > ${mobileViewportWidth}px`);
            console.log(`❌ Horizontal scroll on mobile: ${mobileBodyWidth}px > ${mobileViewportWidth}px`);
        } else {
            console.log('✅ No horizontal scroll on mobile');
        }

        // Check touch target sizes
        const buttons = await page.locator('button, a[role="button"], .btn').all();
        const smallTouchTargets = [];

        for (const button of buttons) {
            try {
                const isVisible = await button.isVisible();
                if (isVisible) {
                    const box = await button.boundingBox();
                    if (box && (box.width < 44 || box.height < 44)) {
                        const text = await button.textContent();
                        smallTouchTargets.push({
                            text: text?.trim().substring(0, 50),
                            width: box.width,
                            height: box.height
                        });
                    }
                }
            } catch (e) {
                // Ignore errors for individual buttons
            }
        }

        if (smallTouchTargets.length > 0) {
            results.mobile.touch_targets_ok = false;
            results.mobile.errors.push(`Found ${smallTouchTargets.length} touch targets smaller than 44x44px`);
            console.log(`⚠️  Found ${smallTouchTargets.length} small touch targets`);
            smallTouchTargets.slice(0, 3).forEach(target => {
                console.log(`   - "${target.text}": ${target.width.toFixed(0)}x${target.height.toFixed(0)}px`);
            });
        } else {
            console.log('✅ All touch targets meet 44x44px minimum');
        }

        // Switch back to desktop for checkout test
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);

        // ===== TEST 5: CHECKOUT FLOW =====
        console.log('\n💳 TEST 5: Checkout Flow');

        // Look for checkout buttons ($19, $29, $59)
        const checkoutSelectors = [
            'button:has-text("$19")',
            'button:has-text("$29")',
            'button:has-text("$59")',
            'a:has-text("$19")',
            'a:has-text("$29")',
            'a:has-text("$59")',
            '.checkout-btn',
            '[data-price]',
            'button[onclick*="checkout"]'
        ];

        let checkoutButton = null;
        let checkoutButtonText = '';

        for (const selector of checkoutSelectors) {
            try {
                const button = page.locator(selector).first();
                const count = await button.count();
                if (count > 0) {
                    checkoutButton = button;
                    checkoutButtonText = await button.textContent();
                    console.log(`✅ Found checkout button: "${checkoutButtonText?.trim()}"`);
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }

        if (!checkoutButton) {
            results.checkout.errors.push('No checkout button found');
            console.log('❌ No checkout button found');
        } else {
            // Clear previous CORS errors
            corsErrors.length = 0;

            // Setup navigation listener
            let navigationOccurred = false;
            let targetUrl = '';

            page.on('framenavigated', frame => {
                if (frame === page.mainFrame()) {
                    navigationOccurred = true;
                    targetUrl = frame.url();
                }
            });

            // Click checkout button
            console.log('🖱️  Clicking checkout button...');
            await checkoutButton.click();

            // Wait for navigation or timeout
            try {
                await page.waitForTimeout(3000);

                if (navigationOccurred) {
                    console.log(`✅ Navigation occurred to: ${targetUrl}`);
                    results.checkout.redirect_works = true;

                    // Check if redirected to SimpleSwap
                    if (targetUrl.includes('simpleswap') || targetUrl.includes('render.com')) {
                        console.log('✅ Redirected to SimpleSwap exchange page');

                        // Take screenshot of exchange page
                        const exchangeScreenshot = path.join(SCREENSHOTS_DIR, 'exchange-page.png');
                        await page.screenshot({ path: exchangeScreenshot, fullPage: true });
                        results.screenshots.push(exchangeScreenshot);
                        console.log('📸 Exchange page screenshot saved');
                    } else {
                        results.checkout.errors.push(`Unexpected redirect target: ${targetUrl}`);
                        console.log(`⚠️  Redirected to unexpected URL: ${targetUrl}`);
                    }
                } else {
                    results.checkout.errors.push('No navigation occurred after clicking checkout');
                    console.log('❌ No navigation occurred after clicking checkout');
                }

                // Check for CORS errors
                if (corsErrors.length > 0) {
                    results.checkout.cors_error = true;
                    results.checkout.errors.push(`CORS errors detected: ${corsErrors.length}`);
                    console.log(`❌ CORS errors detected: ${corsErrors.length}`);
                    corsErrors.forEach(err => {
                        console.log(`   - ${err.url}: ${err.error}`);
                    });
                } else {
                    console.log('✅ No CORS errors detected');
                }

            } catch (e) {
                results.checkout.errors.push(`Error during checkout: ${e.message}`);
                console.log(`❌ Error during checkout: ${e.message}`);
            }
        }

        // ===== COMPILE RESULTS =====
        console.log('\n📊 COMPILING RESULTS...');

        // Add console errors to results
        if (consoleErrors.length > 0) {
            results.visual.issues.push(`Console errors: ${consoleErrors.length}`);
            console.log(`⚠️  Console errors: ${consoleErrors.length}`);
        }

        // Determine overall status
        if (results.checkout.cors_error) {
            results.overall_status = 'CORS_FIX_REQUIRED';
            results.fixes_needed.push('Fix CORS errors preventing checkout');
        }

        if (!results.checkout.redirect_works) {
            results.overall_status = 'FIXES_NEEDED';
            results.fixes_needed.push('Checkout redirect not working');
        }

        if (results.mobile.horizontal_scroll) {
            if (results.overall_status === 'ALL_PASS') {
                results.overall_status = 'FIXES_NEEDED';
            }
            results.fixes_needed.push('Fix horizontal scrolling on mobile');
        }

        if (!results.mobile.touch_targets_ok) {
            if (results.overall_status === 'ALL_PASS') {
                results.overall_status = 'FIXES_NEEDED';
            }
            results.fixes_needed.push('Increase touch target sizes for mobile');
        }

        if (results.visual.broken_images.length > 0) {
            if (results.overall_status === 'ALL_PASS') {
                results.overall_status = 'FIXES_NEEDED';
            }
            results.fixes_needed.push(`Fix ${results.visual.broken_images.length} broken images`);
        }

        if (!results.urgency_elements.live_viewers ||
            !results.urgency_elements.stock_scarcity ||
            !results.urgency_elements.purchase_toast) {
            if (results.overall_status === 'ALL_PASS') {
                results.overall_status = 'FIXES_NEEDED';
            }
            results.fixes_needed.push('Add missing urgency elements (live viewers, stock scarcity, purchase toast)');
        }

        // Write results to file
        const resultsPath = path.join(AGENTS_DIR, 'unified-qa.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n✅ Results written to: ${resultsPath}`);

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Overall Status: ${results.overall_status}`);
        console.log(`\n✅ PASSED:`);
        console.log(`   - Page loads successfully`);
        console.log(`   - ${results.screenshots.length} screenshots captured`);
        if (!results.checkout.cors_error) console.log(`   - No CORS errors`);
        if (results.checkout.redirect_works) console.log(`   - Checkout redirect works`);
        if (!results.mobile.horizontal_scroll) console.log(`   - No horizontal scroll on mobile`);
        if (results.mobile.touch_targets_ok) console.log(`   - Touch targets meet minimum size`);
        if (results.visual.broken_images.length === 0) console.log(`   - All images load correctly`);

        if (results.fixes_needed.length > 0) {
            console.log(`\n⚠️  FIXES NEEDED (${results.fixes_needed.length}):`);
            results.fixes_needed.forEach((fix, i) => {
                console.log(`   ${i + 1}. ${fix}`);
            });
        }

        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
        results.overall_status = 'TEST_FAILED';
        results.fixes_needed.push(`Critical test error: ${error.message}`);

        // Still try to save results
        const resultsPath = path.join(AGENTS_DIR, 'unified-qa.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    } finally {
        await browser.close();
    }
}

// Run tests
runTests().then(() => {
    console.log('\n✅ QA Test Suite Complete');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
});
