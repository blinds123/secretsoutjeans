const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  const page = await context.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log('📝 Console:', text);
  });
  
  // Track network requests
  const networkRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('netlify/functions') || url.includes('simpleswap')) {
      console.log('🌐 Request:', request.method(), url);
      networkRequests.push({ method: request.method(), url });
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('netlify/functions') || url.includes('simpleswap')) {
      console.log('📥 Response:', response.status(), url);
      try {
        const text = await response.text();
        console.log('📦 Response body:', text.substring(0, 200));
      } catch (e) {
        // Ignore
      }
    }
  });
  
  console.log('\n🔍 DETAILED VERIFICATION TEST');
  console.log('=' .repeat(60));
  
  try {
    // Navigate
    console.log('\n1️⃣ Loading page...');
    await page.goto('https://secrets-out-jeans-2024.netlify.app', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ Page loaded');
    await page.waitForTimeout(2000);
    
    // Select size
    console.log('\n2️⃣ Selecting size...');
    const sizeBtn = await page.$('.size-btn');
    if (sizeBtn) {
      await sizeBtn.click();
      console.log('✅ Size selected');
      await page.waitForTimeout(1000);
    }
    
    // Find and click button
    console.log('\n3️⃣ Finding primary CTA button...');
    const primaryBtn = await page.$('#primaryCTA');
    if (!primaryBtn) {
      console.log('❌ Primary CTA button not found');
      await browser.close();
      return;
    }
    
    const btnText = await primaryBtn.textContent();
    console.log('✅ Found button:', btnText.trim().substring(0, 50));
    
    // Click and wait
    console.log('\n4️⃣ Clicking button...');
    await primaryBtn.click();
    console.log('✅ Button clicked');
    
    // Wait for redirect with timeout
    console.log('\n5️⃣ Waiting for redirect (max 15 seconds)...');
    try {
      await page.waitForURL('**/simpleswap.io/**', { timeout: 15000 });
      console.log('✅ Redirected to SimpleSwap!');
    } catch (e) {
      console.log('⚠️  Timeout waiting for SimpleSwap redirect');
    }
    
    // Check final URL
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    console.log('\n6️⃣ Final URL:', finalUrl);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    console.log('\nConsole Logs:', consoleLogs.length);
    consoleLogs.slice(-10).forEach(log => console.log('  -', log));
    
    console.log('\nNetwork Requests:', networkRequests.length);
    networkRequests.forEach(req => console.log('  -', req.method, req.url));
    
    if (finalUrl.includes('simpleswap.io')) {
      console.log('\n✅ ✅ ✅ SUCCESS ✅ ✅ ✅');
      console.log('Redirected to:', finalUrl);
    } else {
      console.log('\n❌ ❌ ❌ FAILED ❌ ❌ ❌');
      console.log('Did not redirect to SimpleSwap');
      console.log('Current URL:', finalUrl);
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
