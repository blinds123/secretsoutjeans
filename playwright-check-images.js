const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkImagesWithPlaywright() {
    console.log('🔍 PLAYWRIGHT: Checking Order Bump Images\n');
    console.log('=' .repeat(70));

    // First check local file system
    console.log('📁 LOCAL FILE SYSTEM CHECK:\n');
    const orderBumpPath = path.join(__dirname, 'images', 'order-bump');

    if (fs.existsSync(orderBumpPath)) {
        const files = fs.readdirSync(orderBumpPath);
        console.log(`Found ${files.length} files in images/order-bump/:`);
        files.forEach(file => {
            const stats = fs.statSync(path.join(orderBumpPath, file));
            console.log(`  - ${file} (${stats.size} bytes)`);
        });
    } else {
        console.log('❌ images/order-bump folder not found');
    }

    // Check for the specific files mentioned
    console.log('\n🔎 Looking for specific 1_34PM files:');
    const file1 = 'Generated Image September 05, 2025 - 1_34PM (2).jpeg';
    const file2 = 'Generated Image September 05, 2025 - 1_34PM (3).jpeg';

    [file1, file2].forEach(filename => {
        const fullPath = path.join(orderBumpPath, filename);
        if (fs.existsSync(fullPath)) {
            console.log(`  ✅ Found: ${filename}`);
        } else {
            console.log(`  ❌ Not found: ${filename}`);
        }
    });

    const browser = await chromium.launch({
        headless: false,
        slowMo: 50
    });

    const context = await browser.newContext({
        ...devices['iPhone 13']
    });

    const page = await context.newPage();

    // Track all image requests
    const imageRequests = [];
    page.on('request', request => {
        const url = request.url();
        if (url.includes('order-bump') && (url.endsWith('.jpeg') || url.endsWith('.jpg') || url.endsWith('.png'))) {
            imageRequests.push({
                url: url,
                filename: decodeURIComponent(url.split('/').pop())
            });
        }
    });

    // Track responses
    const imageResponses = [];
    page.on('response', response => {
        const url = response.url();
        if (url.includes('order-bump')) {
            imageResponses.push({
                url: url,
                status: response.status(),
                filename: decodeURIComponent(url.split('/').pop())
            });
        }
    });

    try {
        console.log('\n📱 BROWSER CHECK:\n');
        console.log('Loading page...');

        await page.goto('http://localhost:8009/ultra-smart-restored.html', {
            waitUntil: 'networkidle'
        });

        // Open modal
        await page.click('.size-btn[data-size="M"]');
        await page.waitForTimeout(200);
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        // Check what images are actually in the HTML
        console.log('\n📄 HTML SOURCE CHECK:');
        const htmlImages = await page.evaluate(() => {
            const bumpSection = document.querySelector('div[style*="background: #fff3cd"]');
            const images = bumpSection?.querySelectorAll('img') || [];
            return Array.from(images).map(img => ({
                src: img.src,
                currentSrc: img.currentSrc,
                alt: img.alt,
                srcAttribute: img.getAttribute('src')
            }));
        });

        console.log(`\nFound ${htmlImages.length} images in order bump HTML:`);
        htmlImages.forEach((img, i) => {
            console.log(`\n  Image ${i + 1}:`);
            console.log(`    HTML src attribute: ${img.srcAttribute}`);
            console.log(`    Actual src loaded: ${img.src}`);
            console.log(`    Alt text: ${img.alt}`);
        });

        // Check what browser actually loaded
        console.log('\n🌐 NETWORK REQUESTS:');
        if (imageRequests.length > 0) {
            console.log(`\nBrowser requested ${imageRequests.length} order-bump images:`);
            imageRequests.forEach(req => {
                console.log(`  - ${req.filename}`);
            });
        } else {
            console.log('  No order-bump images requested');
        }

        console.log('\n📥 NETWORK RESPONSES:');
        if (imageResponses.length > 0) {
            imageResponses.forEach(resp => {
                const statusIcon = resp.status === 200 ? '✅' : '❌';
                console.log(`  ${statusIcon} ${resp.filename} - Status: ${resp.status}`);
            });
        }

        // Check actual rendered images
        console.log('\n🖼️ RENDERED IMAGES CHECK:');
        const renderedImages = await page.evaluate(() => {
            const images = document.querySelectorAll('div[style*="background: #fff3cd"] img');
            return Array.from(images).map(img => {
                const rect = img.getBoundingClientRect();
                return {
                    src: img.src,
                    filename: decodeURIComponent(img.src.split('/').pop()),
                    naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
                    displaySize: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
                    loaded: img.complete && img.naturalHeight > 0,
                    visible: rect.width > 0 && rect.height > 0
                };
            });
        });

        renderedImages.forEach((img, i) => {
            console.log(`\n  Image ${i + 1}: ${img.filename}`);
            console.log(`    Natural size: ${img.naturalSize}`);
            console.log(`    Display size: ${img.displaySize}`);
            console.log(`    Loaded: ${img.loaded ? '✅' : '❌'}`);
            console.log(`    Visible: ${img.visible ? '✅' : '❌'}`);
        });

        // Take screenshot
        const bumpElement = await page.$('div[style*="background: #fff3cd"]');
        if (bumpElement) {
            await bumpElement.screenshot({
                path: path.join(__dirname, 'playwright-image-check.png')
            });
            console.log('\n📸 Screenshot saved: playwright-image-check.png');
        }

        // Final analysis
        console.log('\n' + '=' .repeat(70));
        console.log('📊 ANALYSIS:');
        console.log('=' .repeat(70));

        const has1_34PM = renderedImages.some(img =>
            img.filename.includes('1_34PM'));

        if (has1_34PM) {
            console.log('\n✅ Found 1_34PM images in the order bump!');
            renderedImages.filter(img => img.filename.includes('1_34PM')).forEach(img => {
                console.log(`   - ${img.filename}`);
            });
        } else {
            console.log('\n❌ No 1_34PM images found. Current images are:');
            renderedImages.forEach(img => {
                console.log(`   - ${img.filename}`);
            });

            console.log('\n💡 The specific files you mentioned:');
            console.log('   - Generated Image September 05, 2025 - 1_34PM (2).jpeg');
            console.log('   - Generated Image September 05, 2025 - 1_34PM (3).jpeg');
            console.log('   Are NOT currently being used or found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n👀 Browser staying open for inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

checkImagesWithPlaywright().catch(console.error);