const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false }); // Show browser for debugging
    const context = await browser.newContext();
    const page = await context.newPage();

    // Track all network requests
    const allRequests = [];
    const failedRequests = [];
    const successfulImages = [];

    page.on('request', request => {
        const url = request.url();
        allRequests.push(url);
        if (url.includes('manifest.json')) {
            console.log(`📦 Manifest request: ${url}`);
        }
    });

    page.on('response', response => {
        const url = response.url();
        const status = response.status();

        if (url.includes('manifest.json')) {
            console.log(`📦 Manifest response: ${status} - ${url}`);
        }

        if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
            if (status === 404) {
                failedRequests.push(url);
                console.log(`❌ 404 Error: ${url}`);
            } else if (status === 200) {
                successfulImages.push(url);
                console.log(`✅ Loaded: ${url.split('/').pop()}`);
            }
        }
    });

    // Monitor console logs and errors
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Manifest') || text.includes('Smart') || text.includes('Error')) {
            console.log(`📋 Page Console: ${text}`);
        }
    });

    page.on('pageerror', error => {
        console.log(`❌ Page Error: ${error.message}`);
    });

    console.log('🚀 Testing manifest-based image loading...\n');

    // Navigate to the page
    try {
        await page.goto('http://localhost:8001/ultra-smart.html', {
            waitUntil: 'networkidle'
        });
    } catch (error) {
        console.error('Failed to navigate:', error);
    }

    // Wait for images to load
    await page.waitForTimeout(3000);

    // Get page HTML structure
    const pageStructure = await page.evaluate(() => {
        return {
            hasSmartImageLoader: !!window.SmartImageLoader,
            manifestLoaded: window.SmartImageLoader ? window.SmartImageLoader.manifest : null,
            testimonialContainer: !!document.querySelector('.testimonial-grid'),
            productContainer: !!document.querySelector('.product-container'),
            favoritesContainer: !!document.querySelector('.favorites-row')
        };
    });

    console.log('\n📄 Page Structure:');
    console.log('  - SmartImageLoader exists:', pageStructure.hasSmartImageLoader);
    console.log('  - Manifest loaded:', !!pageStructure.manifestLoaded);
    console.log('  - Has testimonial container:', pageStructure.testimonialContainer);
    console.log('  - Has product container:', pageStructure.productContainer);
    console.log('  - Has favorites container:', pageStructure.favoritesContainer);

    if (pageStructure.manifestLoaded) {
        console.log('\n📦 Manifest Contents:');
        console.log('  - Product images:', pageStructure.manifestLoaded.product?.length || 0);
        console.log('  - Testimonial images:', pageStructure.manifestLoaded.testimonials?.length || 0);
        console.log('  - Favorites images:', pageStructure.manifestLoaded['worn-by-favorites']?.length || 0);
    }

    // Check actual images in DOM
    const domImages = await page.evaluate(() => {
        const allImgs = Array.from(document.querySelectorAll('img'));
        return {
            total: allImgs.length,
            loaded: allImgs.filter(img => img.complete && img.naturalHeight !== 0).length,
            failed: allImgs.filter(img => img.complete && img.naturalHeight === 0).length,
            pending: allImgs.filter(img => !img.complete).length,
            testimonialImages: Array.from(document.querySelectorAll('.testimonial-grid img')).map(img => ({
                src: img.src,
                loaded: img.complete && img.naturalHeight !== 0
            })),
            productImages: Array.from(document.querySelectorAll('.main-image, .product-thumbnails img')).map(img => ({
                src: img.src,
                loaded: img.complete && img.naturalHeight !== 0
            }))
        };
    });

    console.log('\n🖼️ DOM Images:');
    console.log(`  - Total images: ${domImages.total}`);
    console.log(`  - Loaded: ${domImages.loaded}`);
    console.log(`  - Failed: ${domImages.failed}`);
    console.log(`  - Pending: ${domImages.pending}`);

    // Report network results
    console.log('\n📊 Network Results:');
    console.log(`  - Total requests: ${allRequests.length}`);
    console.log(`  - Successful images: ${successfulImages.length}`);
    console.log(`  - Failed requests (404s): ${failedRequests.length}`);

    if (domImages.testimonialImages.length > 0) {
        console.log(`\n💬 Testimonial Images (${domImages.testimonialImages.filter(img => img.loaded).length}/${domImages.testimonialImages.length} loaded):`);
        domImages.testimonialImages.slice(0, 3).forEach(img => {
            console.log(`  - ${img.loaded ? '✅' : '❌'} ${img.src.split('/').pop()}`);
        });
    }

    if (domImages.productImages.length > 0) {
        console.log(`\n📸 Product Images (${domImages.productImages.filter(img => img.loaded).length}/${domImages.productImages.length} loaded):`);
        domImages.productImages.forEach(img => {
            console.log(`  - ${img.loaded ? '✅' : '❌'} ${img.src.split('/').pop()}`);
        });
    }

    // Performance check
    const performanceTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
        };
    });

    console.log(`\n⚡ Performance:`);
    console.log(`  - Page Load Time: ${performanceTiming.loadTime}ms`);
    console.log(`  - DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);

    // Success criteria
    const manifestUsed = pageStructure.manifestLoaded !== null;
    const allImagesLoaded = domImages.failed === 0 && domImages.loaded > 0;
    const no404Errors = failedRequests.length === 0;
    const fastLoad = performanceTiming.loadTime < 2000;

    console.log('\n🎯 Success Criteria:');
    console.log(`  - Manifest used: ${manifestUsed ? '✅' : '❌'}`);
    console.log(`  - All images loaded: ${allImagesLoaded ? '✅' : '❌'}`);
    console.log(`  - No 404 errors: ${no404Errors ? '✅' : '❌'}`);
    console.log(`  - Load time < 2 seconds: ${fastLoad ? '✅' : '❌'}`);

    if (manifestUsed && allImagesLoaded && no404Errors && fastLoad) {
        console.log('\n🎉 SUCCESS: Manifest-based loading is working perfectly!');
    } else {
        console.log('\n⚠️ ISSUES DETECTED:');
        if (!manifestUsed) console.log('  - Manifest not being used');
        if (!allImagesLoaded) console.log('  - Some images failed to load');
        if (!no404Errors) console.log('  - 404 errors detected');
        if (!fastLoad) console.log('  - Page load too slow');
    }

    // Keep browser open for 5 seconds for visual inspection
    await page.waitForTimeout(5000);
    await browser.close();
})();