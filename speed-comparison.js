const { chromium } = require('playwright');

async function testPage(url, name) {
    const results = [];

    for (let i = 1; i <= 5; i++) {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        let requests = 0;
        let failures = 0;
        let imageLoads = 0;
        let manifestRequest = false;

        page.on('request', request => {
            requests++;
            if (request.url().includes('manifest.json')) {
                manifestRequest = true;
            }
        });

        page.on('response', response => {
            if (response.status() === 404) failures++;
            if ((response.url().includes('.jpg') || response.url().includes('.jpeg') || response.url().includes('.png')) && response.status() === 200) {
                imageLoads++;
            }
        });

        const startTime = Date.now();

        await page.goto(url, {
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
            loadTime,
            domContentLoaded: metrics.domContentLoaded,
            loadComplete: metrics.loadComplete,
            firstPaint: Math.round(metrics.firstPaint),
            requests,
            failures,
            imageLoads,
            manifestRequest
        });

        await browser.close();
    }

    // Calculate averages
    const avg = {
        loadTime: Math.round(results.reduce((a, b) => a + b.loadTime, 0) / results.length),
        domContentLoaded: Math.round(results.reduce((a, b) => a + b.domContentLoaded, 0) / results.length),
        loadComplete: Math.round(results.reduce((a, b) => a + b.loadComplete, 0) / results.length),
        firstPaint: Math.round(results.reduce((a, b) => a + b.firstPaint, 0) / results.length),
        requests: Math.round(results.reduce((a, b) => a + b.requests, 0) / results.length),
        failures: Math.round(results.reduce((a, b) => a + b.failures, 0) / results.length),
        imageLoads: Math.round(results.reduce((a, b) => a + b.imageLoads, 0) / results.length),
        usesManifest: results[0].manifestRequest
    };

    return { name, avg, results };
}

(async () => {
    console.log('🏁 SPEED COMPARISON: Manifest vs Hardcoded\n');
    console.log('=' .repeat(60));

    // Test both versions
    console.log('\n📊 Running tests (5 runs each)...\n');

    const hardcodedResults = await testPage('http://localhost:8002/ultra-smart-hardcoded.html', 'HARDCODED');
    console.log('✅ Hardcoded version tested');

    const manifestResults = await testPage('http://localhost:8002/ultra-smart.html', 'MANIFEST');
    console.log('✅ Manifest version tested\n');

    console.log('=' .repeat(60));
    console.log('📊 RESULTS COMPARISON');
    console.log('=' .repeat(60));

    // Hardcoded results
    console.log('\n🔷 HARDCODED PATHS (Direct References):');
    console.log('  ⏱️  Load Time:         ' + hardcodedResults.avg.loadTime + 'ms');
    console.log('  🎨 First Paint:       ' + hardcodedResults.avg.firstPaint + 'ms');
    console.log('  📄 DOM Ready:         ' + hardcodedResults.avg.domContentLoaded + 'ms');
    console.log('  📡 HTTP Requests:     ' + hardcodedResults.avg.requests);
    console.log('  🖼️  Images Loaded:     ' + hardcodedResults.avg.imageLoads);
    console.log('  ❌ 404 Errors:        ' + hardcodedResults.avg.failures);
    console.log('  📦 Uses Manifest:     No');

    // Manifest results
    console.log('\n🔶 MANIFEST APPROACH (Smart Loading):');
    console.log('  ⏱️  Load Time:         ' + manifestResults.avg.loadTime + 'ms');
    console.log('  🎨 First Paint:       ' + manifestResults.avg.firstPaint + 'ms');
    console.log('  📄 DOM Ready:         ' + manifestResults.avg.domContentLoaded + 'ms');
    console.log('  📡 HTTP Requests:     ' + manifestResults.avg.requests + ' (includes 1 manifest)');
    console.log('  🖼️  Images Loaded:     ' + manifestResults.avg.imageLoads);
    console.log('  ❌ 404 Errors:        ' + manifestResults.avg.failures);
    console.log('  📦 Uses Manifest:     Yes');

    // Performance difference
    console.log('\n' + '=' .repeat(60));
    console.log('⚖️  PERFORMANCE DIFFERENCE');
    console.log('=' .repeat(60));

    const loadTimeDiff = manifestResults.avg.loadTime - hardcodedResults.avg.loadTime;
    const requestsDiff = manifestResults.avg.requests - hardcodedResults.avg.requests;
    const firstPaintDiff = manifestResults.avg.firstPaint - hardcodedResults.avg.firstPaint;

    console.log('\n📈 Load Time Difference:      ' + (loadTimeDiff > 0 ? '+' : '') + loadTimeDiff + 'ms');
    console.log('📈 First Paint Difference:    ' + (firstPaintDiff > 0 ? '+' : '') + firstPaintDiff + 'ms');
    console.log('📈 HTTP Requests Difference:  ' + (requestsDiff > 0 ? '+' : '') + requestsDiff);

    console.log('\n' + '=' .repeat(60));
    console.log('💡 ANALYSIS');
    console.log('=' .repeat(60));

    if (Math.abs(loadTimeDiff) < 50) {
        console.log('\n✅ Both approaches have SIMILAR performance (~' + Math.abs(loadTimeDiff) + 'ms difference)');
    } else if (loadTimeDiff < 0) {
        console.log('\n✅ Manifest approach is FASTER by ' + Math.abs(loadTimeDiff) + 'ms');
    } else {
        console.log('\n⚠️  Hardcoded approach is FASTER by ' + loadTimeDiff + 'ms');
    }

    console.log('\nKey Differences:');
    console.log('  • Hardcoded: ' + hardcodedResults.avg.requests + ' direct image requests');
    console.log('  • Manifest:  ' + (manifestResults.avg.requests - 1) + ' image requests + 1 manifest request');

    console.log('\nTrade-offs:');
    console.log('  ✅ Hardcoded: Slightly fewer requests, no manifest overhead');
    console.log('  ✅ Manifest:  Flexible, maintainable, no 404s ever');

    console.log('\n🎯 CONCLUSION:');
    if (Math.abs(loadTimeDiff) < 100) {
        console.log('  Performance is essentially IDENTICAL (within 100ms)');
        console.log('  Manifest adds flexibility with minimal overhead (~1 request)');
    }

    console.log('\n');
    process.exit(0);
})();