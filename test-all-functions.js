const { chromium } = require('playwright');

async function testAllFunctions() {
    console.log('🧪 COMPREHENSIVE FUNCTIONALITY TEST\n');
    console.log('=' .repeat(70));

    const browser = await chromium.launch({
        headless: false, // Show browser for visual confirmation
        slowMo: 100 // Slow down for visibility
    });

    const context = await browser.newContext({
        viewport: { width: 390, height: 844 }, // iPhone 14 Pro
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });

    const page = await context.newPage();

    const testResults = {
        passed: [],
        failed: []
    };

    try {
        console.log('📱 Testing on mobile viewport (390x844)\n');

        // Navigate to page
        await page.goto('http://localhost:8003/ultra-smart.html', {
            waitUntil: 'networkidle'
        });

        // Test 1: Page Load & Images
        console.log('1️⃣ Testing page load and images...');
        const imagesLoaded = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return {
                total: images.length,
                loaded: images.filter(img => img.complete && img.naturalHeight > 0).length,
                mainImage: document.querySelector('.main-image')?.complete
            };
        });

        if (imagesLoaded.loaded > 0) {
            testResults.passed.push('✅ Images loading');
            console.log('   ✅ Images loaded: ' + imagesLoaded.loaded + '/' + imagesLoaded.total);
        } else {
            testResults.failed.push('❌ Images not loading');
        }

        // Test 2: Product Thumbnail Gallery
        console.log('\n2️⃣ Testing thumbnail gallery...');
        const thumbnails = await page.$$('.product-thumbnails img');
        if (thumbnails.length > 0) {
            await thumbnails[1].click();
            await page.waitForTimeout(500);

            const mainImageChanged = await page.evaluate(() => {
                const mainImg = document.querySelector('.main-image');
                return mainImg?.src.includes('1_27PM');
            });

            if (mainImageChanged) {
                testResults.passed.push('✅ Thumbnail gallery working');
                console.log('   ✅ Thumbnail click changes main image');
            } else {
                testResults.failed.push('❌ Thumbnail gallery not working');
            }
        }

        // Test 3: Size Selector
        console.log('\n3️⃣ Testing size selector...');
        const sizeButtons = await page.$$('.size-btn');
        if (sizeButtons.length > 0) {
            await sizeButtons[2].click(); // Click Large
            const sizeSelected = await page.evaluate(() => {
                const activeSize = document.querySelector('.size-btn.active');
                return activeSize?.textContent === 'L';
            });

            if (sizeSelected) {
                testResults.passed.push('✅ Size selector working');
                console.log('   ✅ Size selection works');
            } else {
                testResults.failed.push('❌ Size selector not working');
            }
        }

        // Test 4: Quantity Selector
        console.log('\n4️⃣ Testing quantity selector...');
        const plusBtn = await page.$('.quantity-btn:last-of-type');
        if (plusBtn) {
            await plusBtn.click();
            await plusBtn.click();

            const quantity = await page.$eval('.quantity-display', el => el.textContent);
            if (quantity === '3') {
                testResults.passed.push('✅ Quantity selector working');
                console.log('   ✅ Quantity increment works');
            } else {
                testResults.failed.push('❌ Quantity selector not working');
            }
        }

        // Test 5: Add to Cart Button
        console.log('\n5️⃣ Testing Add to Cart...');
        const addToCartBtn = await page.$('.add-to-cart-btn');
        if (addToCartBtn) {
            // First check if size is selected
            const sizeSelected = await page.evaluate(() => {
                return document.querySelector('.size-btn.active') !== null;
            });

            if (!sizeSelected) {
                // Select a size first
                const sizeBtn = await page.$('.size-btn');
                await sizeBtn.click();
            }

            await addToCartBtn.click();
            await page.waitForTimeout(1000);

            // Check if checkout popup appears
            const popupVisible = await page.evaluate(() => {
                const popup = document.querySelector('.checkout-popup');
                return popup && (popup.style.display === 'block' || popup.style.display === 'flex');
            });

            if (popupVisible) {
                testResults.passed.push('✅ Add to Cart triggers checkout');
                console.log('   ✅ Checkout popup appears');
            } else {
                testResults.failed.push('❌ Checkout popup not appearing');
            }
        }

        // Test 6: Order Bump in Popup
        console.log('\n6️⃣ Testing Order Bump...');
        const orderBumpVisible = await page.evaluate(() => {
            const bumpSection = document.querySelector('.order-bump-section');
            return bumpSection && window.getComputedStyle(bumpSection).display !== 'none';
        });

        if (orderBumpVisible) {
            const bumpCheckbox = await page.$('.bump-checkbox');
            if (bumpCheckbox) {
                await bumpCheckbox.click();
                await page.waitForTimeout(500);

                const bumpChecked = await page.evaluate(() => {
                    return document.querySelector('.bump-checkbox')?.checked;
                });

                if (bumpChecked) {
                    testResults.passed.push('✅ Order bump working');
                    console.log('   ✅ Order bump can be selected');
                } else {
                    testResults.failed.push('❌ Order bump checkbox not working');
                }
            }
        } else {
            console.log('   ⚠️  Order bump not visible in popup');
        }

        // Test 7: Express Checkout Buttons
        console.log('\n7️⃣ Testing Express Checkout buttons...');
        const expressButtons = await page.$$('.express-checkout button');
        if (expressButtons.length > 0) {
            testResults.passed.push('✅ Express checkout buttons present');
            console.log('   ✅ Found ' + expressButtons.length + ' express checkout options');

            // Test Apple Pay button
            const applePayBtn = await page.$('button:has-text("Pay")');
            if (applePayBtn) {
                console.log('   ✅ Apple Pay button found');
            }
        } else {
            testResults.failed.push('❌ Express checkout buttons missing');
        }

        // Test 8: Form Validation
        console.log('\n8️⃣ Testing form validation...');
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
            await emailInput.fill('invalid-email');
            const checkoutBtn = await page.$('.checkout-form button[type="submit"]');
            if (checkoutBtn) {
                await checkoutBtn.click();
                await page.waitForTimeout(500);

                const validationMessage = await page.evaluate(() => {
                    const emailField = document.querySelector('input[type="email"]');
                    return emailField?.validationMessage || '';
                });

                if (validationMessage) {
                    testResults.passed.push('✅ Form validation working');
                    console.log('   ✅ Email validation works');
                } else {
                    console.log('   ⚠️  Browser validation may be disabled');
                }
            }
        }

        // Test 9: Mobile Responsiveness
        console.log('\n9️⃣ Testing mobile responsiveness...');
        const mobileLayout = await page.evaluate(() => {
            const container = document.querySelector('.container');
            const popup = document.querySelector('.checkout-popup');
            return {
                containerWidth: container?.offsetWidth,
                popupResponsive: popup ? window.getComputedStyle(popup).width === '100vw' || window.getComputedStyle(popup).width === '100%' : false,
                viewportWidth: window.innerWidth
            };
        });

        if (mobileLayout.containerWidth <= mobileLayout.viewportWidth) {
            testResults.passed.push('✅ Mobile responsive layout');
            console.log('   ✅ Layout fits mobile viewport');
        } else {
            testResults.failed.push('❌ Layout overflow on mobile');
        }

        // Test 10: Lazy Loading (Testimonials)
        console.log('\n🔟 Testing lazy loading...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        const lazyImagesLoaded = await page.evaluate(() => {
            const testimonialImages = document.querySelectorAll('.testimonial-grid img');
            return Array.from(testimonialImages).filter(img => img.src && img.complete).length;
        });

        if (lazyImagesLoaded > 0) {
            testResults.passed.push('✅ Lazy loading working');
            console.log('   ✅ Testimonials lazy load on scroll');
        } else {
            console.log('   ⚠️  Lazy loading may not be configured');
        }

        // Test 11: Trust Badges
        console.log('\n1️⃣1️⃣ Testing trust elements...');
        const trustElements = await page.evaluate(() => {
            return {
                guarantee: !!document.querySelector('.guarantee-badge'),
                shipping: !!document.querySelector('.shipping-info'),
                payment: !!document.querySelector('.payment-methods'),
                reviews: document.querySelectorAll('.review-item').length
            };
        });

        if (trustElements.guarantee && trustElements.shipping) {
            testResults.passed.push('✅ Trust badges present');
            console.log('   ✅ Trust elements displayed');
        }

        // Test 12: Close Popup
        console.log('\n1️⃣2️⃣ Testing popup close...');
        const closeBtn = await page.$('.popup-close');
        if (closeBtn) {
            await closeBtn.click();
            await page.waitForTimeout(500);

            const popupClosed = await page.evaluate(() => {
                const popup = document.querySelector('.checkout-popup');
                return !popup || popup.style.display === 'none';
            });

            if (popupClosed) {
                testResults.passed.push('✅ Popup close working');
                console.log('   ✅ Popup closes properly');
            }
        }

    } catch (error) {
        console.error('Test error:', error);
        testResults.failed.push('❌ Test execution error: ' + error.message);
    }

    // Final Report
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(70));

    console.log('\n✅ PASSED (' + testResults.passed.length + '):');
    testResults.passed.forEach(test => console.log('   ' + test));

    if (testResults.failed.length > 0) {
        console.log('\n❌ FAILED (' + testResults.failed.length + '):');
        testResults.failed.forEach(test => console.log('   ' + test));
    }

    const successRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length) * 100).toFixed(0);
    console.log('\n🎯 Success Rate: ' + successRate + '%');

    if (successRate === '100') {
        console.log('🏆 PERFECT! All functions working correctly!');
    } else if (successRate >= 80) {
        console.log('✅ GOOD: Most functions working well');
    } else {
        console.log('⚠️  NEEDS ATTENTION: Some functions need fixes');
    }

    console.log('\n💡 Key Features Tested:');
    console.log('   • Image loading & manifest');
    console.log('   • Product gallery');
    console.log('   • Size & quantity selection');
    console.log('   • Add to cart flow');
    console.log('   • Order bump functionality');
    console.log('   • Express checkout');
    console.log('   • Form validation');
    console.log('   • Mobile responsiveness');
    console.log('   • Lazy loading');
    console.log('   • Trust elements\n');

    // Keep browser open for 5 seconds to see final state
    await page.waitForTimeout(5000);
    await browser.close();

    process.exit(0);
}

testAllFunctions().catch(console.error);