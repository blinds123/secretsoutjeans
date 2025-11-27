const { chromium, devices } = require('playwright');
const path = require('path');

async function testSunglassesOnly() {
    console.log('🕶️ TESTING SUNGLASSES-ONLY ORDER BUMP\n');
    console.log('=' .repeat(70));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
    });

    const context = await browser.newContext({
        ...devices['iPhone 13']
    });

    const page = await context.newPage();

    try {
        console.log('📱 Loading page...\n');
        await page.goto('http://localhost:8009/ultra-smart-restored.html', {
            waitUntil: 'networkidle'
        });

        // Open modal
        await page.click('.size-btn[data-size="L"]');
        await page.waitForTimeout(300);
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        console.log('🔍 CHECKING ORDER BUMP:\n');
        console.log('-' .repeat(70));

        // Analyze order bump
        const analysis = await page.evaluate(() => {
            const bumpSection = document.querySelector('div[style*="background: #fff3cd"]');
            if (!bumpSection) return { found: false };

            const text = bumpSection.textContent;
            const images = bumpSection.querySelectorAll('img');

            return {
                found: true,
                text: {
                    hasSunglasses: text.includes('Sunglasses'),
                    hasWallet: text.includes('Wallet'),
                    hasDesigner: text.includes('Designer'),
                    price: text.includes('$10')
                },
                imageCount: images.length,
                images: Array.from(images).map(img => ({
                    src: img.src.split('/').slice(-2).join('/'),
                    alt: img.alt,
                    width: img.offsetWidth,
                    height: img.offsetHeight,
                    naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
                    loaded: img.complete && img.naturalHeight > 0
                }))
            };
        });

        if (analysis.found) {
            console.log('✅ Order Bump Section Found\n');

            console.log('📝 Text Content:');
            console.log(`   Mentions "Sunglasses": ${analysis.text.hasSunglasses ? '✅' : '❌'}`);
            console.log(`   Mentions "Wallet": ${analysis.text.hasWallet ? '❌ (Should not mention)' : '✅ (Correctly removed)'}`);
            console.log(`   Mentions "Designer": ${analysis.text.hasDesigner ? '✅' : '❌'}`);
            console.log(`   Shows $10 price: ${analysis.text.price ? '✅' : '❌'}`);

            console.log('\n🖼️ Images:');
            console.log(`   Image count: ${analysis.imageCount} ${analysis.imageCount === 1 ? '✅ (Single image)' : '❌ (Should be 1)'}`);

            if (analysis.images.length > 0) {
                analysis.images.forEach((img, i) => {
                    console.log(`\n   Image ${i + 1}:`);
                    console.log(`      Path: ${img.src}`);
                    console.log(`      Alt: ${img.alt}`);
                    console.log(`      Display size: ${img.width}x${img.height}px`);
                    console.log(`      Natural size: ${img.naturalSize}`);
                    console.log(`      Loaded: ${img.loaded ? '✅' : '❌'}`);
                });
            }
        }

        // Check functionality
        console.log('\n⚙️ FUNCTIONALITY:');
        console.log('-' .repeat(70));

        const checkbox = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`   Pre-checked: ${checkbox ? '✅' : '❌'}`);

        const total = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`   Total with bump: ${total} ${total.includes('35') ? '✅' : '❌'}`);

        // Uncheck and check
        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(300);
        const totalUnchecked = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`   Total without bump: ${totalUnchecked} ${totalUnchecked.includes('25') ? '✅' : '❌'}`);

        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(300);
        const totalRechecked = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`   Total re-checked: ${totalRechecked} ${totalRechecked.includes('35') ? '✅' : '❌'}`);

        // Take screenshot
        const bumpElement = await page.$('div[style*="background: #fff3cd"]');
        if (bumpElement) {
            await bumpElement.screenshot({
                path: path.join(__dirname, 'sunglasses-only-bump.png')
            });
            console.log('\n📸 Screenshot saved: sunglasses-only-bump.png');
        }

        // Final verdict
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL VERIFICATION:');
        console.log('=' .repeat(70));

        const checks = [
            analysis.imageCount === 1,
            analysis.text.hasSunglasses && !analysis.text.hasWallet,
            analysis.images[0]?.loaded,
            analysis.images[0]?.width === 80,
            checkbox,
            total.includes('35')
        ];

        const passed = checks.filter(Boolean).length;
        console.log(`\nScore: ${passed}/6 checks passed\n`);

        if (passed === 6) {
            console.log('🎉 PERFECT! Sunglasses-only order bump working correctly:');
            console.log('   • Single sunglasses image (80x80px)');
            console.log('   • Text mentions only sunglasses (no wallet)');
            console.log('   • Price: $100 → $10');
            console.log('   • Functionality intact');
        } else {
            console.log('⚠️ Some checks failed. Review details above.');
        }
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n👀 Browser staying open for inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

testSunglassesOnly().catch(console.error);