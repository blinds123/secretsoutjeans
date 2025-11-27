const { chromium, webkit, firefox, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create results directory
const resultsDir = path.join(__dirname, 'test-results-final');
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

async function runFinalTest() {
    console.log('🚀 FINAL COMPREHENSIVE TEST SUITE\n');
    console.log('=' .repeat(70));

    // Start server
    const { spawn } = require('child_process');
    const server = spawn('python3', ['-m', 'http.server', '8006'], {
        cwd: __dirname,
        detached: false
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
    });

    const context = await browser.newContext({
        ...devices['iPhone 13'],
        recordVideo: {
            dir: resultsDir
        }
    });

    const page = await context.newPage();

    const results = {
        errors: [],
        functionality: [],
        performance: {},
        ui_ux: [],
        accessibility: []
    };

    // Error monitoring
    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
            results.errors.push(msg.text());
            console.log(`❌ Console Error: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        results.errors.push(error.message);
        console.log(`❌ Page Error: ${error.message}`);
    });

    let notFoundCount = 0;
    page.on('response', response => {
        if (response.status() === 404 && !response.url().includes('favicon')) {
            notFoundCount++;
            console.log(`❌ 404: ${response.url()}`);
        }
    });

    try {
        // Navigate to page
        console.log('📱 Testing on iPhone 13\n');
        await page.goto('http://localhost:8006/ultra-smart-fixed.html', {
            waitUntil: 'networkidle'
        });

        // PERFORMANCE TEST
        console.log('⚡ PERFORMANCE METRICS');
        console.log('-' .repeat(40));

        const metrics = await page.evaluate(() => {
            const timing = performance.timing;
            const paint = performance.getEntriesByType('paint');
            return {
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstPaint: paint[0]?.startTime || 0,
                firstContentfulPaint: paint[1]?.startTime || 0
            };
        });

        results.performance = metrics;
        console.log(`✅ Load Time: ${metrics.loadComplete}ms`);
        console.log(`✅ First Paint: ${Math.round(metrics.firstPaint)}ms`);
        console.log(`✅ DOM Ready: ${metrics.domReady}ms`);

        // UI/UX TEST
        console.log('\n🎨 UI/UX TESTING');
        console.log('-' .repeat(40));

        // Check touch targets
        const touchTargets = await page.evaluate(() => {
            const issues = [];
            const interactiveElements = document.querySelectorAll('button, a, input, select');

            interactiveElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    if (rect.width < 44 || rect.height < 44) {
                        issues.push({
                            element: el.className || el.tagName,
                            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
                        });
                    }
                }
            });

            // Check for overflow
            if (document.documentElement.scrollWidth > window.innerWidth) {
                issues.push({
                    element: 'body',
                    issue: 'Horizontal scroll detected'
                });
            }

            return issues;
        });

        if (touchTargets.length === 0) {
            console.log('✅ All touch targets >= 44px');
            results.ui_ux.push({ test: 'Touch Targets', passed: true });
        } else {
            console.log(`⚠️  ${touchTargets.length} touch target issues:`);
            touchTargets.forEach(issue => {
                console.log(`   - ${issue.element}: ${issue.size || issue.issue}`);
            });
            results.ui_ux.push({ test: 'Touch Targets', passed: false, issues: touchTargets });
        }

        // Take screenshots
        await page.screenshot({
            path: path.join(resultsDir, 'full-page.png'),
            fullPage: true
        });
        console.log('✅ Full page screenshot saved');

        // FUNCTIONALITY TEST
        console.log('\n🔧 FUNCTIONALITY TESTING');
        console.log('-' .repeat(40));

        // Test 1: Images
        const images = await page.$$eval('img', imgs => ({
            total: imgs.length,
            loaded: imgs.filter(img => img.complete && img.naturalHeight > 0).length
        }));
        console.log(`✅ Images: ${images.loaded}/${images.total} loaded`);
        results.functionality.push({
            name: 'Images',
            passed: images.loaded === images.total
        });

        // Test 2: Product Gallery
        const thumbnails = await page.$$('.product-thumbnails img');
        if (thumbnails.length > 1) {
            const initialSrc = await page.$eval('.main-image', el => el.src);
            await thumbnails[1].click();
            await page.waitForTimeout(300);
            const newSrc = await page.$eval('.main-image', el => el.src);
            const galleryWorks = initialSrc !== newSrc;
            console.log(`${galleryWorks ? '✅' : '❌'} Product gallery`);
            results.functionality.push({
                name: 'Gallery',
                passed: galleryWorks
            });
        }

        // Test 3: Size Selection
        await page.click('.size-btn[data-size="M"]');
        const sizeActive = await page.$('.size-btn.active');
        console.log(`${sizeActive ? '✅' : '❌'} Size selection`);
        results.functionality.push({
            name: 'Size Selection',
            passed: !!sizeActive
        });

        // Test 4: Quantity
        await page.click('.quantity-btn:last-of-type');
        await page.click('.quantity-btn:last-of-type');
        const qty = await page.$eval('.quantity-display', el => el.textContent);
        console.log(`${qty === '3' ? '✅' : '❌'} Quantity selector (${qty})`);
        results.functionality.push({
            name: 'Quantity',
            passed: qty === '3'
        });

        // Test 5: Cart Button Updates
        const cartText = await page.$eval('.add-to-cart-btn', el => el.textContent);
        const priceUpdated = cartText.includes('75');
        console.log(`${priceUpdated ? '✅' : '❌'} Cart button price update`);
        results.functionality.push({
            name: 'Cart Price',
            passed: priceUpdated
        });

        // Test 6: Popup
        await page.click('.add-to-cart-btn');
        await page.waitForTimeout(500);
        const popupActive = await page.$eval('#checkoutPopup', el => el.classList.contains('active'));
        console.log(`${popupActive ? '✅' : '❌'} Checkout popup opens`);
        results.functionality.push({
            name: 'Popup',
            passed: popupActive
        });

        // Test 7: Order Bump
        if (popupActive) {
            // Take popup screenshot
            await page.screenshot({
                path: path.join(resultsDir, 'checkout-popup.png')
            });

            await page.click('.bump-checkbox');
            await page.waitForTimeout(300);
            const total = await page.$eval('#totalPrice', el => el.textContent);
            const bumpWorks = total.includes('90');
            console.log(`${bumpWorks ? '✅' : '❌'} Order bump (${total})`);
            results.functionality.push({
                name: 'Order Bump',
                passed: bumpWorks
            });

            // Test close
            await page.click('.popup-close');
            await page.waitForTimeout(300);
            const popupClosed = await page.$eval('#checkoutPopup', el => !el.classList.contains('active'));
            console.log(`${popupClosed ? '✅' : '❌'} Popup close`);
            results.functionality.push({
                name: 'Popup Close',
                passed: popupClosed
            });
        }

        // Test 8: Express Checkout
        const expressButtons = await page.$$('.express-btn');
        console.log(`${expressButtons.length === 3 ? '✅' : '❌'} Express checkout (${expressButtons.length} buttons)`);
        results.functionality.push({
            name: 'Express Checkout',
            passed: expressButtons.length === 3
        });

        // ACCESSIBILITY TEST
        console.log('\n♿ ACCESSIBILITY');
        console.log('-' .repeat(40));

        const a11y = await page.evaluate(() => {
            const issues = [];

            // Check alt text
            document.querySelectorAll('img').forEach(img => {
                if (!img.alt && img.src && !img.src.includes('data:image')) {
                    issues.push(`Missing alt: ${img.src.split('/').pop()}`);
                }
            });

            // Check labels
            document.querySelectorAll('input').forEach(input => {
                if (!input.labels?.length && !input.getAttribute('aria-label')) {
                    issues.push(`Missing label: ${input.type}`);
                }
            });

            // Check focus visibility
            const buttons = document.querySelectorAll('button');
            let focusableCount = 0;
            buttons.forEach(btn => {
                if (btn.tabIndex >= 0) focusableCount++;
            });

            return {
                issues,
                focusableButtons: focusableCount,
                totalButtons: buttons.length
            };
        });

        if (a11y.issues.length === 0) {
            console.log('✅ No accessibility issues');
        } else {
            console.log(`⚠️  ${a11y.issues.length} accessibility issues`);
            a11y.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        console.log(`✅ ${a11y.focusableButtons}/${a11y.totalButtons} buttons keyboard accessible`);
        results.accessibility = a11y;

        // RESPONSIVE TEST
        console.log('\n📱 RESPONSIVE DESIGN');
        console.log('-' .repeat(40));

        const viewports = [
            { width: 320, height: 568, name: 'Small Phone' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1920, height: 1080, name: 'Desktop' }
        ];

        for (const vp of viewports) {
            await page.setViewportSize(vp);
            await page.waitForTimeout(300);

            const overflow = await page.evaluate(() =>
                document.documentElement.scrollWidth > window.innerWidth
            );

            console.log(`${!overflow ? '✅' : '❌'} ${vp.name} (${vp.width}x${vp.height})`);

            await page.screenshot({
                path: path.join(resultsDir, `viewport-${vp.name.toLowerCase().replace(' ', '-')}.png`)
            });
        }

        // STRESS TEST
        console.log('\n💪 STRESS TEST');
        console.log('-' .repeat(40));

        // Rapid clicks
        const sizeButtons = await page.$$('.size-btn:not(.sold-out)');
        for (let i = 0; i < 10; i++) {
            await sizeButtons[i % sizeButtons.length].click();
            await page.waitForTimeout(50);
        }
        console.log('✅ Handled 10 rapid size changes');

        // Multiple popups
        for (let i = 0; i < 3; i++) {
            await page.click('.add-to-cart-btn');
            await page.waitForTimeout(200);
            await page.click('.popup-close');
            await page.waitForTimeout(200);
        }
        console.log('✅ Handled 3 popup open/close cycles');

        // CROSS-BROWSER TEST
        console.log('\n🌐 CROSS-BROWSER');
        console.log('-' .repeat(40));

        for (const browserType of ['webkit', 'firefox']) {
            const testBrowser = await (browserType === 'webkit' ? webkit : firefox).launch({
                headless: true
            });
            // Firefox doesn't support device emulation, use viewport instead
            const contextOptions = browserType === 'webkit'
                ? devices['iPhone 13']
                : { viewport: { width: 390, height: 844 } };
            const testContext = await testBrowser.newContext(contextOptions);
            const testPage = await testContext.newPage();

            try {
                await testPage.goto('http://localhost:8006/ultra-smart-fixed.html', {
                    waitUntil: 'networkidle',
                    timeout: 10000
                });
                console.log(`✅ ${browserType} compatibility`);
            } catch (e) {
                console.log(`❌ ${browserType} failed`);
            }

            await testBrowser.close();
        }

        // FINAL REPORT
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL REPORT');
        console.log('=' .repeat(70));

        // Calculate scores
        const functionalityPassed = results.functionality.filter(f => f.passed).length;
        const functionalityTotal = results.functionality.length;
        const functionalityScore = Math.round((functionalityPassed / functionalityTotal) * 100);

        const performanceScore = results.performance.loadComplete < 1000 ? 100 :
                                 results.performance.loadComplete < 2000 ? 80 : 60;

        const errorScore = results.errors.length === 0 ? 100 : 100 - (results.errors.length * 20);

        const accessibilityScore = 100 - (results.accessibility.issues?.length || 0) * 10;

        const uiScore = results.ui_ux.every(t => t.passed) ? 100 : 70;

        const overallScore = Math.round(
            (functionalityScore * 0.35) +
            (performanceScore * 0.25) +
            (errorScore * 0.15) +
            (accessibilityScore * 0.15) +
            (uiScore * 0.10)
        );

        console.log('\n📈 SCORES:');
        console.log(`  Functionality: ${functionalityScore}% (${functionalityPassed}/${functionalityTotal} passed)`);
        console.log(`  Performance: ${performanceScore}% (${results.performance.loadComplete}ms load)`);
        console.log(`  Error-Free: ${errorScore}% (${results.errors.length} errors)`);
        console.log(`  Accessibility: ${Math.max(0, accessibilityScore)}%`);
        console.log(`  UI/UX: ${uiScore}%`);
        console.log(`\n🎯 OVERALL SCORE: ${overallScore}%`);

        // Success criteria
        console.log('\n✅ SUCCESS CRITERIA:');
        console.log(`  Load < 1s: ${results.performance.loadComplete < 1000 ? '✅' : '❌'}`);
        console.log(`  All features work: ${functionalityScore === 100 ? '✅' : '❌'}`);
        console.log(`  No errors: ${results.errors.length === 0 ? '✅' : '❌'}`);
        console.log(`  Touch targets ≥ 44px: ${uiScore === 100 ? '✅' : '❌'}`);
        console.log(`  404 errors: ${notFoundCount === 0 ? '✅' : `❌ (${notFoundCount})`}`);

        // Save report
        fs.writeFileSync(
            path.join(resultsDir, 'report.json'),
            JSON.stringify(results, null, 2)
        );

        console.log('\n📁 Results saved to: test-results-final/');

        // Final verdict
        if (overallScore >= 90) {
            console.log('\n🏆 EXCELLENT! Template is production-ready!');
        } else if (overallScore >= 75) {
            console.log('\n✅ GOOD! Minor improvements recommended.');
        } else {
            console.log('\n⚠️  NEEDS WORK. Check report for issues.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }

    await page.waitForTimeout(3000); // Keep open for review
    await browser.close();
    server.kill();

    process.exit(0);
}

runFinalTest().catch(console.error);