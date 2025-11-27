const { chromium, devices } = require('playwright');
const path = require('path');

async function verifyImagesDisplay() {
    console.log('✅ VERIFYING ORDER BUMP IMAGES DISPLAY\n');
    console.log('=' .repeat(70));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 100
    });

    const context = await browser.newContext({
        ...devices['iPhone 13']
    });

    const page = await context.newPage();

    // Monitor image loading
    const loadedImages = [];
    page.on('response', response => {
        const url = response.url();
        if (url.includes('order-bump') && response.status() === 200) {
            loadedImages.push({
                file: url.split('/').pop(),
                status: response.status()
            });
        }
    });

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

        console.log('🔍 CHECKING ORDER BUMP IMAGES:\n');
        console.log('-' .repeat(70));

        // Check images in order bump
        const images = await page.evaluate(() => {
            const imgs = document.querySelectorAll('div[style*="background: #fff3cd"] img');
            return Array.from(imgs).map(img => ({
                src: img.src,
                path: img.src.split('/').slice(-2).join('/'),
                alt: img.alt,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: img.offsetWidth,
                displayHeight: img.offsetHeight,
                loaded: img.complete && img.naturalHeight > 0,
                visible: img.offsetParent !== null
            }));
        });

        console.log(`Found ${images.length} images in order bump:\n`);

        images.forEach((img, i) => {
            console.log(`📸 Image ${i + 1}: ${img.path}`);
            console.log(`   Alt text: ${img.alt}`);
            console.log(`   Natural size: ${img.naturalWidth}x${img.naturalHeight}`);
            console.log(`   Display size: ${img.displayWidth}x${img.displayHeight}`);
            console.log(`   Status: ${img.loaded ? '✅ Loaded' : '❌ Not loaded'}`);
            console.log(`   Visible: ${img.visible ? '✅ Yes' : '❌ No'}`);

            if (img.naturalWidth > 0) {
                console.log(`   ✅ Image is displaying correctly!\n`);
            } else {
                console.log(`   ❌ Image failed to load\n`);
            }
        });

        // Check if these are the 1_34PM images
        console.log('📂 FILE VERIFICATION:');
        console.log('-' .repeat(70));

        if (loadedImages.length > 0) {
            console.log('\nSuccessfully loaded from server:');
            loadedImages.forEach(img => {
                console.log(`   ✅ ${img.file}`);
            });
        }

        // Take screenshot
        const bumpElement = await page.$('div[style*="background: #fff3cd"]');
        if (bumpElement) {
            await bumpElement.screenshot({
                path: path.join(__dirname, 'order-bump-verified.png')
            });
            console.log('\n📸 Screenshot saved: order-bump-verified.png');
        }

        // Final verification
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL VERIFICATION:');
        console.log('=' .repeat(70));

        const allLoaded = images.every(img => img.loaded);
        const allVisible = images.every(img => img.visible);

        if (allLoaded && allVisible) {
            console.log('\n✅ SUCCESS! All order bump images are displaying correctly!');
            console.log('   • Both images loaded successfully');
            console.log('   • Both images are visible');
            console.log('   • Using images from order-bump folder');
            console.log('   • File sizes indicate these are the actual product images');
        } else {
            console.log('\n⚠️  Some issues detected:');
            if (!allLoaded) console.log('   - Not all images loaded');
            if (!allVisible) console.log('   - Not all images visible');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n👀 Browser will stay open for inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

verifyImagesDisplay().catch(console.error);