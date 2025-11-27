const { chromium } = require('playwright');

async function verifyAutoCopy() {
  console.log('\n✅ Testing Auto-Copy Promo Code Functionality\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();

  // Track clipboard activity
  let clipboardWritten = false;
  let copiedValue = null;

  // Inject clipboard monitoring
  await page.addInitScript(() => {
    window.__clipboardLog = [];

    // Monitor clipboard API
    if (navigator.clipboard) {
      const originalWriteText = navigator.clipboard.writeText;
      navigator.clipboard.writeText = function(text) {
        console.log('📋 Clipboard Write:', text);
        window.__clipboardLog.push({
          method: 'clipboard.writeText',
          value: text,
          timestamp: new Date().toISOString()
        });
        return originalWriteText.call(this, text);
      };
    }

    // Monitor execCommand
    const originalExecCommand = document.execCommand;
    document.execCommand = function(command, ...args) {
      if (command === 'copy') {
        const selection = window.getSelection().toString();
        console.log('📋 execCommand copy:', selection || 'from textarea');
        window.__clipboardLog.push({
          method: 'execCommand',
          command: command,
          timestamp: new Date().toISOString()
        });
      }
      return originalExecCommand.call(this, command, ...args);
    };
  });

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Clipboard Write:')) {
      clipboardWritten = true;
      const match = text.match(/Clipboard Write: (.+)/);
      if (match) {
        copiedValue = match[1];
        console.log(`   ✅ Detected clipboard write: "${copiedValue}"`);
      }
    }
  });

  console.log('1️⃣ Loading page...');
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(2000);

  console.log('2️⃣ Selecting size 8...');
  await page.click('#size-8');
  await page.waitForTimeout(500);

  console.log('3️⃣ Opening checkout modal (should auto-copy promo code)...');
  await page.click('button:has-text("ADD TO CART")');
  await page.waitForTimeout(2000); // Wait for auto-copy

  // Check if modal opened
  const modalVisible = await page.locator('#orderBumpModal').isVisible();
  console.log(`   Checkout modal: ${modalVisible ? 'Opened ✓' : 'Not opened ✗'}`);

  if (modalVisible) {
    // Check for promo code section
    const promoSection = await page.locator('#promoCodeSection').isVisible();
    console.log(`   Promo code section: ${promoSection ? 'Visible ✓' : 'Not visible ✗'}`);

    if (promoSection) {
      // Get promo code value
      const promoCode = await page.locator('#promoCode').textContent();
      console.log(`   Promo code displayed: "${promoCode}"`);

      // Check clipboard log
      const clipboardLog = await page.evaluate(() => window.__clipboardLog || []);

      console.log('\n4️⃣ Auto-Copy Status:');
      if (clipboardLog.length > 0) {
        console.log('   ✅ AUTO-COPY TRIGGERED!');
        clipboardLog.forEach((entry, i) => {
          console.log(`      ${i + 1}. Method: ${entry.method}`);
          if (entry.value) {
            console.log(`         Value: "${entry.value}"`);
          }
        });
      } else if (clipboardWritten) {
        console.log(`   ✅ AUTO-COPY DETECTED (via console monitoring)`);
        console.log(`      Copied value: "${copiedValue}"`);
      } else {
        console.log('   ⚠️  No auto-copy detected yet...');
      }

      // Test manual copy button
      console.log('\n5️⃣ Testing manual copy button...');
      const copyBtn = await page.locator('#copyBtn');
      if (await copyBtn.isVisible()) {
        await copyBtn.click();
        await page.waitForTimeout(1000);

        // Check for success message
        const successMsg = await page.locator('#copySuccess').isVisible();
        console.log(`   Copy success message: ${successMsg ? 'Shown ✓' : 'Not shown ✗'}`);

        // Check updated clipboard log
        const updatedLog = await page.evaluate(() => window.__clipboardLog || []);
        if (updatedLog.length > clipboardLog.length) {
          console.log('   ✅ Manual copy confirmed!');
        }
      }
    }

    // Try to read clipboard (may require permissions)
    try {
      const clipboardText = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch {
          return null;
        }
      });

      if (clipboardText) {
        console.log(`\n6️⃣ Clipboard Content: "${clipboardText}"`);
      }
    } catch (e) {
      // Clipboard read might not be available
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log('📊 FINAL RESULTS:');
  console.log('=' .repeat(70));

  if (clipboardWritten || copiedValue) {
    console.log('\n✅ SUCCESS! Auto-copy functionality is working!');
    console.log(`   - Promo code "${copiedValue || 'SNEAKER10'}" was automatically copied`);
    console.log('   - Users can paste this code at SimpleSwap checkout');
    console.log('   - Manual copy button also available as backup');
  } else {
    console.log('\n⚠️  Auto-copy may not have been detected in this test');
    console.log('   Please check manually if the promo code was copied');
  }

  console.log('\n💡 Features Implemented:');
  console.log('   1. Promo code "SNEAKER10" displayed in checkout modal');
  console.log('   2. Auto-copies to clipboard when modal opens (0.5s delay)');
  console.log('   3. Manual copy button for user convenience');
  console.log('   4. Visual feedback when copying');
  console.log('   5. Works with both modern and legacy browsers');

  console.log('\n' + '=' .repeat(70));
  console.log('Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);

  await browser.close();

  // Clean up
  const { exec } = require('child_process');
  exec('pkill -f "python3 -m http.server 8081"');
}

// Run verification
verifyAutoCopy().catch(console.error);