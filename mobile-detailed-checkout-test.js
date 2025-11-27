const { chromium } = require('playwright');
const path = require('path');

async function detailedCheckoutTest() {
  console.log('Starting detailed checkout flow test on mobile...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const screenshotDir = path.join(__dirname, 'mobile-screenshots');

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('[Page Error]:', error.message);
  });

  try {
    console.log('Navigating to site...');
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✓ Site loaded\n');

    await page.waitForTimeout(2000);

    // Scroll to size selection
    console.log('Looking for size buttons...');
    await page.evaluate(() => {
      const sizeSection = document.querySelector('.size-selector, .sizes-section');
      if (sizeSection) {
        sizeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo(0, window.innerHeight * 1.5);
      }
    });
    await page.waitForTimeout(1000);

    // Get all size buttons and their states
    const sizeButtons = await page.locator('.size-btn, button[class*="size"]').all();
    console.log(`Found ${sizeButtons.length} size buttons\n`);

    if (sizeButtons.length > 0) {
      // Find first available size button
      let selectedButton = null;
      for (const btn of sizeButtons) {
        const isDisabled = await btn.getAttribute('disabled');
        const classes = await btn.getAttribute('class');
        const text = await btn.textContent();

        console.log(`Size: ${text?.trim()} - Disabled: ${isDisabled !== null} - Classes: ${classes}`);

        if (isDisabled === null && !classes?.includes('sold-out')) {
          selectedButton = btn;
        }
      }

      if (selectedButton) {
        const sizeText = await selectedButton.textContent();
        console.log(`\nSelecting size: ${sizeText?.trim()}`);

        await page.screenshot({
          path: path.join(screenshotDir, 'before-size-tap.png'),
          fullPage: false
        });

        await selectedButton.tap();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: path.join(screenshotDir, 'after-size-tap.png'),
          fullPage: false
        });

        console.log('✓ Size selected\n');
      } else {
        console.log('⚠ No available size buttons found\n');
      }
    }

    // Look for all Pre-Order buttons
    console.log('Looking for Pre-Order button...');

    const preOrderSelectors = [
      'button:has-text("Pre-Order")',
      'button:has-text("PRE-ORDER")',
      'button:has-text("$19")',
      'button[class*="preorder"]',
      'button[class*="pre-order"]',
      '.pre-order-btn',
      '.preorder-btn'
    ];

    let preOrderButton = null;
    for (const selector of preOrderSelectors) {
      const btn = page.locator(selector).first();
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        preOrderButton = btn;
        console.log(`✓ Found Pre-Order button with selector: ${selector}`);
        break;
      }
    }

    if (!preOrderButton) {
      // Try to find any button with $19 or pre-order text
      const allButtons = await page.locator('button').all();
      console.log(`\nChecking ${allButtons.length} buttons for Pre-Order text:`);

      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        const text = await btn.textContent();
        const isVisible = await btn.isVisible();

        if (isVisible && text) {
          console.log(`Button ${i + 1}: "${text.trim()}"`);

          if (text.toLowerCase().includes('pre-order') || text.includes('$19')) {
            preOrderButton = btn;
            console.log(`✓ Found Pre-Order button: "${text.trim()}"`);
            break;
          }
        }
      }
    }

    if (preOrderButton) {
      console.log('\nTapping Pre-Order button...');

      // Scroll button into view
      await preOrderButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, 'before-preorder-tap.png'),
        fullPage: false
      });

      // Check button properties before tap
      const buttonText = await preOrderButton.textContent();
      const buttonEnabled = !(await preOrderButton.isDisabled());
      console.log(`Button text: "${buttonText?.trim()}"`);
      console.log(`Button enabled: ${buttonEnabled}`);

      await preOrderButton.tap();
      console.log('✓ Button tapped');

      // Wait for popup to appear
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: path.join(screenshotDir, 'after-preorder-tap.png'),
        fullPage: false
      });

      // Check for various popup selectors
      console.log('\nChecking for popup...');
      const popupSelectors = [
        '.popup',
        '.modal',
        '[role="dialog"]',
        '.order-bump',
        '.upsell',
        '.overlay',
        '#popup',
        '#modal',
        '.popup-overlay',
        '[class*="popup"]',
        '[class*="modal"]'
      ];

      let foundPopup = false;
      for (const selector of popupSelectors) {
        const popup = page.locator(selector).first();
        const isVisible = await popup.isVisible().catch(() => false);

        if (isVisible) {
          console.log(`✓ Found popup with selector: ${selector}`);
          foundPopup = true;

          // Get popup content
          const popupHTML = await popup.innerHTML().catch(() => 'Could not get HTML');
          console.log('\nPopup content preview:');
          console.log(popupHTML.substring(0, 500) + '...\n');

          // Look for decline/close buttons
          const declineSelectors = [
            'button:has-text("No")',
            'button:has-text("Decline")',
            'button:has-text("Skip")',
            'button:has-text("No Thanks")',
            '.decline-btn',
            '.close-btn',
            '[class*="decline"]',
            'button[class*="close"]'
          ];

          let declineButton = null;
          for (const dSelector of declineSelectors) {
            const btn = popup.locator(dSelector).first();
            const btnVisible = await btn.isVisible().catch(() => false);
            if (btnVisible) {
              declineButton = btn;
              console.log(`✓ Found decline button with: ${dSelector}`);
              break;
            }
          }

          if (declineButton) {
            console.log('Tapping decline button...');
            await declineButton.tap();
            await page.waitForTimeout(2000);

            await page.screenshot({
              path: path.join(screenshotDir, 'after-decline-tap.png'),
              fullPage: false
            });

            const currentUrl = page.url();
            console.log(`Current URL: ${currentUrl}`);

            if (currentUrl.includes('checkout')) {
              console.log('✓ Successfully redirected to checkout');
            } else {
              console.log('ℹ Still on landing page');
            }
          } else {
            console.log('⚠ Could not find decline button in popup');

            // List all buttons in popup
            const popupButtons = await popup.locator('button').all();
            console.log(`\nFound ${popupButtons.length} buttons in popup:`);
            for (let i = 0; i < popupButtons.length; i++) {
              const btnText = await popupButtons[i].textContent();
              console.log(`  ${i + 1}. "${btnText?.trim()}"`);
            }
          }

          break;
        }
      }

      if (!foundPopup) {
        console.log('⚠ No popup found with any of the selectors');

        // Check if URL changed
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        if (currentUrl.includes('checkout')) {
          console.log('✓ Directly redirected to checkout (no popup)');
        }

        // Check all visible elements
        console.log('\nChecking page for any new elements...');
        const newElements = await page.evaluate(() => {
          const elements = [];
          document.querySelectorAll('*').forEach(el => {
            const zIndex = window.getComputedStyle(el).zIndex;
            if (parseInt(zIndex) > 100) {
              elements.push({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                zIndex: zIndex
              });
            }
          });
          return elements;
        });

        if (newElements.length > 0) {
          console.log('High z-index elements found:');
          console.log(JSON.stringify(newElements, null, 2));
        }
      }

    } else {
      console.log('❌ Could not find Pre-Order button');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'error-detailed.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

detailedCheckoutTest();
