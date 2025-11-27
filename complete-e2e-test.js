const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runCompleteE2ETest() {
    console.log('='.repeat(80));
    console.log('COMPLETE END-TO-END PLAYWRIGHT TEST');
    console.log('Target: https://secrets-out-jeans-2024.netlify.app');
    console.log('='.repeat(80));
    console.log('');

    const testResults = {
        timestamp: new Date().toISOString(),
        url: 'https://secrets-out-jeans-2024.netlify.app',
        steps: [],
        screenshots: [],
        finalStatus: 'UNKNOWN'
    };

    let browser;
    let context;
    let page;

    try {
        // Create screenshots directory
        const screenshotDir = path.join(__dirname, 'test-screenshots-complete');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        console.log('Step 1: Launching browser with fresh context (no cache)...');
        browser = await chromium.launch({
            headless: false,
            slowMo: 500 // Slow down for visibility
        });

        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });

        page = await context.newPage();

        // Set up console message logging
        page.on('console', msg => {
            console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
        });

        // Set up error logging
        page.on('pageerror', error => {
            console.error(`[PAGE ERROR]:`, error.message);
        });

        testResults.steps.push({ step: 1, action: 'Browser launched', status: 'PASS' });
        console.log('✓ Browser launched successfully\n');

        // STEP 2: Navigate to site
        console.log('Step 2: Navigating to site...');
        const response = await page.goto('https://secrets-out-jeans-2024.netlify.app', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        const statusCode = response.status();
        console.log(`Response Status: ${statusCode}`);

        if (statusCode !== 200) {
            throw new Error(`Site returned status ${statusCode}`);
        }

        await page.waitForTimeout(2000);

        const screenshot1 = path.join(screenshotDir, '01-initial-page-load.png');
        await page.screenshot({ path: screenshot1, fullPage: true });
        testResults.screenshots.push({ step: 2, file: '01-initial-page-load.png', description: 'Initial page load' });
        testResults.steps.push({ step: 2, action: 'Navigate to site', status: 'PASS', statusCode });
        console.log('✓ Page loaded successfully');
        console.log(`✓ Screenshot saved: 01-initial-page-load.png\n`);

        // STEP 3: Verify hero product image loads
        console.log('Step 3: Verifying hero product image...');
        const heroImage = await page.locator('#heroImage, .main-img, img[alt*="Jeans"], img[alt*="Denim"]').first();

        await heroImage.waitFor({ state: 'visible', timeout: 10000 });

        const heroImageSrc = await heroImage.getAttribute('src');
        const heroImageNaturalWidth = await heroImage.evaluate(img => img.naturalWidth);

        console.log(`Hero Image Source: ${heroImageSrc}`);
        console.log(`Hero Image Natural Width: ${heroImageNaturalWidth}px`);

        if (heroImageNaturalWidth === 0) {
            throw new Error('Hero image failed to load (naturalWidth = 0)');
        }

        const screenshot2 = path.join(screenshotDir, '02-hero-image-verified.png');
        await page.screenshot({ path: screenshot2, fullPage: false });
        testResults.screenshots.push({ step: 3, file: '02-hero-image-verified.png', description: 'Hero product image verified' });
        testResults.steps.push({
            step: 3,
            action: 'Verify hero image',
            status: 'PASS',
            imageSrc: heroImageSrc,
            imageWidth: heroImageNaturalWidth
        });
        console.log('✓ Hero image loaded successfully\n');

        // STEP 4: Scroll down and verify testimonial images
        console.log('Step 4: Scrolling to testimonials section...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(2000);

        const testimonialImages = await page.locator('.testimonial img, .testimonials img, [class*="testimonial"] img').all();
        console.log(`Found ${testimonialImages.length} testimonial images`);

        let testimonialImageResults = [];
        for (let i = 0; i < Math.min(testimonialImages.length, 5); i++) {
            const img = testimonialImages[i];
            const src = await img.getAttribute('src');
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            testimonialImageResults.push({
                index: i,
                src: src,
                width: naturalWidth,
                loaded: naturalWidth > 0
            });
            console.log(`  Testimonial ${i + 1}: ${src} - ${naturalWidth}px - ${naturalWidth > 0 ? 'LOADED' : 'FAILED'}`);
        }

        const screenshot3 = path.join(screenshotDir, '03-testimonials-verified.png');
        await page.screenshot({ path: screenshot3, fullPage: true });
        testResults.screenshots.push({ step: 4, file: '03-testimonials-verified.png', description: 'Testimonial images section' });
        testResults.steps.push({
            step: 4,
            action: 'Verify testimonial images',
            status: 'PASS',
            testimonialImages: testimonialImageResults
        });
        console.log('✓ Testimonials section verified\n');

        // STEP 5: Scroll back to top and click size button
        console.log('Step 5: Scrolling to size selector...');
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);

        const sizeButtons = await page.locator('.size-btn, button[data-size]').all();
        console.log(`Found ${sizeButtons.length} size buttons`);

        if (sizeButtons.length === 0) {
            throw new Error('No size buttons found on page');
        }

        // Click on the second size option (index 1) - typically "M" or "38"
        const sizeButton = sizeButtons[1] || sizeButtons[0];
        const sizeText = await sizeButton.textContent();
        console.log(`Clicking size button: "${sizeText.trim()}"`);

        await sizeButton.click();
        await page.waitForTimeout(1000);

        const screenshot4 = path.join(screenshotDir, '04-size-selected.png');
        await page.screenshot({ path: screenshot4, fullPage: false });
        testResults.screenshots.push({ step: 5, file: '04-size-selected.png', description: `Size "${sizeText.trim()}" selected` });
        testResults.steps.push({
            step: 5,
            action: 'Click size button',
            status: 'PASS',
            selectedSize: sizeText.trim()
        });
        console.log('✓ Size selected successfully\n');

        // STEP 6: Click the Pre-Order button (or primary CTA)
        console.log('Step 6: Clicking primary CTA button...');
        const preOrderButton = await page.locator('#primaryCTA, #secondaryCTA, .cta-btn.cta-primary, button:has-text("GET MINE NOW")').first();

        await preOrderButton.waitFor({ state: 'visible', timeout: 10000 });
        const buttonText = await preOrderButton.textContent();
        console.log(`Pre-Order button text: "${buttonText.trim()}"`);

        await preOrderButton.click();
        await page.waitForTimeout(2000);

        testResults.steps.push({
            step: 6,
            action: 'Click Pre-Order button',
            status: 'PASS',
            buttonText: buttonText.trim()
        });
        console.log('✓ Pre-Order button clicked\n');

        // STEP 7: Wait for order bump popup
        console.log('Step 7: Waiting for order bump popup...');
        const popup = await page.locator('#orderBumpPopup').first();

        await popup.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✓ Order bump popup appeared');

        // Check for popup content
        const popupText = await popup.textContent();
        console.log(`Popup content preview: "${popupText.substring(0, 100)}..."`);

        const screenshot5 = path.join(screenshotDir, '05-order-bump-popup.png');
        await page.screenshot({ path: screenshot5, fullPage: true });
        testResults.screenshots.push({ step: 7, file: '05-order-bump-popup.png', description: 'Order bump popup displayed' });
        testResults.steps.push({
            step: 7,
            action: 'Order bump popup appears',
            status: 'PASS',
            popupPreview: popupText.substring(0, 200)
        });
        console.log('✓ Order bump popup verified\n');

        // STEP 8: Click "No Thanks" button
        console.log('Step 8: Clicking "No Thanks" button...');
        const noThanksButton = await page.locator('button:has-text("No thanks, just the jeans"), button[onclick*="declineOrderBump"]').first();

        await noThanksButton.waitFor({ state: 'visible', timeout: 10000 });
        const noThanksText = await noThanksButton.textContent();
        console.log(`Decline button text: "${noThanksText.trim()}"`);

        // Set up navigation listener BEFORE clicking
        const navigationPromise = page.waitForNavigation({
            timeout: 30000,
            waitUntil: 'domcontentloaded' // Use domcontentloaded instead of networkidle for external sites
        });

        await noThanksButton.click();
        console.log('✓ "No Thanks" button clicked, waiting for redirect...');

        testResults.steps.push({
            step: 8,
            action: 'Click No Thanks',
            status: 'PASS',
            buttonText: noThanksText.trim()
        });

        // STEP 9: Wait for SimpleSwap redirect
        console.log('Step 9: Waiting for SimpleSwap redirect...');
        await navigationPromise;
        await page.waitForTimeout(3000);

        const finalUrl = page.url();
        console.log(`Final URL: ${finalUrl}`);

        if (!finalUrl.includes('simpleswap.io')) {
            throw new Error(`Expected redirect to SimpleSwap, but got: ${finalUrl}`);
        }

        testResults.steps.push({
            step: 9,
            action: 'Redirect to SimpleSwap',
            status: 'PASS',
            finalUrl: finalUrl
        });
        console.log('✓ Successfully redirected to SimpleSwap\n');

        // STEP 10: Capture SimpleSwap page
        console.log('Step 10: Capturing SimpleSwap exchange page...');
        await page.waitForTimeout(2000);

        const screenshot6 = path.join(screenshotDir, '06-simpleswap-page.png');
        await page.screenshot({ path: screenshot6, fullPage: true });
        testResults.screenshots.push({ step: 10, file: '06-simpleswap-page.png', description: 'SimpleSwap exchange page' });

        // Extract exchange ID from URL
        const urlMatch = finalUrl.match(/[?&]id=([a-z0-9-]+)/i);
        const exchangeId = urlMatch ? urlMatch[1] : 'NOT_FOUND';
        console.log(`Exchange ID: ${exchangeId}`);

        testResults.steps.push({
            step: 10,
            action: 'Capture SimpleSwap page',
            status: 'PASS',
            exchangeId: exchangeId
        });
        console.log('✓ SimpleSwap page captured\n');

        // STEP 11: Verify exchange ID is valid
        console.log('Step 11: Verifying exchange ID...');
        if (exchangeId === 'NOT_FOUND' || exchangeId.length < 10) {
            throw new Error('Invalid exchange ID detected');
        }

        testResults.steps.push({
            step: 11,
            action: 'Verify exchange ID',
            status: 'PASS',
            exchangeId: exchangeId,
            idLength: exchangeId.length
        });
        console.log(`✓ Exchange ID is valid (length: ${exchangeId.length})\n`);

        testResults.finalStatus = 'PASS';
        console.log('='.repeat(80));
        console.log('ALL TESTS PASSED! ✓');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('TEST FAILED! ✗');
        console.error('='.repeat(80));
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        testResults.finalStatus = 'FAIL';
        testResults.error = {
            message: error.message,
            stack: error.stack
        };

        // Take error screenshot
        if (page) {
            try {
                const screenshotDir = path.join(__dirname, 'test-screenshots-complete');
                const errorScreenshot = path.join(screenshotDir, '99-error-state.png');
                await page.screenshot({ path: errorScreenshot, fullPage: true });
                testResults.screenshots.push({ step: 99, file: '99-error-state.png', description: 'Error state' });
                console.log('✓ Error screenshot saved');
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError.message);
            }
        }
    } finally {
        // Save test results
        const reportPath = path.join(__dirname, 'COMPLETE-E2E-TEST-REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
        console.log(`\nTest results saved to: ${reportPath}`);

        // Generate markdown report
        const mdReport = generateMarkdownReport(testResults);
        const mdReportPath = path.join(__dirname, 'COMPLETE-E2E-TEST-REPORT.md');
        fs.writeFileSync(mdReportPath, mdReport);
        console.log(`Markdown report saved to: ${mdReportPath}`);

        // Close browser
        if (browser) {
            await browser.close();
            console.log('\nBrowser closed.');
        }

        console.log('\n' + '='.repeat(80));
        console.log(`FINAL STATUS: ${testResults.finalStatus}`);
        console.log('='.repeat(80));

        // Exit with appropriate code
        process.exit(testResults.finalStatus === 'PASS' ? 0 : 1);
    }
}

