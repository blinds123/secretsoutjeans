# Playwright MCP Audit Checklist for Template Conversion

## Complete End-to-End Testing Protocol

### 🎯 Pre-Flight Checklist
- [ ] All product images uploaded to correct folders
- [ ] Template copied to new directory
- [ ] Product information documented
- [ ] Color hex code identified

### 📱 Device Testing Matrix

#### Desktop (1920x1080)
- [ ] Full page loads without errors
- [ ] All images display correctly
- [ ] No layout breaks
- [ ] Hover states work
- [ ] Animations smooth

#### Tablet (768x1024)
- [ ] Layout adapts properly
- [ ] Touch targets adequate
- [ ] No horizontal scroll
- [ ] Images scale correctly

#### Mobile (393x852 - iPhone 14 Pro)
- [ ] No horizontal scroll
- [ ] Product image fully visible
- [ ] Thumbnails below image
- [ ] Sticky cart button works
- [ ] Text readable

### 🔍 Visual Verification Tests

```javascript
// Playwright test sequence to run
async function visualAudit() {
  // 1. Check main product image visibility
  const heroImage = await page.$('#heroImage');
  const isFullyVisible = await heroImage.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.bottom <= window.innerHeight;
  });

  // 2. Verify color consistency
  const primaryColor = await page.evaluate(() => {
    const stars = document.querySelectorAll('.star');
    return window.getComputedStyle(stars[0]).color;
  });

  // 3. Check text updates
  const brandMentions = await page.evaluate((oldBrand) => {
    return document.body.innerText.split(oldBrand).length - 1;
  }, 'Netlify');

  return { isFullyVisible, primaryColor, brandMentions };
}
```

### ✅ Functional Testing Checklist

#### Image Gallery
- [ ] Main image loads
- [ ] Thumbnail 1 click → updates main
- [ ] Thumbnail 2 click → updates main
- [ ] Thumbnail 3 click → updates main
- [ ] Thumbnail 4 click → updates main
- [ ] Image zoom on hover (desktop)
- [ ] Swipe gesture (mobile)

#### Product Selection
- [ ] Size buttons clickable
- [ ] Selected size highlighted
- [ ] Sold out sizes disabled
- [ ] Size guide opens
- [ ] Size guide closes

#### Add to Cart Flow
- [ ] Regular "Add to Cart" works
- [ ] Button shows loading state
- [ ] Pre-order button works
- [ ] Order bump popup appears
- [ ] Accept button functional
- [ ] Decline button functional
- [ ] X close button works
- [ ] Backdrop click closes

#### Mobile Sticky Cart
- [ ] Appears on scroll down
- [ ] Hides on scroll up
- [ ] Button fully visible
- [ ] Text not cut off
- [ ] Click works properly

### 📊 Performance Metrics

```javascript
async function performanceAudit() {
  const metrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    };
  });

  // Target metrics
  const targets = {
    domContentLoaded: 1000, // Under 1 second
    loadComplete: 3000,     // Under 3 seconds
    firstPaint: 500,        // Under 500ms
    firstContentfulPaint: 1000 // Under 1 second
  };

  return { metrics, targets, passed: metrics.loadComplete < targets.loadComplete };
}
```

### 🔄 User Journey Testing

#### Complete Purchase Flow
1. [ ] Land on page
2. [ ] View influencer testimonials
3. [ ] Scroll to product
4. [ ] Click thumbnail images
5. [ ] Read reviews
6. [ ] Select size
7. [ ] Click add to cart
8. [ ] Handle order bump
9. [ ] Proceed to checkout
10. [ ] All steps completable

#### Trust Elements Verification
- [ ] Influencer section visible
- [ ] Quotes display correctly
- [ ] Review stars show
- [ ] Review carousel works
- [ ] Testimonial images load
- [ ] Trust badges display
- [ ] Countdown timer runs
- [ ] Recent purchase notification
- [ ] Stock counter visible

### 🐛 Error Detection

```javascript
async function errorAudit() {
  const errors = [];

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => !img.complete || img.naturalHeight === 0)
                 .map(img => img.src);
  });

  // Check for 404s
  const failed404s = [];
  page.on('response', response => {
    if (response.status() === 404) {
      failed404s.push(response.url());
    }
  });

  return { consoleErrors: errors, brokenImages, failed404s };
}
```

### 📝 Content Verification

#### Text Updates
- [ ] Product name updated everywhere
- [ ] Brand name consistent
- [ ] Price updated all locations
- [ ] Color references changed
- [ ] Guarantee text updated
- [ ] Influencer quotes updated
- [ ] No leftover template text

#### Dynamic Elements
- [ ] Countdown timer counting
- [ ] View counter updating
- [ ] Recent buyer name changes
- [ ] Stock count displays
- [ ] Review count accurate

### 🚀 Final Launch Checklist

```javascript
async function finalLaunchAudit() {
  console.log('🚀 FINAL LAUNCH AUDIT STARTING...\n');

  const results = {
    desktop: await testDesktop(),
    mobile: await testMobile(),
    performance: await performanceAudit(),
    errors: await errorAudit(),
    content: await contentAudit(),
    interactions: await interactionAudit()
  };

  const allPassed = Object.values(results).every(r => r.passed);

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - READY FOR LAUNCH!');
  } else {
    console.log('❌ ISSUES FOUND - SEE REPORT BELOW:');
    generateDetailedReport(results);
  }

  return results;
}
```

### 📈 Success Criteria

The template conversion is complete when:
1. **Zero console errors**
2. **All images load** (no 404s)
3. **Mobile score 100%** (no horizontal scroll, fully visible)
4. **Load time under 3 seconds**
5. **All interactions functional**
6. **Content fully updated** (no template text remaining)
7. **Color theme consistent**
8. **Conversion elements intact**

### 🎬 Automated Test Recording

```javascript
// Record the entire audit for review
async function recordAudit() {
  await page.video.start({ path: 'template-audit.mp4' });

  // Run all tests
  await visualAudit();
  await interactionAudit();
  await mobileAudit();

  await page.video.stop();
  console.log('📹 Audit recording saved to template-audit.mp4');
}
```

## One-Command Full Audit

```bash
# Run this single command for complete audit
node -e "
const audit = require('./playwright-audit');
audit.runCompleteTemplateAudit({
  productName: 'YOUR_PRODUCT',
  brandName: 'YOUR_BRAND',
  mainColor: '#YOUR_HEX',
  price: YOUR_PRICE
}).then(report => {
  console.log(report);
  process.exit(report.passed ? 0 : 1);
});
"
```