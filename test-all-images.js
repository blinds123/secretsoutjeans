/**
 * Comprehensive Image Loading Test for Secrets Out Jeans
 * Tests all images on https://secrets-out-jeans-2024.netlify.app
 *
 * Checks:
 * - All image HTTP status codes
 * - Lazy-loaded images
 * - Visual broken image indicators
 * - Network failures
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://secrets-out-jeans-2024.netlify.app';
const SCREENSHOT_DIR = './test-screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testAllImages() {
    console.log('🚀 Starting Comprehensive Image Loading Test\n');
    console.log(`Testing: ${SITE_URL}\n`);
    console.log('='.repeat(80) + '\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Track all image requests
    const imageRequests = new Map();
    const failedImages = [];
    const successfulImages = [];

    // Intercept all image requests
    page.on('response', async (response) => {
        const url = response.url();
        const resourceType = response.request().resourceType();

        if (resourceType === 'image' ||
            url.match(/\.(jpeg|jpg|gif|png|svg|webp|bmp|ico)(\?|$)/i)) {

            const status = response.status();
            const isSuccess = status >= 200 && status < 300;

            imageRequests.set(url, {
                url,
                status,
                statusText: response.statusText(),
                success: isSuccess,
                contentType: response.headers()['content-type'] || 'unknown',
                size: response.headers()['content-length'] || 'unknown'
            });

            if (isSuccess) {
                successfulImages.push(url);
                console.log(`✅ [${status}] ${url}`);
            } else {
                failedImages.push(url);
                console.log(`❌ [${status}] ${url}`);
            }
        }
    });

    // Track failed requests
    page.on('requestfailed', (request) => {
        const url = request.url();
        const resourceType = request.resourceType();

        if (resourceType === 'image' ||
            url.match(/\.(jpeg|jpg|gif|png|svg|webp|bmp|ico)(\?|$)/i)) {

            failedImages.push(url);
            console.log(`🔴 FAILED: ${url} - ${request.failure().errorText}`);

            imageRequests.set(url, {
                url,
                status: 0,
                statusText: request.failure().errorText,
                success: false,
                contentType: 'failed',
                size: 0
            });
        }
    });

    try {
        console.log('📄 Loading page...\n');
        await page.goto(SITE_URL, {
            waitUntil: 'networkidle',
            timeout: 60000
        });

        // Take initial screenshot
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '01-initial-load.png'),
            fullPage: true
        });
        console.log('\n📸 Screenshot saved: 01-initial-load.png\n');

        // Wait for initial images
        await page.waitForTimeout(2000);

        console.log('📜 Scrolling through entire page to trigger lazy loading...\n');

        // Scroll incrementally to trigger lazy loading
        const scrollSteps = 10;
        const viewportHeight = page.viewportSize().height;
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);

        for (let i = 1; i <= scrollSteps; i++) {
            const scrollPosition = (pageHeight / scrollSteps) * i;
            await page.evaluate((pos) => window.scrollTo(0, pos), scrollPosition);
            await page.waitForTimeout(1500); // Wait for lazy images to load
            console.log(`   Scroll step ${i}/${scrollSteps} - Position: ${scrollPosition}px`);
        }

        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);

        // Take screenshot after scrolling
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '02-after-scroll.png'),
            fullPage: true
        });
        console.log('\n📸 Screenshot saved: 02-after-scroll.png\n');

        // Check for broken image indicators
        console.log('🔍 Checking for visually broken images...\n');

        const brokenImageInfo = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const broken = [];

            images.forEach((img, index) => {
                // Check if image is broken (naturalWidth === 0)
                if (img.complete && img.naturalWidth === 0) {
                    broken.push({
                        index: index + 1,
                        src: img.src,
                        alt: img.alt || 'no alt text',
                        id: img.id || 'no id',
                        className: img.className || 'no class'
                    });
                }
            });

            return {
                totalImages: images.length,
                broken,
                allImageSrcs: images.map(img => img.src)
            };
        });

        console.log(`📊 Total <img> elements found: ${brokenImageInfo.totalImages}`);
        console.log(`🔴 Visually broken images: ${brokenImageInfo.broken.length}\n`);

        if (brokenImageInfo.broken.length > 0) {
            console.log('Broken Images Details:');
            brokenImageInfo.broken.forEach((img, i) => {
                console.log(`  ${i + 1}. ${img.src}`);
                console.log(`     Alt: "${img.alt}"`);
                console.log(`     Class: "${img.className}"`);
                console.log('');
            });
        }

        // Test specific expected images
        console.log('🎯 Checking specific expected images:\n');

        const expectedImages = [
            './images/product/product-01.jpeg',
            './images/product/product-02.jpeg',
            './images/product/product-03.jpeg',
            './images/product/product-04.jpeg',
            './images/product/product-05.jpeg',
            './images/product/product-06.jpeg',
            ...Array.from({ length: 20 }, (_, i) => `./images/testimonials/testimonial-${String(i + 1).padStart(2, '0')}.jpeg`)
        ];

        const foundImages = new Set();
        Array.from(imageRequests.keys()).forEach(url => {
            expectedImages.forEach(expected => {
                if (url.includes(expected.replace('./', ''))) {
                    foundImages.add(expected);
                }
            });
        });

        console.log('Expected Images Status:');
        expectedImages.forEach(img => {
            const found = foundImages.has(img);
            console.log(`  ${found ? '✅' : '❌'} ${img}`);
        });
        console.log('');

        // Generate final report
        console.log('\n' + '='.repeat(80));
        console.log('📋 FINAL IMAGE LOADING REPORT');
        console.log('='.repeat(80) + '\n');

        console.log(`🌐 Site: ${SITE_URL}`);
        console.log(`📅 Test Date: ${new Date().toISOString()}\n`);

        console.log('📊 STATISTICS:');
        console.log(`   Total image requests: ${imageRequests.size}`);
        console.log(`   Successful loads (HTTP 2xx): ${successfulImages.length}`);
        console.log(`   Failed loads (HTTP 4xx/5xx or network error): ${failedImages.length}`);
        console.log(`   Total <img> elements in DOM: ${brokenImageInfo.totalImages}`);
        console.log(`   Visually broken images: ${brokenImageInfo.broken.length}\n`);

        if (failedImages.length > 0) {
            console.log('❌ FAILED IMAGES:');
            console.log('='.repeat(80));

            failedImages.forEach((url, i) => {
                const info = imageRequests.get(url);
                console.log(`\n${i + 1}. ${url}`);
                console.log(`   Status: ${info.status} ${info.statusText}`);
                console.log(`   Content-Type: ${info.contentType}`);
            });
            console.log('\n' + '='.repeat(80) + '\n');
        }

        // Save detailed report to file
        const report = {
            testDate: new Date().toISOString(),
            siteUrl: SITE_URL,
            summary: {
                totalRequests: imageRequests.size,
                successful: successfulImages.length,
                failed: failedImages.length,
                totalImgElements: brokenImageInfo.totalImages,
                visuallyBroken: brokenImageInfo.broken.length
            },
            allRequests: Array.from(imageRequests.values()),
            failedRequests: failedImages.map(url => imageRequests.get(url)),
            brokenImages: brokenImageInfo.broken,
            expectedImages: expectedImages.map(img => ({
                path: img,
                found: foundImages.has(img)
            }))
        };

        const reportPath = path.join(SCREENSHOT_DIR, 'image-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`💾 Detailed report saved: ${reportPath}\n`);

        // Test result summary
        const allPassed = failedImages.length === 0 && brokenImageInfo.broken.length === 0;

        if (allPassed) {
            console.log('✅ TEST PASSED: All images loaded successfully!\n');
        } else {
            console.log('❌ TEST FAILED: Some images did not load correctly.\n');
            console.log('Issues found:');
            if (failedImages.length > 0) {
                console.log(`   - ${failedImages.length} image(s) failed to load (HTTP errors or network failures)`);
            }
            if (brokenImageInfo.broken.length > 0) {
                console.log(`   - ${brokenImageInfo.broken.length} image(s) are visually broken in the DOM`);
            }
            console.log('');
        }

        console.log('📁 Screenshots saved in: ' + SCREENSHOT_DIR);
        console.log('   - 01-initial-load.png');
        console.log('   - 02-after-scroll.png\n');

    } catch (error) {
        console.error('🔥 Test error:', error);

        // Take error screenshot
        try {
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'),
                fullPage: true
            });
            console.log('📸 Error screenshot saved: error-screenshot.png');
        } catch (screenshotError) {
            console.error('Could not save error screenshot:', screenshotError);
        }
    } finally {
        await browser.close();
        console.log('\n✅ Test completed!\n');
    }
}

// Run the test
testAllImages().catch(console.error);
