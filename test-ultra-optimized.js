const { chromium, devices } = require('playwright');

async function testUltraOptimized() {
    console.log('🚀 ULTRA-OPTIMIZED TEMPLATE TEST SUITE\n');
    console.log('=' .repeat(70));

    const browser = await chromium.launch({
        headless: false, // Show browser for verification
        slowMo: 50 // Slow down slightly for visibility
    });

    // Test on mobile viewport (most critical)
    const context = await browser.newContext({
        ...devices['iPhone 13'],
        permissions: ['geolocation']
    });

    const page = await context.newPage();

    const testResults = {
        performance: [],
        functionality: [],
        errors: []
    };

    // Monitor console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            testResults.errors.push(msg.text());
            console.log(`❌ Console Error: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        testResults.errors.push(error.message);
        console.log(`❌ Page Error: ${error.message}`);
    });

    try {
        console.log('📱 Testing on iPhone 13 viewport\n');

        // PERFORMANCE TEST
        console.log('⚡ PERFORMANCE TESTS');
        console.log('-' .repeat(40));

        const startTime = Date.now();

        await page.goto('http://localhost:8004/ultra-smart-fixed.html', {
            waitUntil: 'networkidle'
        });

        const loadTime = Date.now() - startTime;

        const metrics = await page.evaluate(() => {
            const timing = performance.timing;
            const paint = performance.getEntriesByType('paint');
            return {
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: paint[0]?.startTime || 0,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                requests: performance.getEntriesByType('resource').length
            };
        });

        // Check network requests
        const failedRequests = [];
        page.on('response', response => {
            if (response.status() === 404) {
                failedRequests.push(response.url());
            }
        });

        // Performance assertions
        console.log(`✅ Page Load Time: ${loadTime}ms ${loadTime < 1000 ? '✅' : '⚠️'}`);
        console.log(`✅ First Paint: ${Math.round(metrics.firstPaint)}ms ${metrics.firstPaint < 200 ? '✅' : '⚠️'}`);
        console.log(`✅ DOM Ready: ${metrics.domReady}ms ${metrics.domReady < 500 ? '✅' : '⚠️'}`);
        console.log(`✅ HTTP Requests: ${metrics.requests} ${metrics.requests < 15 ? '✅' : '⚠️'}`);
        console.log(`✅ 404 Errors: ${failedRequests.length} ${failedRequests.length === 0 ? '✅' : '❌'}`);

        testResults.performance.push({
            loadTime,
            firstPaint: metrics.firstPaint,
            domReady: metrics.domReady,
            requests: metrics.requests,
            errors404: failedRequests.length
        });

        // FUNCTIONALITY TESTS
        console.log('\n🧪 FUNCTIONALITY TESTS');
        console.log('-' .repeat(40));

        // Test 1: Images Load
        console.log('\n1️⃣ Image Loading...');
        const imagesLoaded = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img:not(.lazy)'));
            return {
                total: images.length,
                loaded: images.filter(img => img.complete && img.naturalHeight > 0).length
            };
        });
        console.log(`   Images: ${imagesLoaded.loaded}/${imagesLoaded.total} loaded ${imagesLoaded.loaded === imagesLoaded.total ? '✅' : '❌'}`);

        // Test 2: Thumbnail Gallery
        console.log('\n2️⃣ Thumbnail Gallery...');
        const thumbnails = await page.$$('.product-thumbnails img');
        if (thumbnails.length > 1) {
            const initialSrc = await page.$eval('.main-image', el => el.src);
            await thumbnails[1].click();
            await page.waitForTimeout(300);
            const newSrc = await page.$eval('.main-image', el => el.src);
            const galleryWorks = initialSrc !== newSrc;
            console.log(`   Gallery: ${galleryWorks ? '✅ Working' : '❌ Not working'}`);
            testResults.functionality.push({ feature: 'gallery', working: galleryWorks });
        }

        // Test 3: Size Selection
        console.log('\n3️⃣ Size Selector...');
        await page.click('.size-btn[data-size="M"]');
        const sizeSelected = await page.evaluate(() => {
            return document.querySelector('.size-btn.active')?.dataset.size === 'M';
        });
        console.log(`   Size Selection: ${sizeSelected ? '✅ Working' : '❌ Not working'}`);
        testResults.functionality.push({ feature: 'size', working: sizeSelected });

        // Test 4: Quantity Selector
        console.log('\n4️⃣ Quantity Selector...');
        const plusBtn = await page.$('.quantity-btn:last-of-type');
        await plusBtn.click();
        await plusBtn.click();
        const quantity = await page.$eval('.quantity-display', el => el.textContent);
        const qtyWorks = quantity === '3';
        console.log(`   Quantity: ${qtyWorks ? '✅ Working (qty=' + quantity + ')' : '❌ Not working'}`);
        testResults.functionality.push({ feature: 'quantity', working: qtyWorks });

        // Test 5: Add to Cart Button Updates
        console.log('\n5️⃣ Cart Button Update...');
        const btnText = await page.$eval('.add-to-cart-btn', el => el.textContent);
        const btnUpdates = btnText.includes('75'); // 3 * $25
        console.log(`   Button Updates: ${btnUpdates ? '✅ Shows $75' : '❌ Not updating'}`);
        testResults.functionality.push({ feature: 'cartButton', working: btnUpdates });

        // Test 6: Add to Cart Opens Popup
        console.log('\n6️⃣ Checkout Popup...');
        await page.click('.add-to-cart-btn');
        await page.waitForTimeout(500);
        const popupVisible = await page.evaluate(() => {
            const popup = document.getElementById('checkoutPopup');
            return popup?.classList.contains('active');
        });
        console.log(`   Popup Opens: ${popupVisible ? '✅ Working' : '❌ Not working'}`);
        testResults.functionality.push({ feature: 'popup', working: popupVisible });

        // Test 7: Order Bump
        console.log('\n7️⃣ Order Bump...');
        if (popupVisible) {
            await page.click('.bump-checkbox');
            await page.waitForTimeout(300);
            const bumpChecked = await page.$eval('.bump-checkbox', el => el.checked);
            const totalUpdated = await page.$eval('#totalPrice', el => el.textContent);
            const bumpWorks = bumpChecked && totalUpdated.includes('90'); // $75 + $15
            console.log(`   Order Bump: ${bumpWorks ? '✅ Working (total=$90)' : '❌ Not working'}`);
            testResults.functionality.push({ feature: 'orderBump', working: bumpWorks });
        }

        // Test 8: Express Checkout Buttons
        console.log('\n8️⃣ Express Checkout...');
        const expressButtons = await page.$$('.express-btn');
        console.log(`   Express Buttons: ${expressButtons.length === 3 ? '✅ All 3 present' : '❌ Missing buttons'}`);
        testResults.functionality.push({ feature: 'expressCheckout', working: expressButtons.length === 3 });

        // Test 9: Form Validation
        console.log('\n9️⃣ Form Validation...');
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
            await emailInput.fill('invalid-email');
            await page.click('.checkout-btn');
            await page.waitForTimeout(300);
            const validationWorks = await page.evaluate(() => {
                const input = document.querySelector('input[type="email"]');
                return !input.validity.valid;
            });
            console.log(`   Email Validation: ${validationWorks ? '✅ Working' : '❌ Not working'}`);
            testResults.functionality.push({ feature: 'validation', working: validationWorks });
        }

        // Test 10: Close Popup
        console.log('\n🔟 Popup Close...');
        await page.click('.popup-close');
        await page.waitForTimeout(300);
        const popupClosed = await page.evaluate(() => {
            return !document.getElementById('checkoutPopup')?.classList.contains('active');
        });
        console.log(`   Popup Closes: ${popupClosed ? '✅ Working' : '❌ Not working'}`);
        testResults.functionality.push({ feature: 'popupClose', working: popupClosed });

        // Test 11: Mobile Responsiveness
        console.log('\n📱 Mobile Responsiveness...');
        const mobileCheck = await page.evaluate(() => {
            const body = document.body;
            const htmlWidth = document.documentElement.scrollWidth;
            const viewportWidth = window.innerWidth;
            return {
                noHorizontalScroll: htmlWidth <= viewportWidth,
                viewportWidth,
                pageWidth: htmlWidth
            };
        });
        console.log(`   No Horizontal Scroll: ${mobileCheck.noHorizontalScroll ? '✅' : '❌'}`);
        testResults.functionality.push({ feature: 'mobileResponsive', working: mobileCheck.noHorizontalScroll });

        // Test 12: Lazy Loading
        console.log('\n🖼️ Lazy Loading...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        const lazyLoaded = await page.evaluate(() => {
            const lazyImages = document.querySelectorAll('.testimonial-grid img');
            return Array.from(lazyImages).filter(img => img.classList.contains('loaded')).length;
        });
        console.log(`   Lazy Images Loaded: ${lazyLoaded} ${lazyLoaded > 0 ? '✅' : '⚠️'}`);

        // ERROR CHECK
        console.log('\n❌ ERROR CHECK');
        console.log('-' .repeat(40));
        console.log(`   Console Errors: ${testResults.errors.length} ${testResults.errors.length === 0 ? '✅ None' : '❌ Found errors'}`);

        // FINAL REPORT
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL REPORT');
        console.log('=' .repeat(70));

        const functionalityScore = testResults.functionality.filter(t => t.working).length;
        const totalTests = testResults.functionality.length;
        const percentage = Math.round((functionalityScore / totalTests) * 100);

        console.log(`\n✅ Functionality Score: ${functionalityScore}/${totalTests} (${percentage}%)`);
        console.log(`⚡ Load Time: ${loadTime}ms`);
        console.log(`❌ Errors: ${testResults.errors.length}`);

        // Success Criteria
        const success = {
            functionality: percentage >= 90,
            performance: loadTime < 1000,
            noErrors: testResults.errors.length === 0
        };

        console.log('\n🎯 SUCCESS CRITERIA:');
        console.log(`   Functionality > 90%: ${success.functionality ? '✅' : '❌'}`);
        console.log(`   Load Time < 1s: ${success.performance ? '✅' : '❌'}`);
        console.log(`   Zero Errors: ${success.noErrors ? '✅' : '❌'}`);

        if (success.functionality && success.performance && success.noErrors) {
            console.log('\n🏆 PERFECT! Template is ultra-optimized and fully functional!');
        } else {
            console.log('\n⚠️ Some optimizations still needed');
        }

        // List failed features
        const failed = testResults.functionality.filter(t => !t.working);
        if (failed.length > 0) {
            console.log('\nFailed Features:');
            failed.forEach(f => console.log(`   - ${f.feature}`));
        }

    } catch (error) {
        console.error('Test execution error:', error);
    }

    // Keep browser open for manual verification
    console.log('\n👀 Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);

    await browser.close();
    process.exit(0);
}

testUltraOptimized().catch(console.error);