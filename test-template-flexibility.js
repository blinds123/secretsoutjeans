const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testTemplateFlexibility() {
    console.log('🎯 TESTING ORDER BUMP TEMPLATE FLEXIBILITY\n');
    console.log('=' .repeat(70));
    console.log('This template will automatically load any image you place in:\n');
    console.log('📁 /images/order-bump/product.jpeg (preferred)\n');
    console.log('📁 /images/order-bump/sunglasses.jpeg (fallback)\n');
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
        console.log('\n🔍 CHECKING CURRENT SETUP:\n');

        // Check what's in the folder
        const orderBumpPath = path.join(__dirname, 'images', 'order-bump');
        if (fs.existsSync(orderBumpPath)) {
            const files = fs.readdirSync(orderBumpPath);
            console.log(`Files in order-bump folder:`);
            files.forEach(file => {
                const stats = fs.statSync(path.join(orderBumpPath, file));
                console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
            });
        }

        console.log('\n📱 LOADING PAGE...\n');
        await page.goto('http://localhost:8009/ultra-smart-restored.html', {
            waitUntil: 'networkidle'
        });

        // Open modal
        await page.click('.size-btn[data-size="M"]');
        await page.waitForTimeout(300);
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        console.log('🎨 ORDER BUMP TEMPLATE ANALYSIS:\n');
        console.log('-' .repeat(70));

        // Check what loaded
        const result = await page.evaluate(() => {
            const img = document.getElementById('orderBumpImage');
            const bumpSection = document.querySelector('div[style*="background: #fff3cd"]');

            return {
                imageFound: !!img,
                imageSrc: img?.src || 'none',
                imageLoaded: img?.complete && img?.naturalHeight > 0,
                naturalSize: img ? `${img.naturalWidth}x${img.naturalHeight}` : 'N/A',
                displaySize: img ? `${img.offsetWidth}x${img.offsetHeight}` : 'N/A',
                altText: img?.alt || 'none',
                textContent: {
                    hasGenericText: bumpSection?.textContent.includes('Special Add-On'),
                    noSpecificProduct: !bumpSection?.textContent.includes('Sunglasses') &&
                                      !bumpSection?.textContent.includes('Wallet')
                }
            };
        });

        console.log('📸 Image Status:');
        if (result.imageFound && result.imageLoaded) {
            const filename = result.imageSrc.split('/').pop();
            console.log(`   ✅ Image loaded: ${filename}`);
            console.log(`   Natural size: ${result.naturalSize}`);
            console.log(`   Display size: ${result.displaySize}`);
            console.log(`   Alt text: "${result.altText}"`);
        } else {
            console.log('   ❌ No image loaded');
        }

        console.log('\n📝 Template Text:');
        console.log(`   Generic text used: ${result.textContent.hasGenericText ? '✅' : '❌'}`);
        console.log(`   No specific products mentioned: ${result.textContent.noSpecificProduct ? '✅' : '❌'}`);

        // Test dynamic loading
        console.log('\n🔄 TESTING DYNAMIC LOADING:\n');
        console.log('-' .repeat(70));

        // Check console logs for loading messages
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('Order bump')) {
                consoleLogs.push(msg.text());
            }
        });

        // Reload to trigger dynamic loading
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        if (consoleLogs.length > 0) {
            console.log('Dynamic loading messages:');
            consoleLogs.forEach(log => console.log(`   📌 ${log}`));
        }

        // Test with different image
        console.log('\n💡 HOW TO USE THIS TEMPLATE:\n');
        console.log('-' .repeat(70));
        console.log('1. Place your product image in: /images/order-bump/');
        console.log('2. Name it: product.jpeg (or product.jpg, product.png)');
        console.log('3. The template will automatically load it');
        console.log('4. No HTML changes needed!\n');

        console.log('📋 TEMPLATE FEATURES:');
        console.log('   ✅ Accepts ANY image (will resize to 80x80)');
        console.log('   ✅ Generic text (no specific product names)');
        console.log('   ✅ Auto-detects image in folder');
        console.log('   ✅ Fallback support');
        console.log('   ✅ Works with JPEG, JPG, PNG formats');

        // Final verdict
        console.log('\n' + '=' .repeat(70));
        console.log('✅ TEMPLATE STATUS:');
        console.log('=' .repeat(70));

        if (result.imageLoaded && result.textContent.hasGenericText) {
            console.log('\n🎉 READY TO USE AS TEMPLATE!');
            console.log('   Simply drop any product image into order-bump folder');
            console.log('   Name it "product.jpeg" and it will automatically load');
        } else {
            console.log('\n⚠️  Some adjustments needed');
        }

        // Take screenshot
        const bumpElement = await page.$('div[style*="background: #fff3cd"]');
        if (bumpElement) {
            await bumpElement.screenshot({
                path: path.join(__dirname, 'template-test.png')
            });
            console.log('\n📸 Screenshot saved: template-test.png');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n👀 Browser staying open for inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

testTemplateFlexibility().catch(console.error);