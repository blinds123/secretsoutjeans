const { chromium, devices } = require('playwright');

(async () => {
  const iPhone = devices['iPhone 14 Pro'];
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ...iPhone,
    viewport: { width: 393, height: 852 }
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:8080/index.html');
  
  // Test viewport
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  }));
  
  console.log('iPhone Viewport:', viewport);
  
  // Check hero image
  const heroImage = await page.evaluate(() => {
    const img = document.getElementById('heroImage');
    return {
      width: img.clientWidth,
      height: img.clientHeight,
      naturalWidth: img.naturalWidth,
      src: img.src
    };
  });
  
  console.log('Hero Image:', heroImage);
  
  // Check if page is scrollable horizontally (bad for mobile)
  const scrollable = await page.evaluate(() => {
    return {
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      horizontalScroll: document.body.scrollWidth > window.innerWidth
    };
  });
  
  console.log('Horizontal Scroll Issue:', scrollable);
  
  // Check all images
  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      alt: img.alt.substring(0, 20),
      width: img.clientWidth,
      loaded: img.complete
    }));
  });
  
  console.log('Total images:', images.length);
  console.log('Images wider than viewport:', images.filter(img => img.width > 393).length);
  
  setTimeout(() => browser.close(), 10000);
})();
