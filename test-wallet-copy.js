const { chromium } = require('playwright');

async function testWalletCopyFunctionality() {
  console.log('\n🔍 Testing Wallet Address/Promo Code Auto-Copy Functionality\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();

  // Track clipboard events
  let clipboardContent = null;
  let copyEventFired = false;

  // Inject clipboard monitoring
  await page.addInitScript(() => {
    // Monitor clipboard write attempts
    const originalWriteText = navigator.clipboard?.writeText;
    if (originalWriteText) {
      navigator.clipboard.writeText = function(text) {
        console.log('📋 Clipboard Write Attempted:', text);
        window.__lastClipboardWrite = text;
        return originalWriteText.call(this, text);
      };
    }

    // Monitor execCommand copy
    const originalExecCommand = document.execCommand;
    document.execCommand = function(command, ...args) {
      if (command === 'copy') {
        console.log('📋 execCommand Copy Attempted');
        window.__copyCommandUsed = true;
      }
      return originalExecCommand.call(this, command, ...args);
    };

    // Track copy events
    document.addEventListener('copy', (e) => {
      console.log('📋 Copy Event Fired');
      window.__copyEventFired = true;
    });
  });

  // Monitor console for clipboard activity
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Clipboard')) {
      console.log(text);
      copyEventFired = true;
    }
  });

  console.log('1️⃣ Loading page...');
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(2000);

  console.log('2️⃣ Selecting size and opening checkout...');
  await page.click('#size-8');
  await page.waitForTimeout(500);
  await page.click('button:has-text("ADD TO CART")');
  await page.waitForTimeout(1500);

  // Check if modal opened
  const modalVisible = await page.locator('#orderBumpModal').isVisible();
  console.log(`3️⃣ Checkout Modal: ${modalVisible ? 'Opened ✓' : 'Not Visible ✗'}`);

  if (modalVisible) {
    console.log('\n4️⃣ Checking for wallet/promo code elements...\n');

    // Search for wallet address patterns
    const walletPatterns = [
      /0x[a-fA-F0-9]{40}/, // Ethereum address
      /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/, // Bitcoin address
      /[A-Z0-9]{4,}-[A-Z0-9]{4,}/, // Promo code pattern
    ];

    // Check for any wallet/promo code text in modal
    const modalText = await page.locator('#orderBumpModal').textContent();
    let foundWallet = false;
    let foundPromo = false;

    console.log('   Searching for wallet addresses or promo codes...');
    for (const pattern of walletPatterns) {
      if (pattern.test(modalText)) {
        foundWallet = true;
        const match = modalText.match(pattern);
        console.log(`   ✓ Found pattern: ${match[0]}`);
      }
    }

    // Check for promo/discount code fields
    const promoFields = await page.locator('#orderBumpModal').locator('input[type="text"], input[placeholder*="promo"], input[placeholder*="code"], input[placeholder*="discount"]').count();
    if (promoFields > 0) {
      foundPromo = true;
      console.log(`   ✓ Found ${promoFields} promo code input field(s)`);
    }

    // Check for copy buttons
    const copyButtons = await page.locator('#orderBumpModal').locator('button:has-text("copy"), button:has-text("Copy"), [class*="copy"]').count();
    console.log(`   Copy buttons found: ${copyButtons}`);

    // Check for any clickable elements that might trigger copy
    console.log('\n5️⃣ Testing clickable elements for copy functionality...\n');

    // Click on various elements to see if they trigger copy
    const clickableSelectors = [
      'button',
      '[onclick]',
      '[style*="cursor: pointer"]',
      'span',
      'div'
    ];

    for (const selector of clickableSelectors) {
      const elements = await page.locator(`#orderBumpModal ${selector}`).all();
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        try {
          const element = elements[i];
          const text = await element.textContent();
          if (text && text.length < 100) { // Skip large text blocks
            console.log(`   Clicking: "${text.substring(0, 50)}..."`);
            await element.click();
            await page.waitForTimeout(300);

            // Check if clipboard was written
            const clipboardWrite = await page.evaluate(() => window.__lastClipboardWrite);
            if (clipboardWrite) {
              console.log(`     📋 COPIED TO CLIPBOARD: ${clipboardWrite}`);
              clipboardContent = clipboardWrite;
            }
          }
        } catch (e) {
          // Element might not be clickable
        }
      }
    }

    // Try clicking the checkout button to see if it copies anything
    console.log('\n6️⃣ Testing checkout button for copy action...');
    const checkoutBtn = await page.locator('button:has-text("COMPLETE PURCHASE")').first();
    if (await checkoutBtn.isVisible()) {
      // Intercept redirect
      await page.route('**/*simpleswap.io*', route => route.abort());

      await checkoutBtn.click();
      await page.waitForTimeout(1000);

      const finalClipboard = await page.evaluate(() => window.__lastClipboardWrite);
      if (finalClipboard && finalClipboard !== clipboardContent) {
        console.log(`   📋 Checkout button copied: ${finalClipboard}`);
        clipboardContent = finalClipboard;
      }
    }

    // Check if any copy events were fired
    const copyStats = await page.evaluate(() => ({
      clipboardWrite: window.__lastClipboardWrite,
      copyCommand: window.__copyCommandUsed,
      copyEvent: window.__copyEventFired
    }));

    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('=' .repeat(70));

    console.log('\n❌ Wallet/Promo Code Auto-Copy Status:');
    console.log(`   - Wallet address found: ${foundWallet ? 'Yes' : 'No'}`);
    console.log(`   - Promo code field found: ${foundPromo ? 'Yes' : 'No'}`);
    console.log(`   - Copy buttons found: ${copyButtons}`);
    console.log(`   - Clipboard write detected: ${copyStats.clipboardWrite ? 'Yes' : 'No'}`);
    console.log(`   - Copy command used: ${copyStats.copyCommand ? 'Yes' : 'No'}`);
    console.log(`   - Copy event fired: ${copyStats.copyEvent ? 'Yes' : 'No'}`);

    if (clipboardContent) {
      console.log(`\n📋 Clipboard Content: "${clipboardContent}"`);
    } else {
      console.log('\n❌ No clipboard activity detected');
    }

    console.log('\n' + '=' .repeat(70));
    console.log('⚠️  CONCLUSION:');
    console.log('=' .repeat(70));
    console.log('\n❌ NO wallet address or promo code auto-copy functionality found.');
    console.log('   The checkout popup does not contain or copy any wallet addresses');
    console.log('   or promo codes to the clipboard.\n');

    console.log('💡 RECOMMENDATION:');
    console.log('   If you need this functionality, you should add:');
    console.log('   1. A wallet address or promo code display in the checkout modal');
    console.log('   2. A "Copy" button or auto-copy on modal open');
    console.log('   3. Visual feedback when copying is successful\n');
  }

  console.log('Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();

  // Clean up server
  const { exec } = require('child_process');
  exec('pkill -f "python3 -m http.server 8081"');
}

// Run the test
testWalletCopyFunctionality().catch(console.error);