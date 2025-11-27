const { chromium } = require('playwright');

(async () => {
    console.log('⚡ Page Speed Test - Manifest Implementation\n');
    console.log('=' .repeat(50));

    const results = [];

    // Run 5 tests for average
    for (let i = 1; i <= 5; i++) {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        let requests = 0;
        let failures = 0;
        let imageLoads = 0;

        page.on('request', () => requests++);
        page.on('response', response => {
            if (response.status() === 404) failures++;
            if ((response.url().includes('.jpg') || response.url().includes('.jpeg') || response.url().includes('.png')) && response.status() === 200) {
                imageLoads++;
            }
        });

        const startTime = Date.now();

        await page.goto('http://localhost:8002/ultra-smart.html', {
            waitUntil: 'networkidle'
        });

        const loadTime = Date.now() - startTime;

        const metrics = await page.evaluate(() => {
            const timing = performance.timing;
            return {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
            };
        });

        results.push({
            run: i,
            totalLoadTime: loadTime,
            domContentLoaded: metrics.domContentLoaded,
            loadComplete: metrics.loadComplete,
            firstPaint: Math.round(metrics.firstPaint),
            requests,
            failures,
            imageLoads
        });

        console.log(`Run ${i}: ${loadTime}ms (${requests} requests, ${imageLoads} images, ${failures} failures)`);

        await browser.close();
    }

    // Calculate averages
    const avg = {
        loadTime: Math.round(results.reduce((a, b) => a + b.totalLoadTime, 0) / results.length),
        domContentLoaded: Math.round(results.reduce((a, b) => a + b.domContentLoaded, 0) / results.length),
        loadComplete: Math.round(results.reduce((a, b) => a + b.loadComplete, 0) / results.length),
        firstPaint: Math.round(results.reduce((a, b) => a + b.firstPaint, 0) / results.length),
        requests: Math.round(results.reduce((a, b) => a + b.requests, 0) / results.length),
        failures: Math.round(results.reduce((a, b) => a + b.failures, 0) / results.length),
        imageLoads: Math.round(results.reduce((a, b) => a + b.imageLoads, 0) / results.length)
    };

    console.log('\n' + '=' .repeat(50));
    console.log('📊 AVERAGE PERFORMANCE METRICS:');
    console.log('=' .repeat(50));
    console.log(`⏱️  Total Load Time:      ${avg.loadTime}ms`);
    console.log(`📄 DOM Content Loaded:   ${avg.domContentLoaded}ms`);
    console.log(`✅ Page Load Complete:   ${avg.loadComplete}ms`);
    console.log(`🎨 First Paint:          ${avg.firstPaint}ms`);
    console.log(`📡 Total Requests:       ${avg.requests}`);
    console.log(`🖼️  Images Loaded:        ${avg.imageLoads}`);
    console.log(`❌ Failed Requests:      ${avg.failures}`);

    console.log('\n' + '=' .repeat(50));
    console.log('🏆 PERFORMANCE GRADE:');
    console.log('=' .repeat(50));

    if (avg.loadTime < 500) {
        console.log('⚡ EXCELLENT - Sub 500ms load time!');
    } else if (avg.loadTime < 1000) {
        console.log('✅ GREAT - Under 1 second');
    } else if (avg.loadTime < 2000) {
        console.log('👍 GOOD - Under 2 seconds');
    } else {
        console.log('⚠️  NEEDS IMPROVEMENT - Over 2 seconds');
    }

    console.log(`\n🚀 With manifest: ${avg.failures === 0 ? 'ZERO 404 errors!' : avg.failures + ' failed requests'}`);
    console.log(`📦 Efficiency: Only ${avg.requests} HTTP requests total\n`);

    process.exit(0);
})();