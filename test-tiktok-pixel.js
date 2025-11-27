const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple HTTP server to serve the HTML file
function startServer(port = 8080) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

      // Handle image requests
      if (req.url.includes('/images/') || req.url.includes('/checkout-video-mobile/')) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.webp': 'image/webp',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.mp4': 'video/mp4'
        };

        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(404);
          res.end();
        }
        return;
      }

      // Serve HTML
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function testTikTokPixel() {
  console.log('\n🔍 Starting TikTok Pixel Test...\n');

  // Start local server
  const server = await startServer(8080);

  try {
    const browser = await chromium.launch({
      headless: false,
      devtools: true
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Array to store captured TikTok events
    const tiktokEvents = [];

    // Intercept network requests to TikTok analytics
    page.on('request', request => {
      const url = request.url();
      if (url.includes('analytics.tiktok.com')) {
        console.log(`📡 TikTok Request: ${url.substring(0, 100)}...`);

        // Parse URL parameters for event data
        if (url.includes('pixel/events')) {
          console.log('✅ TikTok Pixel loaded successfully!');
        }

        // Check for specific events in the URL
        const urlParams = new URL(url).searchParams;
        const event = urlParams.get('event');
        if (event) {
          tiktokEvents.push({
            event: event,
            url: url,
            time: new Date().toISOString()
          });
        }
      }
    });

    // Also monitor console for ttq calls
    page.on('console', async msg => {
      const text = msg.text();
      if (text.includes('ttq') || text.includes('TikTok')) {
        console.log(`📱 Console: ${text}`);
      }
    });

    // Inject script to monitor ttq calls directly
    await page.addInitScript(() => {
      window.tiktokPixelEvents = [];

      // Wait for ttq to be available
      const checkTTQ = setInterval(() => {
        if (window.ttq && window.ttq.track) {
          clearInterval(checkTTQ);

          // Wrap the track function
          const originalTrack = window.ttq.track;
          window.ttq.track = function(eventName, parameters) {
            console.log(`🎯 TikTok Event Fired: ${eventName}`, parameters);
            window.tiktokPixelEvents.push({
              event: eventName,
              parameters: parameters,
              timestamp: new Date().toISOString()
            });

            // Call original function
            return originalTrack.apply(this, arguments);
          };
        }
      }, 100);
    });

    // Navigate to the page
    console.log('\n📄 Loading page...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if pixel is loaded
    const pixelLoaded = await page.evaluate(() => {
      return typeof window.ttq !== 'undefined';
    });

    console.log(`\n✅ TikTok Pixel Loaded: ${pixelLoaded ? 'YES' : 'NO'}`);

    if (pixelLoaded) {
      // Check pixel ID
      const pixelCheck = await page.evaluate(() => {
        // Check if the correct pixel ID is in the page source
        return document.documentElement.innerHTML.includes('D3CVHNBC77U2RE92M7O0');
      });

      console.log(`✅ Correct Pixel ID (D3CVHNBC77U2RE92M7O0): ${pixelCheck ? 'FOUND' : 'NOT FOUND'}`);
    }

    // Get initial events (should include ViewContent)
    let events = await page.evaluate(() => window.tiktokPixelEvents || []);
    console.log('\n📊 Initial Events Fired:');
    events.forEach(e => console.log(`  - ${e.event}`, e.parameters ? `(value: $${e.parameters.value})` : ''));

    // Test 1: Select a size
    console.log('\n🧪 Test 1: Selecting size...');
    await page.click('#size-8');
    await page.waitForTimeout(500);

    // Test 2: Click Add to Cart
    console.log('🧪 Test 2: Clicking Add to Cart...');
    await page.click('button:has-text("ADD TO CART - $69")');
    await page.waitForTimeout(1000);

    // Get events after Add to Cart
    events = await page.evaluate(() => window.tiktokPixelEvents || []);
    const addToCartEvent = events.find(e => e.event === 'AddToCart');
    console.log(`✅ AddToCart Event: ${addToCartEvent ? 'FIRED' : 'NOT FIRED'}`);
    if (addToCartEvent) {
      console.log(`   Price: $${addToCartEvent.parameters?.price}`);
      console.log(`   Product: ${addToCartEvent.parameters?.content_name}`);
    }

    // Check if InitiateCheckout fired
    const initiateCheckoutEvent = events.find(e => e.event === 'InitiateCheckout');
    console.log(`✅ InitiateCheckout Event: ${initiateCheckoutEvent ? 'FIRED' : 'NOT FIRED'}`);

    // Test 3: Wait for checkout modal and click purchase button
    console.log('\n🧪 Test 3: Testing Purchase Event...');

    // Check if order bump checkbox exists and check it
    const orderBumpExists = await page.locator('#orderBumpCheckbox').count() > 0;
    if (orderBumpExists) {
      console.log('   Checking order bump...');
      await page.check('#orderBumpCheckbox');
      await page.waitForTimeout(500);
    }

    // Intercept the redirect to capture the purchase event
    let purchaseEventFired = false;
    let redirectUrl = null;

    // Enable request interception
    await page.route('**/*simpleswap.io*', route => {
      redirectUrl = route.request().url();
      route.abort();
    });

    // Click the purchase button
    console.log('   Clicking Complete Purchase button...');
    await page.click('button:has-text("COMPLETE PURCHASE")');
    await page.waitForTimeout(1000);

    // Get final events
    events = await page.evaluate(() => window.tiktokPixelEvents || []);
    const purchaseEvent = events.find(e => e.event === 'Purchase');

    console.log(`\n✅ Purchase Event: ${purchaseEvent ? 'FIRED' : 'NOT FIRED'}`);
    if (purchaseEvent) {
      console.log(`   Total Price: $${purchaseEvent.parameters?.value}`);
      console.log(`   Product: ${purchaseEvent.parameters?.content_name}`);
      console.log(`   Currency: ${purchaseEvent.parameters?.currency}`);
      purchaseEventFired = true;
    }

    if (redirectUrl) {
      console.log(`\n✅ SimpleSwap Redirect URL: ${redirectUrl}`);
      const amount = redirectUrl.match(/amount=(\d+)/);
      if (amount) {
        console.log(`   Amount passed to SimpleSwap: $${amount[1]}`);
      }
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL TEST SUMMARY:');
    console.log('='.repeat(60));

    console.log(`\n✅ TikTok Pixel Implementation:`);
    console.log(`   - Pixel Loaded: ${pixelLoaded ? '✓' : '✗'}`);
    console.log(`   - Correct Pixel ID: ${pixelCheck ? '✓' : '✗'}`);

    console.log(`\n✅ Event Tracking:`);
    console.log(`   - ViewContent: ${events.find(e => e.event === 'ViewContent') ? '✓' : '✗'}`);
    console.log(`   - AddToCart: ${addToCartEvent ? '✓' : '✗'}`);
    console.log(`   - InitiateCheckout: ${initiateCheckoutEvent ? '✓' : '✗'}`);
    console.log(`   - Purchase: ${purchaseEvent ? '✓' : '✗'}`);

    console.log(`\n📊 All Events Captured (${events.length} total):`);
    events.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.event} ${e.parameters?.value ? `($${e.parameters.value})` : ''}`);
    });

    console.log('\n' + '='.repeat(60));

    if (pixelLoaded && pixelCheck && purchaseEventFired) {
      console.log('🎉 SUCCESS: TikTok Pixel is working correctly!');
    } else {
      console.log('⚠️  WARNING: Some issues detected with TikTok Pixel implementation');
    }

    console.log('='.repeat(60) + '\n');

    // Keep browser open for 5 seconds to observe
    console.log('Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);

    await browser.close();

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    server.close();
    console.log('Server stopped.');
  }
}

// Run the test
testTikTokPixel().catch(console.error);