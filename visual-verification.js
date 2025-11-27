const { chromium, devices } = require('playwright');
const path = require('path');

async function visualVerification() {
    console.log('🎯 VISUAL VERIFICATION - Order Bump with New Images & Pricing\n');
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

        // Select size and open modal
        await page.click('.size-btn[data-size="L"]');
        await page.waitForTimeout(300);
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        console.log('🔍 CHECKING ORDER BUMP VISUAL & PRICING:\n');
        console.log('-' .repeat(70));

        // Check modal opened
        const modalOpen = await page.$eval('#checkoutModal', modal =>
            modal.classList.contains('active')
        );
        console.log(`Modal opened: ${modalOpen ? '✅' : '❌'}`);

        // Analyze order bump content
        const bumpAnalysis = await page.evaluate(() => {
            const bumpSection = document.querySelector('div[style*="background: #fff3cd"]');
            if (!bumpSection) return { found: false };

            const text = bumpSection.textContent;
            const images = bumpSection.querySelectorAll('img');

            // Get image details
            const imageDetails = Array.from(images).map(img => ({
                src: img.src.split('/').slice(-2).join('/'),
                alt: img.alt,
                naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
                loaded: img.complete && img.naturalHeight > 0
            }));

            // Check pricing
            const hasStrikethrough100 = text.includes('$100');
            const hasPrice10 = text.includes('Only $10') || text.includes('$10');
            const hasNoPercentage = !text.includes('%') && !text.includes('OFF)');
            const hasLimitedTime = text.includes('LIMITED TIME');

            return {
                found: true,
                text: {
                    hasSunglasses: text.includes('Sunglasses'),
                    hasWallet: text.includes('Wallet'),
                    hasStrikethrough100,
                    hasPrice10,
                    hasNoPercentage,
                    hasLimitedTime
                },
                images: imageDetails
            };
        });

        if (bumpAnalysis.found) {
            console.log('\n📊 Order Bump Analysis:');
            console.log('\nText Content:');
            console.log(`   Sunglasses mentioned: ${bumpAnalysis.text.hasSunglasses ? '✅' : '❌'}`);
            console.log(`   Wallet mentioned: ${bumpAnalysis.text.hasWallet ? '✅' : '❌'}`);
            console.log(`   Shows $100 strikethrough: ${bumpAnalysis.text.hasStrikethrough100 ? '✅' : '❌'}`);
            console.log(`   Shows $10 price: ${bumpAnalysis.text.hasPrice10 ? '✅' : '❌'}`);
            console.log(`   No percentage shown: ${bumpAnalysis.text.hasNoPercentage ? '✅' : '❌'}`);
            console.log(`   LIMITED TIME badge: ${bumpAnalysis.text.hasLimitedTime ? '✅' : '❌'}`);

            console.log('\nImages:');
            if (bumpAnalysis.images.length > 0) {
                bumpAnalysis.images.forEach((img, i) => {
                    console.log(`   Image ${i + 1}: ${img.src}`);
                    console.log(`      Alt: ${img.alt}`);
                    console.log(`      Size: ${img.naturalSize}`);
                    console.log(`      Loaded: ${img.loaded ? '✅' : '❌'}`);
                });
            } else {
                console.log('   ❌ No images found');
            }
        }

        // Check if images are visually distinct from product images
        const imageComparison = await page.evaluate(() => {
            const productImages = document.querySelectorAll('.product-gallery img');
            const bumpImages = document.querySelectorAll('div[style*="background: #fff3cd"] img');

            if (productImages.length === 0 || bumpImages.length === 0) {
                return { canCompare: false };
            }

            const productSrc = productImages[0]?.src || '';
            const bumpSrc = bumpImages[0]?.src || '';

            return {
                canCompare: true,
                productPath: productSrc.split('/').slice(-2).join('/'),
                bumpPath: bumpSrc.split('/').slice(-2).join('/'),
                different: !productSrc.includes(bumpSrc.split('/').pop())
            };
        });

        console.log('\n🖼️ Image Comparison:');
        if (imageComparison.canCompare) {
            console.log(`   Product image: ${imageComparison.productPath}`);
            console.log(`   Bump image: ${imageComparison.bumpPath}`);
            console.log(`   Images are different: ${imageComparison.different ? '✅' : '❌'}`);
        }

        // Take screenshots
        console.log('\n📸 Taking Screenshots:');
        const bumpElement = await page.$('div[style*="background: #fff3cd"]');
        if (bumpElement) {
            await bumpElement.screenshot({
                path: path.join(__dirname, 'order-bump-final.png')
            });
            console.log('   ✅ Saved: order-bump-final.png');
        }

        // Take full modal screenshot
        const modal = await page.$('.modal-content');
        if (modal) {
            await modal.screenshot({
                path: path.join(__dirname, 'modal-full.png')
            });
            console.log('   ✅ Saved: modal-full.png');
        }

        // Test functionality
        console.log('\n⚙️ Testing Functionality:');
        const checkbox = await page.$('#orderBumpCheckbox');
        const isChecked = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`   Checkbox pre-checked: ${isChecked ? '✅' : '❌'}`);

        const totalPrice = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`   Total with bump: ${totalPrice} ${totalPrice.includes('35') ? '✅' : '❌'}`);

        // Final verdict
        console.log('\n' + '=' .repeat(70));
        console.log('✅ FINAL VERIFICATION:');
        console.log('=' .repeat(70));

        const allChecks = [
            bumpAnalysis.text.hasSunglasses && bumpAnalysis.text.hasWallet,
            bumpAnalysis.text.hasStrikethrough100,
            bumpAnalysis.text.hasPrice10,
            bumpAnalysis.text.hasNoPercentage,
            bumpAnalysis.images.length === 2,
            bumpAnalysis.images.every(img => img.loaded),
            imageComparison.different
        ];

        const passed = allChecks.filter(Boolean).length;
        console.log(`\n   Score: ${passed}/7 checks passed`);

        if (passed === 7) {
            console.log('\n   🎉 PERFECT! Order bump is correctly configured:');
            console.log('      • Shows Sunglasses & Wallet');
            console.log('      • Price: $100 → $10 (no percentage)');
            console.log('      • Has distinct images');
            console.log('      • Images load correctly');
        } else {
            console.log('\n   ⚠️ Some issues remain. Check details above.');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n👀 Browser will stay open for visual inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

visualVerification().catch(console.error);