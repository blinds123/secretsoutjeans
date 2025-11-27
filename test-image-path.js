const { chromium, devices } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext(devices['iPhone 13']);
    const page = await context.newPage();

    await page.goto('http://localhost:8009/ultra-smart-restored.html');
    await page.click('.size-btn[data-size="M"]');
    await page.click('.add-to-cart');
    await page.waitForTimeout(500);

    const images = await page.$$eval('div[style*="background: #fff3cd"] img', imgs =>
        imgs.map(img => ({
            src: img.src,
            path: img.src.split('/').slice(-2).join('/'),
            loaded: img.complete && img.naturalHeight > 0
        }))
    );

    console.log('\n✅ Order bump images are now using:');
    images.forEach(img => {
        console.log(`   - ${img.path} (${img.loaded ? '✅ Loaded' : '❌ Not loaded'})`);
    });

    const correctPath = images.every(img => img.src.includes('order-bump'));
    console.log(`\n${correctPath ? '✅' : '❌'} Using order-bump folder (with hyphen)`);

    await page.waitForTimeout(3000);
    await browser.close();
})();