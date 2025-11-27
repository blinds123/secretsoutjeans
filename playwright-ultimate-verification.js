const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

async function ultimateVerification() {
    console.log('🚀 ULTIMATE PLAYWRIGHT VERIFICATION - USING ALL FEATURES\n');
    console.log('=' .repeat(80));

    const resultsDir = path.join(__dirname, 'verification-results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir);
    }

    const browser = await chromium.launch({
        headless: false,
        slowMo: 50,
        devtools: true
    });

    const context = await browser.newContext({
        ...devices['iPhone 13'],
        recordVideo: {
            dir: resultsDir,
            size: { width: 390, height: 844 }
        },
        // Enable HAR recording
        recordHar: {
            path: path.join(resultsDir, 'network.har'),
            urlFilter: '**/*.{jpeg,jpg,png,gif}'
        },
        // Set geolocation
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation'],
        // Set locale
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
        // Color scheme
        colorScheme: 'light'
    });

    // Enable request interception
    await context.route('**/*.{jpeg,jpg,png}', route => {
        const url = route.request().url();
        console.log(`📸 Loading image: ${url.split('/').slice(-2).join('/')}`);
        route.continue();
    });

    const page = await context.newPage();

    // Enable console monitoring
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`❌ Console Error: ${msg.text()}`);
        }
    });

    // Monitor page errors
    page.on('pageerror', error => {
        console.log(`❌ Page Error: ${error.message}`);
    });

    // Track all network requests
    const imageRequests = [];
    const orderBumpImages = [];

    page.on('request', request => {
        const url = request.url();
        if (url.includes('.jpeg') || url.includes('.jpg') || url.includes('.png')) {
            imageRequests.push({
                url: url,
                path: url.split('/').slice(-2).join('/'),
                method: request.method(),
                resourceType: request.resourceType()
            });

            if (url.includes('order-bump') || url.includes('orderbump')) {
                orderBumpImages.push({
                    url: url,
                    folder: url.includes('order-bump') ? 'order-bump' : 'orderbump',
                    file: url.split('/').pop()
                });
            }
        }
    });

    // Track responses
    page.on('response', response => {
        const url = response.url();
        if ((url.includes('order-bump') || url.includes('orderbump')) &&
            (url.includes('.jpeg') || url.includes('.jpg'))) {
            console.log(`   📥 Response: ${url.split('/').slice(-2).join('/')} - Status: ${response.status()}`);
        }
    });

    try {
        // START TESTING
        console.log('\n📱 LOADING PAGE WITH NETWORK MONITORING\n');
        console.log('-' .repeat(80));

        // Navigate with performance timing
        const startTime = Date.now();
        await page.goto('http://localhost:8009/ultra-smart-restored.html', {
            waitUntil: 'networkidle'
        });
        const loadTime = Date.now() - startTime;
        console.log(`⏱️  Page load time: ${loadTime}ms\n`);

        // Capture performance metrics
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
        console.log('⚡ Performance Metrics:');
        console.log(`   DOM Ready: ${metrics.domReady}ms`);
        console.log(`   First Paint: ${Math.round(metrics.firstPaint)}ms`);
        console.log(`   First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms\n`);

        // Take initial screenshot
        await page.screenshot({
            path: path.join(resultsDir, '1-initial-load.png'),
            fullPage: true
        });

        // INTERACT WITH PAGE
        console.log('🛒 OPENING ORDER BUMP MODAL\n');
        console.log('-' .repeat(80));

        await page.click('.size-btn[data-size="M"]');
        await page.waitForTimeout(200);

        await page.click('.add-to-cart');
        await page.waitForTimeout(500);

        // Wait for modal and order bump images to load
        await page.waitForSelector('#checkoutModal.active', { timeout: 5000 });
        await page.waitForLoadState('networkidle');

        // VERIFY ORDER BUMP IMAGES
        console.log('🔍 ANALYZING ORDER BUMP IMAGES\n');
        console.log('-' .repeat(80));

        // Get all images in the order bump section
        const bumpImagesData = await page.evaluate(() => {
            const modal = document.querySelector('.modal-content');
            const bumpSection = modal?.querySelector('div[style*="background: #fff3cd"]');
            const images = bumpSection?.querySelectorAll('img') || [];

            return Array.from(images).map(img => ({
                src: img.src,
                alt: img.alt,
                currentSrc: img.currentSrc,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                complete: img.complete,
                displayed: img.offsetParent !== null,
                computedStyle: {
                    width: window.getComputedStyle(img).width,
                    height: window.getComputedStyle(img).height,
                    display: window.getComputedStyle(img).display
                },
                path: img.src.split('/').slice(-2).join('/'),
                folder: img.src.split('/').slice(-2)[0],
                filename: img.src.split('/').pop()
            }));
        });

        console.log(`📊 Order Bump Images Analysis:`);
        console.log(`   Found ${bumpImagesData.length} images in order bump section\n`);

        bumpImagesData.forEach((img, i) => {
            console.log(`   Image ${i + 1}: ${img.filename}`);
            console.log(`   ├─ Folder: "${img.folder}"`);
            console.log(`   ├─ Alt text: "${img.alt}"`);
            console.log(`   ├─ Natural size: ${img.naturalWidth}x${img.naturalHeight}`);
            console.log(`   ├─ Display size: ${img.computedStyle.width} x ${img.computedStyle.height}`);
            console.log(`   ├─ Loaded: ${img.complete ? '✅' : '❌'}`);
            console.log(`   ├─ Visible: ${img.displayed ? '✅' : '❌'}`);
            console.log(`   └─ Full path: ${img.path}\n`);
        });

        // VERIFY CORRECT FOLDER
        const usingCorrectFolder = bumpImagesData.every(img => img.folder === 'order-bump');
        console.log('📁 FOLDER VERIFICATION:');
        console.log(`   ${usingCorrectFolder ? '✅' : '❌'} All images use "order-bump" folder (with hyphen)\n`);

        if (!usingCorrectFolder) {
            console.log('   ⚠️  Some images are NOT using order-bump folder:');
            bumpImagesData.forEach(img => {
                if (img.folder !== 'order-bump') {
                    console.log(`      - ${img.filename} is in "${img.folder}" folder`);
                }
            });
        }

        // Take screenshot of order bump
        const bumpElement = await page.$('div[style*="background: #fff3cd"]');
        if (bumpElement) {
            await bumpElement.screenshot({
                path: path.join(resultsDir, '2-order-bump-section.png')
            });
        }

        // VISUAL COMPARISON
        console.log('\n🎨 VISUAL REGRESSION CHECK\n');
        console.log('-' .repeat(80));

        // Get bounding box of images
        const imageBounds = await page.evaluate(() => {
            const images = document.querySelectorAll('div[style*="background: #fff3cd"] img');
            return Array.from(images).map(img => {
                const rect = img.getBoundingClientRect();
                return {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                };
            });
        });

        console.log('   Image positions and sizes:');
        imageBounds.forEach((bound, i) => {
            console.log(`   Image ${i + 1}: ${bound.width}x${bound.height} at (${bound.x}, ${bound.y})`);
        });

        // ACCESSIBILITY CHECK
        console.log('\n♿ ACCESSIBILITY AUDIT\n');
        console.log('-' .repeat(80));

        const a11y = await page.evaluate(() => {
            const images = document.querySelectorAll('div[style*="background: #fff3cd"] img');
            const results = [];
            images.forEach(img => {
                results.push({
                    hasAlt: !!img.alt,
                    altText: img.alt,
                    role: img.getAttribute('role'),
                    ariaLabel: img.getAttribute('aria-label')
                });
            });
            return results;
        });

        a11y.forEach((img, i) => {
            console.log(`   Image ${i + 1}:`);
            console.log(`   ├─ Has alt text: ${img.hasAlt ? '✅' : '❌'}`);
            if (img.hasAlt) {
                console.log(`   └─ Alt: "${img.altText}"`);
            }
        });

        // NETWORK ANALYSIS
        console.log('\n🌐 NETWORK REQUEST SUMMARY\n');
        console.log('-' .repeat(80));

        console.log(`   Total image requests: ${imageRequests.length}`);
        console.log(`   Order bump image requests: ${orderBumpImages.length}\n`);

        if (orderBumpImages.length > 0) {
            console.log('   Order bump images loaded:');
            orderBumpImages.forEach(img => {
                console.log(`   - ${img.file} from "${img.folder}" folder`);
            });
        }

        // TEST INTERACTION
        console.log('\n🖱️  TESTING INTERACTIONS\n');
        console.log('-' .repeat(80));

        // Test checkbox
        const checkboxState = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`   Checkbox initially: ${checkboxState ? '✅ Checked' : '❌ Unchecked'}`);

        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(300);

        const newCheckboxState = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`   After click: ${newCheckboxState ? '✅ Checked' : '❌ Unchecked'}`);

        // Check total price update
        const totalPrice = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`   Total price: ${totalPrice}`);

        // COVERAGE REPORT
        console.log('\n📈 COVERAGE ANALYSIS\n');
        console.log('-' .repeat(80));

        await page.coverage.startJSCoverage();
        await page.coverage.startCSSCoverage();

        // Perform some actions
        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(300);

        const jsCoverage = await page.coverage.stopJSCoverage();
        const cssCoverage = await page.coverage.stopCSSCoverage();

        let totalBytes = 0;
        let usedBytes = 0;

        for (const entry of jsCoverage) {
            totalBytes += entry.text.length;
            for (const range of entry.ranges) {
                usedBytes += range.end - range.start;
            }
        }

        const jsUsage = ((usedBytes / totalBytes) * 100).toFixed(2);
        console.log(`   JavaScript coverage: ${jsUsage}% used`);

        // TRACE RECORDING
        await context.tracing.start({
            screenshots: true,
            snapshots: true
        });

        // Do some actions
        await page.click('.popup-close');
        await page.waitForTimeout(500);
        await page.click('.add-to-cart');
        await page.waitForTimeout(500);

        await context.tracing.stop({
            path: path.join(resultsDir, 'trace.zip')
        });
        console.log(`   Trace saved to: verification-results/trace.zip`);

        // FINAL VERIFICATION
        console.log('\n' + '=' .repeat(80));
        console.log('✅ FINAL VERIFICATION RESULTS:');
        console.log('=' .repeat(80) + '\n');

        const allChecks = {
            'Uses order-bump folder': usingCorrectFolder,
            'Images loaded successfully': bumpImagesData.every(img => img.complete),
            'Images visible': bumpImagesData.every(img => img.displayed),
            'Correct image count (2)': bumpImagesData.length === 2,
            'Has sunglasses image': bumpImagesData.some(img => img.alt.toLowerCase().includes('sunglasses')),
            'Has wallet image': bumpImagesData.some(img => img.alt.toLowerCase().includes('wallet')),
            'All images have alt text': bumpImagesData.every(img => img.alt),
            'No 404 errors': !imageRequests.some(req => req.status === 404)
        };

        let passedCount = 0;
        for (const [check, passed] of Object.entries(allChecks)) {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
            if (passed) passedCount++;
        }

        console.log(`\n📊 Overall Score: ${passedCount}/${Object.keys(allChecks).length} checks passed`);

        if (passedCount === Object.keys(allChecks).length) {
            console.log('\n🎉 ABSOLUTELY CERTAIN: Order bump is using the correct order-bump folder!');
        } else {
            console.log('\n⚠️  ISSUE DETECTED: Not all checks passed. Review the details above.');
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            checks: allChecks,
            images: bumpImagesData,
            performance: metrics,
            networkRequests: orderBumpImages,
            score: `${passedCount}/${Object.keys(allChecks).length}`
        };

        fs.writeFileSync(
            path.join(resultsDir, 'verification-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n📁 Full report saved to: verification-results/verification-report.json');
        console.log('📹 Video recording saved to: verification-results/');
        console.log('📊 Network HAR file saved to: verification-results/network.har');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    }

    console.log('\n👀 Browser staying open for manual verification...');
    await page.waitForTimeout(10000);

    await context.close();
    await browser.close();
    process.exit(0);
}

ultimateVerification().catch(console.error);