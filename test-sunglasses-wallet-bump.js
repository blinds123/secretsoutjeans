const { chromium, devices } = require('playwright');
const path = require('path');

async function testSunglassesWalletBump() {
    console.log('🕶️💼 TESTING SUNGLASSES & WALLET ORDER BUMP ($10)\n');
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

        console.log('🔍 CHECKING ORDER BUMP DETAILS:');
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

        // 1. Check if order bump text is correct
        const bumpText = await page.$eval('.modal-content', modal => {
            const text = modal.textContent;
            return {
                hasSunglasses: text.includes('Sunglasses'),
                hasWallet: text.includes('Wallet'),
                hasOldText: text.includes('Matching Bottom')
            };
        });

        console.log(`\n1️⃣ Order Bump Text:`);
        console.log(`   Sunglasses mentioned: ${bumpText.hasSunglasses ? '✅' : '❌'}`);
        console.log(`   Wallet mentioned: ${bumpText.hasWallet ? '✅' : '❌'}`);
        console.log(`   Old text removed: ${!bumpText.hasOldText ? '✅' : '❌ (Still says "Matching Bottom")'}`);

        // 2. Check pricing
        const pricing = await page.evaluate(() => {
            const modal = document.querySelector('.modal-content');
            const priceText = modal?.textContent || '';
            return {
                hasStrikethrough25: priceText.includes('$25'),
                hasPrice10: priceText.includes('$10'),
                has60Percent: priceText.includes('60%')
            };
        });

        console.log(`\n2️⃣ Pricing:`);
        console.log(`   Strikethrough $25: ${pricing.hasStrikethrough25 ? '✅' : '❌'}`);
        console.log(`   Sale price $10: ${pricing.hasPrice10 ? '✅' : '❌'}`);
        console.log(`   60% OFF badge: ${pricing.has60Percent ? '✅' : '❌'}`);

        // 3. Check images
        const bumpImages = await page.$$eval('div[style*="background: #fff3cd"] img', imgs =>
            imgs.map(img => ({
                src: img.src.split('/').slice(-2).join('/'),
                alt: img.alt,
                loaded: img.complete && img.naturalHeight > 0
            }))
        );

        console.log(`\n3️⃣ Order Bump Images:`);
        if (bumpImages.length === 2) {
            console.log(`   ✅ Found 2 images`);
            bumpImages.forEach((img, i) => {
                const productName = img.alt.toLowerCase().includes('sunglasses') ? 'Sunglasses' :
                                  img.alt.toLowerCase().includes('wallet') ? 'Wallet' : 'Unknown';
                console.log(`   ${i+1}. ${productName}: ${img.loaded ? '✅ Loaded' : '❌ Not loaded'}`);
                console.log(`      Path: ${img.src}`);
            });
        } else {
            console.log(`   ❌ Expected 2 images, found ${bumpImages.length}`);
        }

        // 4. Check if checkbox is pre-checked
        const isPreChecked = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
        console.log(`\n4️⃣ Pre-checked by default: ${isPreChecked ? '✅ YES' : '❌ NO'}`);

        // 5. Check initial total (should be $35 with bump)
        const initialTotal = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`5️⃣ Initial total: ${initialTotal} ${initialTotal.includes('35') ? '✅' : '❌ (Should be $35)'}`);

        // 6. Test unchecking
        console.log('\n🔄 TESTING CHECKBOX BEHAVIOR:');
        console.log('-' .repeat(40));

        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(500);

        const afterUncheckTotal = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`After uncheck: ${afterUncheckTotal} ${afterUncheckTotal.includes('25') ? '✅ ($25 base)' : '❌'}`);

        // 7. Test re-checking
        await page.click('#orderBumpCheckbox');
        await page.waitForTimeout(500);

        const afterRecheckTotal = await page.$eval('#totalPrice', el => el.textContent);
        console.log(`After re-check: ${afterRecheckTotal} ${afterRecheckTotal.includes('35') ? '✅ ($35 total)' : '❌'}`);

        // 8. Check order summary updates
        const bumpSummary = await page.$eval('#bumpSummary', el => el.textContent);
        const summaryCorrect = bumpSummary.includes('Sunglasses & Wallet') && bumpSummary.includes('$10');
        console.log(`Order summary: ${summaryCorrect ? '✅ Shows "Sunglasses & Wallet $10"' : '❌ Incorrect'}`);

        // 9. Test SimpleSwap URL
        console.log('\n🔗 TESTING SIMPLESWAP URL:');
        console.log('-' .repeat(40));

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
            const hasCorrectAmount = url.includes('amount=35');
            console.log(`SimpleSwap URL has $35: ${hasCorrectAmount ? '✅' : '❌'}`);
            console.log(`URL contains: amount=${url.match(/amount=(\d+)/)?.[1] || 'unknown'}`);
        }

        // Take screenshots
        console.log('\n📸 CAPTURING SCREENSHOTS:');
        console.log('-' .repeat(40));

        const bumpSection = await page.$('div[style*="background: #fff3cd"]');
        if (bumpSection) {
            await bumpSection.screenshot({
                path: path.join(__dirname, 'sunglasses-wallet-bump.png')
            });
            console.log('✅ Order bump screenshot saved');
        }

        // Final report
        console.log('\n' + '=' .repeat(70));
        console.log('📊 FINAL REPORT:');
        console.log('=' .repeat(70));

        const allChecks = [
            { name: 'Shows "Sunglasses & Wallet"', passed: bumpText.hasSunglasses && bumpText.hasWallet },
            { name: 'Price is $10 (60% OFF)', passed: pricing.hasPrice10 && pricing.has60Percent },
            { name: 'Pre-checked by default', passed: isPreChecked },
            { name: 'Shows $35 total initially', passed: initialTotal.includes('35') },
            { name: 'Has sunglasses & wallet images', passed: bumpImages.length === 2 },
            { name: 'Updates total correctly', passed: afterUncheckTotal.includes('25') && afterRecheckTotal.includes('35') },
            { name: 'SimpleSwap gets $35', passed: urls[0]?.includes('amount=35') }
        ];

        const passed = allChecks.filter(c => c.passed).length;
        const total = allChecks.length;

        console.log(`\nScore: ${passed}/${total} features working`);

        allChecks.forEach(check => {
            console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
        });

        if (passed === total) {
            console.log('\n🎉 PERFECT! Sunglasses & Wallet bump fully functional!');
            console.log('   • Shows correct products (sunglasses & wallet)');
            console.log('   • Correct pricing ($10, 60% OFF from $25)');
            console.log('   • Pre-checked with $35 total');
            console.log('   • SimpleSwap integration correct');
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

testSunglassesWalletBump().catch(console.error);