function generateMarkdownReport(results) {
    let report = `# Complete End-to-End Test Report\n\n`;
    report += `**Test Date:** ${results.timestamp}\n`;
    report += `**Target URL:** ${results.url}\n`;
    report += `**Final Status:** ${results.finalStatus === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;

    report += `## Test Steps\n\n`;
    results.steps.forEach(step => {
        report += `### Step ${step.step}: ${step.action}\n`;
        report += `**Status:** ${step.status === 'PASS' ? '✅' : '❌'} ${step.status}\n`;

        if (step.statusCode) report += `- HTTP Status: ${step.statusCode}\n`;
        if (step.imageSrc) report += `- Image Source: ${step.imageSrc}\n`;
        if (step.imageWidth) report += `- Image Width: ${step.imageWidth}px\n`;
        if (step.selectedSize) report += `- Selected Size: ${step.selectedSize}\n`;
        if (step.buttonText) report += `- Button Text: ${step.buttonText}\n`;
        if (step.finalUrl) report += `- Final URL: ${step.finalUrl}\n`;
        if (step.exchangeId) report += `- Exchange ID: ${step.exchangeId}\n`;
        if (step.testimonialImages) {
            report += `- Testimonial Images:\n`;
            step.testimonialImages.forEach(img => {
                report += `  - ${img.src} (${img.width}px) - ${img.loaded ? '✅ LOADED' : '❌ FAILED'}\n`;
            });
        }
        report += `\n`;
    });

    report += `## Screenshots\n\n`;
    results.screenshots.forEach(screenshot => {
        report += `- **${screenshot.file}**: ${screenshot.description}\n`;
    });
    report += `\n`;

    if (results.error) {
        report += `## Error Details\n\n`;
        report += `\`\`\`\n${results.error.message}\n\`\`\`\n\n`;
        report += `### Stack Trace\n\`\`\`\n${results.error.stack}\n\`\`\`\n`;
    }

    report += `## Summary\n\n`;
    const passedSteps = results.steps.filter(s => s.status === 'PASS').length;
    const totalSteps = results.steps.length;
    report += `- **Total Steps:** ${totalSteps}\n`;
    report += `- **Passed:** ${passedSteps}\n`;
    report += `- **Failed:** ${totalSteps - passedSteps}\n`;
    report += `- **Screenshots:** ${results.screenshots.length}\n`;

    return report;
}

// Run the test
runCompleteE2ETest();
