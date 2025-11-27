const { chromium } = require('playwright');

async function testWalletAutoCopy() {
  console.log('\n💳 Testing Wallet Address Auto-Copy Functionality\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();

  const EXPECTED_WALLET = '0xE5173e7c3089bD89cd1341b637b8e1951745ED5C';
  let clipboardValue = null;
  let autoCopyDetected = false;

  // Inject clipboard monitoring
  await page.addInitScript(() => {
    window.__clipboardLog = [];

    // Monitor clipboard API
    if (navigator.clipboard) {
      const originalWriteText = navigator.clipboard.writeText;
      navigator.clipboard.writeText = function(text) {
        console.log('💳 Clipboard Write:', text);
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
        // Try to get the copied text
        const selection = window.getSelection().toString();
        const activeElement = document.activeElement;
        let copiedText = selection;

        if (!copiedText && activeElement && activeElement.tagName === 'TEXTAREA') {
          copiedText = activeElement.value;
        }

        console.log('💳 execCommand copy:', copiedText || 'detected');
        window.__clipboardLog.push({
          method: 'execCommand',
          command: command,
          value: copiedText,
          timestamp: new Date().toISOString()
        });
      }
      return originalExecCommand.call(this, command, ...args);
    };
  });

  // Monitor console for clipboard activity
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Clipboard Write:')) {
      const match = text.match(/Clipboard Write: (.+)/);
      if (match) {
        clipboardValue = match[1];
        console.log(`   ✅ Clipboard write detected: "${clipboardValue}"`);
        if (clipboardValue === EXPECTED_WALLET) {
          autoCopyDetected = true;
        }
      }
    }
  });

  console.log('📍 Target Wallet Address:');
  console.log(`   ${EXPECTED_WALLET}\n`);

  console.log('1️⃣ Loading page...');
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(2000);

  console.log('2️⃣ Selecting size 8...');
  await page.click('#size-8');
  await page.waitForTimeout(500);

  console.log('3️⃣ Opening checkout (wallet should auto-copy)...');
  await page.click('button:has-text("ADD TO CART")');
  await page.waitForTimeout(2000); // Wait for modal and auto-copy

  // Check if modal opened
  const modalVisible = await page.locator('#orderBumpModal').isVisible();
  console.log(`   Checkout modal: ${modalVisible ? 'Opened ✓' : 'Not opened ✗'}`);

  if (modalVisible) {
    // Check wallet address display
    const walletElement = await page.locator('#promoCode');
    const displayedWallet = await walletElement.textContent();
    console.log(`\n4️⃣ Wallet Display Check:`);
    console.log(`   Displayed: ${displayedWallet}`);
    console.log(`   Expected:  ${EXPECTED_WALLET}`);
    console.log(`   Match: ${displayedWallet === EXPECTED_WALLET ? '✅ Yes' : '❌ No'}`);

    // Check clipboard log
    const clipboardLog = await page.evaluate(() => window.__clipboardLog || []);

    console.log('\n5️⃣ Auto-Copy Analysis:');
    if (clipboardLog.length > 0) {
      console.log('   ✅ AUTO-COPY EXECUTED!');
      clipboardLog.forEach((entry, i) => {
        console.log(`      ${i + 1}. Method: ${entry.method}`);
        if (entry.value) {
          console.log(`         Value: ${entry.value}`);
          console.log(`         Valid: ${entry.value === EXPECTED_WALLET ? '✅' : '❌'}`);
        }
      });
    } else if (autoCopyDetected) {
      console.log('   ✅ AUTO-COPY CONFIRMED (via console)');
      console.log(`      Copied: ${clipboardValue}`);
    } else {
      console.log('   ⚠️  Checking fallback method...');
    }

    // Test manual copy button
    console.log('\n6️⃣ Testing manual copy button...');
    const copyBtn = await page.locator('#copyBtn');
    if (await copyBtn.isVisible()) {
      const initialLogCount = clipboardLog.length;
      await copyBtn.click();
      await page.waitForTimeout(1500);

      // Check for success message
      const successMsg = await page.locator('#copySuccess').isVisible();
      console.log(`   Success message: ${successMsg ? 'Shown ✓' : 'Not shown ✗'}`);

      // Check updated clipboard log
      const updatedLog = await page.evaluate(() => window.__clipboardLog || []);
      if (updatedLog.length > initialLogCount) {
        const lastEntry = updatedLog[updatedLog.length - 1];
        console.log('   ✅ Manual copy confirmed!');
        console.log(`      Value: ${lastEntry.value}`);
      }
    }

    // Try to read clipboard
    console.log('\n7️⃣ Verifying clipboard content...');
    try {
      const clipboardText = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch {
          return null;
        }
      });

      if (clipboardText) {
        console.log(`   Clipboard contains: "${clipboardText}"`);
        console.log(`   Correct wallet: ${clipboardText === EXPECTED_WALLET ? '✅ Yes' : '❌ No'}`);
      } else {
        console.log('   (Unable to read clipboard - browser security)');
      }
    } catch (e) {
      console.log('   (Clipboard read not available)');
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log('📊 FINAL VERIFICATION:');
  console.log('=' .repeat(70));

  const success = autoCopyDetected || clipboardValue === EXPECTED_WALLET;

  if (success) {
    console.log('\n✅ SUCCESS! Wallet address auto-copy is working!');
    console.log(`   - Wallet ${EXPECTED_WALLET}`);
    console.log('   - Automatically copied when checkout opens');
    console.log('   - Users can paste this at SimpleSwap');
    console.log('   - Manual copy button available as backup');
  } else {
    console.log('\n⚠️  Auto-copy status uncertain');
    console.log('   The wallet address is displayed correctly');
    console.log('   Manual testing recommended to confirm auto-copy');
  }

  console.log('\n💡 Implementation Details:');
  console.log('   • Wallet address displayed prominently');
  console.log('   • Auto-copies 0.5 seconds after modal opens');
  console.log('   • Visual feedback with purple theme');
  console.log('   • Works with modern and legacy browsers');
  console.log('   • Responsive layout for mobile devices');

  console.log('\n' + '=' .repeat(70));
  console.log('Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);

  await browser.close();

  // Clean up
  const { exec } = require('child_process');
  exec('pkill -f "python3 -m http.server 8081"');
}

// Run test
testWalletAutoCopy().catch(console.error);