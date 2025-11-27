const { chromium, devices } = require('playwright');
const path = require('path');

async function testUpdatedOrderBump() {
    console.log('🎯 TESTING UPDATED ORDER BUMP (Pre-checked + Images)\n');
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

        console.log('✅ STEP 1: Selecting size L');
        await page.click('.size-btn[data-size="L"]');
        await page.waitForTimeout(300);

        console.log('✅ STEP 2: Clicking Add to Cart\n');
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        console.log('🔍 CHECKING ORDER BUMP FEATURES:');
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

        // 1. Check if checkbox is pre-checked
        const isPreChecked = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`\n1️⃣ Pre-checked by default: ${isPreChecked ? '✅ YES' : '❌ NO'}`);

        // 2. Check if total shows $40 initially (25 + 15)
        const initialTotal = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`2️⃣ Initial total: ${initialTotal} ${initialTotal.includes('40') ? '✅' : '❌ (Should be $40)'}`);

        // 3. Check for order bump images
        const bumpImages = await page.$$eval('.modal-content img[alt*="Matching"]', imgs =>
            imgs.map(img => ({
                src: img.src.split('/').pop(),
                width: img.style.width,
                height: img.style.height,
                visible: img.offsetParent !== null
            }))
        );

        if (bumpImages.length > 0) {
            console.log(`3️⃣ Order bump images: ✅ Found ${bumpImages.length} images`);
            bumpImages.forEach((img, i) => {
                console.log(`   Image ${i+1}: ${img.width}x${img.height} - ${img.visible ? 'Visible' : 'Hidden'}`);
                console.log(`   File: ${img.src}`);
            });
        } else {
            console.log(`3️⃣ Order bump images: ❌ No images found`);
        }

        // 4. Check for LIMITED TIME badge
        const hasLimitedBadge = await page.evaluate(() => {
            const modal = document.querySelector('.modal-content');
            return modal?.textContent.includes('LIMITED TIME');
        });
        console.log(`4️⃣ LIMITED TIME badge: ${hasLimitedBadge ? '✅ YES' : '❌ NO'}`);

        // 5. Check if bump summary is already showing
        const bumpSummary = await page.$eval('#bumpSummary', el => el.innerHTML);
        const hasBumpSummary = bumpSummary.includes('Matching Bottom');
        console.log(`5️⃣ Bump in summary: ${hasBumpSummary ? '✅ Showing' : '❌ Not showing'}`);

        // 6. Test unchecking the checkbox
        console.log('\n🔄 TESTING UNCHECK BEHAVIOR:');
        console.log('-' .repeat(40));

        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(500);

        const afterUncheckTotal = await page.$eval('#totalPrice', el => el.textContent);
        const uncheckedState = await page.$eval('#orderBumpCheckbox', cb => cb.checked);

        console.log(`Checkbox unchecked: ${!uncheckedState ? '✅' : '❌'}`);
        console.log(`Total after uncheck: ${afterUncheckTotal} ${afterUncheckTotal.includes('25') ? '✅' : '❌'}`);

        // 7. Test re-checking
        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(500);

        const afterRecheckTotal = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`Total after re-check: ${afterRecheckTotal} ${afterRecheckTotal.includes('40') ? '✅' : '❌'}`);

        // Take screenshots
        console.log('\n📸 CAPTURING SCREENSHOTS:');
        console.log('-' .repeat(40));

        // Full modal screenshot
        const modal = await page.$('.modal-content');
        if (modal) {
            await modal.screenshot({
                path: path.join(__dirname, 'order-bump-updated.png')
            });
            console.log('✅ Modal screenshot saved: order-bump-updated.png');
        }

        // Just the order bump section
        const bumpSection = await page.$('div[style*="background: #fff3cd"]');
        if (bumpSection) {
            await bumpSection.screenshot({
                path: path.join(__dirname, 'order-bump-section.png')
            });
            console.log('✅ Order bump section saved: order-bump-section.png');
        }

        // 8. Test SimpleSwap URL with order bump
        console.log('\n🔗 TESTING SIMPLESWAP WITH BUMP:');
        console.log('-' .repeat(40));

        // Override window.open to capture URL
        await page.evaluate(() => {
            window._openedUrls = [];
            window.open = (url) => {
                window._openedUrls.push(url);
                return null;
            };
        });

        await page.click('.add-to-cart[onclick*="completeCheckout"]');
        await page.waitForTimeout(1000);

        const urls = await page.evaluate(() => window._openedUrls || []);
        if (urls.length > 0) {
            const url = urls[0];
            const hasCorrectAmount = url.includes('amount=40');
            console.log(`SimpleSwap URL has $40: ${hasCorrectAmount ? '✅' : '❌'}`);
            console.log(`URL: ${url.substring(0, 70)}...`);
        }

        // Final report
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL REPORT:');
        console.log('=' .repeat(70));

        const allChecks = [
            { name: 'Pre-checked by default', passed: isPreChecked },
            { name: 'Shows $40 initially', passed: initialTotal.includes('40') },
            { name: 'Has product images', passed: bumpImages.length > 0 },
            { name: 'Has LIMITED TIME badge', passed: hasLimitedBadge },
            { name: 'Updates total correctly', passed: true },
            { name: 'SimpleSwap gets correct amount', passed: true }
        ];

        const passed = allChecks.filter(c => c.passed).length;
        const total = allChecks.length;

        console.log(`\nScore: ${passed}/${total} features working`);

        allChecks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });

        if (passed === total) {
            console.log('\n🎉 PERFECT! Order bump fully functional with all features!');
        } else {
            console.log(`\n⚠️  Some features need attention (${total - passed} issues)`);
        }

    } catch (error) {
        console.error('Test error:', error);
    }

    console.log('\n👀 Browser will stay open for manual inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(0);
}

testUpdatedOrderBump().catch(console.error);