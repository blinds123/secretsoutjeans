const { chromium, devices } = require('playwright');
const path = require('path');

async function testOrderBumpImages() {
    console.log('🖼️ TESTING ORDER BUMP SPECIFIC IMAGES\n');
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

        console.log('✅ STEP 1: Selecting size M');
        await page.click('.size-btn[data-size="M"]');
        await page.waitForTimeout(300);

        console.log('✅ STEP 2: Opening checkout modal\n');
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        console.log('🔍 CHECKING ORDER BUMP IMAGES:');
        console.log('-' .repeat(40));

        // Check if modal opened
        const modalOpen = await page.$eval('#checkoutModal', modal =>
            modal.classList.contains('active')
        );
        console.log(`Modal opened: ${modalOpen ? '✅' : '❌'}`);

        if (!modalOpen) {
            console.log('❌ Modal did not open!');
            return;
        }

        // Check for order bump images specifically
        const bumpImages = await page.$$eval('.modal-content img[src*="orderbump"]', imgs =>
            imgs.map(img => ({
                src: img.src,
                alt: img.alt,
                width: img.style.width,
                height: img.style.height,
                visible: img.offsetParent !== null,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                loaded: img.complete && img.naturalHeight > 0
            }))
        );

        console.log(`\n📸 Order Bump Images Found: ${bumpImages.length}`);
        console.log('-' .repeat(40));

        if (bumpImages.length > 0) {
            bumpImages.forEach((img, i) => {
                console.log(`\nImage ${i+1}:`);
                console.log(`  Path: ${img.src.split('/').slice(-2).join('/')}`);
                console.log(`  Alt: ${img.alt}`);
                console.log(`  Display Size: ${img.width} x ${img.height}`);
                console.log(`  Natural Size: ${img.naturalWidth}x${img.naturalHeight}`);
                console.log(`  Visible: ${img.visible ? '✅' : '❌'}`);
                console.log(`  Loaded: ${img.loaded ? '✅' : '❌'}`);
            });
        } else {
            // Fallback check for any product images in order bump area
            console.log('\n⚠️  No images with "orderbump" path found.');
            console.log('Checking for any images in order bump section...\n');

            const anyBumpImages = await page.$$eval('div[style*="background: #fff3cd"] img', imgs =>
                imgs.map(img => ({
                    src: img.src.split('/').slice(-2).join('/'),
                    alt: img.alt,
                    loaded: img.complete && img.naturalHeight > 0
                }))
            );

            if (anyBumpImages.length > 0) {
                console.log(`Found ${anyBumpImages.length} images in order bump section:`);
                anyBumpImages.forEach((img, i) => {
                    console.log(`  ${i+1}. ${img.src} - ${img.loaded ? '✅ Loaded' : '❌ Not loaded'}`);
                });
            }
        }

        // Check if checkbox is pre-checked
        const isPreChecked = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`\n✅ Order Bump Pre-checked: ${isPreChecked ? 'YES' : 'NO'}`);

        // Check total shows $40 (with bump included)
        const totalPrice = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`✅ Total Price: ${totalPrice} ${totalPrice.includes('40') ? '(Correct with bump)' : '(Should be $40)'}`);

        // Take screenshot of order bump section
        console.log('\n📸 CAPTURING ORDER BUMP SCREENSHOT:');
        console.log('-' .repeat(40));

        const bumpSection = await page.$('div[style*="background: #fff3cd"]');
        if (bumpSection) {
            await bumpSection.screenshot({
                path: path.join(__dirname, 'order-bump-with-images.png')
            });
            console.log('✅ Screenshot saved: order-bump-with-images.png');
        }

        // Test image loading by monitoring network
        console.log('\n🌐 CHECKING IMAGE REQUESTS:');
        console.log('-' .repeat(40));

        // Capture network requests for order bump images
        const imageRequests = [];
        page.on('response', response => {
            if (response.url().includes('orderbump') || response.url().includes('matching-bottom')) {
                imageRequests.push({
                    url: response.url(),
                    status: response.status(),
                    ok: response.ok()
                });
            }
        });

        // Reload the modal to capture requests
        await page.click('.popup-close');
        await page.waitForTimeout(500);
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        if (imageRequests.length > 0) {
            console.log('\nOrder bump image requests:');
            imageRequests.forEach(req => {
                console.log(`  ${req.url.split('/').slice(-2).join('/')} - ${req.ok ? '✅' : '❌'} (${req.status})`);
            });
        }

        // Final validation
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL VALIDATION:');
        console.log('=' .repeat(70));

        const allChecks = [
            { name: 'Modal opens correctly', passed: modalOpen },
            { name: 'Order bump is pre-checked', passed: isPreChecked },
            { name: 'Total shows $40 with bump', passed: totalPrice.includes('40') },
            { name: 'Order bump images present', passed: bumpImages.length > 0 || anyBumpImages?.length > 0 },
            { name: 'Images are loaded', passed: bumpImages.every(img => img.loaded) }
        ];

        const passed = allChecks.filter(c => c.passed).length;
        const total = allChecks.length;

        console.log(`\nScore: ${passed}/${total} checks passed\n`);

        allChecks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });

        if (passed === total) {
            console.log('\n🎉 PERFECT! Order bump images working correctly!');
        } else {
            console.log(`\n⚠️  Some issues detected (${total - passed} failed checks)`);
        }

    } catch (error) {
        console.error('Test error:', error);
    }

    console.log('\n👀 Browser will stay open for manual inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

testOrderBumpImages().catch(console.error);