const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Track all network requests
    const failedRequests = [];
    const successfulImages = [];

    page.on('response', response => {
        const url = response.url();
        const status = response.status();

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

    // Monitor console logs
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log(`📋 Console: ${msg.text()}`);
        }
    });

    console.log('🚀 Testing manifest-based image loading...\n');

    // Navigate to the page
    await page.goto('http://localhost:8000/ultra-smart.html', {
        waitUntil: 'networkidle'
    });

    // Wait a bit for all images to attempt loading
    await page.waitForTimeout(2000);

    // Check if testimonial images loaded
    const testimonialImages = await page.$$eval('.testimonial-grid img', imgs =>
        imgs.map(img => ({
            src: img.src,
            loaded: img.complete && img.naturalHeight !== 0
        }))
    );

    // Check if product images loaded
    const productImages = await page.$$eval('.main-image, .product-thumbnails img', imgs =>
        imgs.map(img => ({
            src: img.src,
            loaded: img.complete && img.naturalHeight !== 0
        }))
    );

    // Check if favorites images loaded
    const favoritesImages = await page.$$eval('.favorites-row img', imgs =>
        imgs.map(img => ({
            src: img.src,
            loaded: img.complete && img.naturalHeight !== 0
        }))
    );

    // Report results
    console.log('\n📊 Results:');
    console.log('=================');

    console.log(`\n✅ Successful image loads: ${successfulImages.length}`);
    console.log(`❌ Failed requests (404s): ${failedRequests.length}`);

    console.log(`\n📸 Product Images: ${productImages.filter(img => img.loaded).length}/${productImages.length} loaded`);
    console.log(`💬 Testimonial Images: ${testimonialImages.filter(img => img.loaded).length}/${testimonialImages.length} loaded`);
    console.log(`⭐ Favorites Images: ${favoritesImages.filter(img => img.loaded).length}/${favoritesImages.length} loaded`);

    if (failedRequests.length > 0) {
        console.log('\n⚠️ Failed URLs:');
        failedRequests.slice(0, 10).forEach(url => console.log(`  - ${url}`));
        if (failedRequests.length > 10) {
            console.log(`  ... and ${failedRequests.length - 10} more`);
        }
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
    const allImagesLoaded = testimonialImages.every(img => img.loaded) &&
                           productImages.every(img => img.loaded) &&
                           favoritesImages.every(img => img.loaded);
    const no404Errors = failedRequests.length === 0;
    const fastLoad = performanceTiming.loadTime < 2000;

    console.log('\n🎯 Success Criteria:');
    console.log(`  - All images loaded: ${allImagesLoaded ? '✅' : '❌'}`);
    console.log(`  - No 404 errors: ${no404Errors ? '✅' : '❌'}`);
    console.log(`  - Load time < 2 seconds: ${fastLoad ? '✅' : '❌'}`);

    if (allImagesLoaded && no404Errors && fastLoad) {
        console.log('\n🎉 SUCCESS: Manifest-based loading is working perfectly!');
    } else {
        console.log('\n⚠️ ISSUES DETECTED: Some optimization needed');
    }

    await browser.close();
})();