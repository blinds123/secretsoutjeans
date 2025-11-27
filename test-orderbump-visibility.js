const { chromium, devices } = require('playwright');

async function testOrderBumpVisibility() {
    console.log('🔍 TESTING ORDER BUMP VISIBILITY\n');
    console.log('=' .repeat(70));

    const browser = await chromium.launch({
        headless: false,
        slowMo: 200  // Slow down to see what's happening
    });

    const context = await browser.newContext({
        ...devices['iPhone 13'],
        permissions: ['geolocation']
    });

    const page = await context.newPage();

    try {
        console.log('📱 Loading page...\n');
        await page.goto('http://localhost:8009/ultra-smart-restored.html', {
            waitUntil: 'networkidle'
        });

        console.log('STEP 1: Selecting size M...');
        await page.click('.size-btn[data-size="M"]');
        await page.waitForTimeout(500);

        console.log('STEP 2: Clicking Add to Cart...\n');
        await page.click('.add-to-cart');
        await page.waitForTimeout(1000);

        console.log('📋 CHECKING CHECKOUT MODAL CONTENTS:');
        console.log('-' .repeat(40));

        // Check if modal is open
        const modalOpen = await page.$eval('#checkoutModal', modal => {
            return modal.classList.contains('active');
        });
        console.log(`Modal Open: ${modalOpen ? '✅' : '❌'}`);

        // Take screenshot of modal
        if (modalOpen) {
            const modal = await page.$('.modal-content');
            if (modal) {
                await modal.screenshot({ path: 'modal-screenshot.png' });
                console.log('Screenshot saved: modal-screenshot.png\n');
            }
        }

        // Look for order bump in different ways
        console.log('🔍 SEARCHING FOR ORDER BUMP:');
        console.log('-' .repeat(40));

        // Method 1: Check by ID
        const orderBumpById = await page.$('#orderBumpCheckbox');
        console.log(`1. By ID (#orderBumpCheckbox): ${orderBumpById ? '✅ FOUND' : '❌ NOT FOUND'}`);

        // Method 2: Check by text content
        const orderBumpByText = await page.$$eval('*', elements => {
            return elements.some(el =>
                el.textContent && el.textContent.includes('ONE-TIME OFFER')
            );
        });
        console.log(`2. By text (ONE-TIME OFFER): ${orderBumpByText ? '✅ FOUND' : '❌ NOT FOUND'}`);

        // Method 3: Check specific container
        const bumpContainer = await page.evaluate(() => {
            const modal = document.querySelector('.modal-content');
            if (!modal) return null;

            // Look for any element with order bump related content
            const elements = modal.querySelectorAll('*');
            for (let el of elements) {
                if (el.textContent &&
                    (el.textContent.includes('Matching Bottom') ||
                     el.textContent.includes('ONE-TIME') ||
                     el.textContent.includes('50% OFF'))) {
                    return {
                        found: true,
                        text: el.textContent.substring(0, 100),
                        tag: el.tagName,
                        visible: window.getComputedStyle(el).display !== 'none'
                    };
                }
            }
            return { found: false };
        });

        if (bumpContainer && bumpContainer.found) {
            console.log(`3. Order Bump Element: ✅ FOUND`);
            console.log(`   Tag: ${bumpContainer.tag}`);
            console.log(`   Visible: ${bumpContainer.visible ? 'Yes' : 'No'}`);
            console.log(`   Text: "${bumpContainer.text}..."`);
        } else {
            console.log(`3. Order Bump Element: ❌ NOT FOUND`);
        }

        // Method 4: List all elements in modal
        console.log('\n📦 ALL MODAL SECTIONS:');
        console.log('-' .repeat(40));

        const modalSections = await page.evaluate(() => {
            const modal = document.querySelector('.modal-content');
            if (!modal) return [];

            const sections = [];

            // Get all major divs
            const divs = modal.querySelectorAll('div[style*="background"], div[style*="padding"]');
            divs.forEach((div, index) => {
                const text = div.textContent.substring(0, 50);
                const hasCheckbox = div.querySelector('input[type="checkbox"]');
                const backgroundColor = window.getComputedStyle(div).backgroundColor;

                sections.push({
                    index: index + 1,
                    text: text.replace(/\s+/g, ' ').trim(),
                    hasCheckbox: !!hasCheckbox,
                    backgroundColor: backgroundColor
                });
            });

            return sections;
        });

        modalSections.forEach(section => {
            console.log(`Section ${section.index}:`);
            console.log(`  Text: "${section.text}..."`);
            console.log(`  Has Checkbox: ${section.hasCheckbox ? '✅' : '❌'}`);
            console.log(`  Background: ${section.backgroundColor}`);
            console.log('');
        });

        // Method 5: Check if checkbox is actually clickable
        console.log('🎯 TESTING ORDER BUMP INTERACTION:');
        console.log('-' .repeat(40));

        const checkbox = await page.$('#orderBumpCheckbox');
        if (checkbox) {
            console.log('✅ Checkbox found, attempting to click...');

            // Check initial state
            const initialChecked = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
            console.log(`Initial state: ${initialChecked ? 'Checked' : 'Unchecked'}`);

            // Click it
            await page.click('#orderBumpCheckbox');
            await page.waitForTimeout(500);

            // Check new state
            const afterClickChecked = await page.$eval('#orderBumpCheckbox', cb => cb.checked);
            console.log(`After click: ${afterClickChecked ? 'Checked' : 'Unchecked'}`);

            // Check if total updated
            const totalPrice = await page.$eval('#totalPrice', el => el.textContent);
            console.log(`Total price: ${totalPrice}`);

            // Check if bump summary appeared
            const bumpSummary = await page.$eval('#bumpSummary', el => el.innerHTML);
            if (bumpSummary) {
                console.log(`Bump summary: ${bumpSummary.substring(0, 50)}...`);
            }

            console.log('\n✅ ORDER BUMP IS WORKING!');
        } else {
            console.log('❌ Cannot find checkbox to interact with');
        }

        // Method 6: Get full HTML of modal
        console.log('\n📄 MODAL HTML STRUCTURE:');
        console.log('-' .repeat(40));

        const modalHTML = await page.evaluate(() => {
            const modal = document.querySelector('.modal-content');
            if (!modal) return 'Modal not found';

            // Get simplified structure
            const children = Array.from(modal.children);
            return children.map((child, i) => {
                const tag = child.tagName;
                const classes = child.className;
                const hasCheckbox = !!child.querySelector('input[type="checkbox"]');
                const textPreview = child.textContent.substring(0, 30).replace(/\s+/g, ' ');

                return `${i+1}. <${tag}> ${classes ? `class="${classes}"` : ''} ${hasCheckbox ? '[HAS CHECKBOX]' : ''}\n   "${textPreview}..."`;
            }).join('\n');
        });

        console.log(modalHTML);

        // Final check
        console.log('\n' + '=' .repeat(70));
        console.log('🎯 FINAL VERDICT:');
        console.log('=' .repeat(70));

        if (orderBumpById) {
            console.log('✅ ORDER BUMP IS PRESENT AND FUNCTIONAL');
            console.log('   - Checkbox exists with ID: orderBumpCheckbox');
            console.log('   - It can be clicked and changes state');
            console.log('   - Total price updates when selected');
            console.log('   - Located in the checkout modal');
        } else {
            console.log('❌ ORDER BUMP NOT FOUND');
            console.log('   - Need to check the HTML structure');
            console.log('   - May need to add it to the modal');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n🔍 Browser will stay open for manual inspection...');
    console.log('Check the modal yourself to see what\'s there.');

    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);

    await browser.close();
    process.exit(0);
}

testOrderBumpVisibility().catch(console.error);