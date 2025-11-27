# Master Template Conversion Prompt with Full Playwright Verification

## Complete Prompt for Template Adaptation with Automated Testing

```markdown
I need to adapt a high-converting product landing page template for my new product and perform a complete end-to-end audit using Playwright MCP to ensure everything works perfectly.

WORKING DIRECTORY: I'm working in a duplicated directory that I've already renamed

## PART 1: PRODUCT INFORMATION

MY NEW PRODUCT:
- Product Name: [e.g., "LuxFlow Athletic Running Shoes"]
- Brand Name: [e.g., "LuxFlow"]
- Main Color: [e.g., "Electric Blue" or provide hex like #0066FF]
- Price: $[your price] (was $[original price])
- Product Category: [e.g., running shoes, boots, sandals]
- Target Audience: [e.g., athletes, fashion-conscious women, professionals]

MY PRODUCT IMAGES:
- Main product image: [filename]
- 4 thumbnail images showing different angles
- 3 influencer photos (or use stock photos)
- Customer testimonial photos (optional)
- Order bump product images

## PART 2: CUSTOMIZATION REQUIREMENTS

1. **Color Extraction & Application**:
   - Analyze my main product image and extract the dominant color
   - Replace #C9A887 (beige) throughout with my product's color
   - Update all gradients and accents to complement the new color
   - Ensure buttons use the new color in their gradients
   - Update star ratings color to match

2. **Product Information**:
   - Replace "Netlify Beige Suede Wedge Sneakers" with my product name
   - Update all color references throughout
   - Change prices in all locations
   - Update stock count and review numbers

3. **Sales Copy Adaptation**:
   - Rewrite the guarantee for my product type (Iman Gadzhi style - bold, specific, risk-free)
   - Update all 3 influencer quotes to mention my brand naturally
   - Adjust testimonials to sound authentic for my product category
   - Modify the "Materials & Craftsmanship" section for my product
   - Update order bump text for complementary product

4. **Image Updates**:
   - Replace all product images with mine
   - Update all image paths
   - Ensure WebP format for performance
   - Maintain thumbnail click functionality
   - Update order bump images

5. **Category-Specific Changes**:
   - Adjust size/variant options for my product type
   - Update product-specific features
   - Modify descriptions to match product benefits
   - Adapt shipping promises if needed

## PART 3: PLAYWRIGHT MCP VERIFICATION

After making all changes, perform a COMPLETE site audit using Playwright MCP:

### PHASE 1: Visual Verification
1. Open the page at desktop resolution (1920x1080)
2. Take a full-page screenshot
3. Verify the dominant color matches the product
4. Check that all text has been updated (no "Netlify" or "beige" remaining unless intended)
5. Confirm all images load properly

### PHASE 2: Desktop Functionality Testing
1. **Hero Section**:
   - Verify main product image displays correctly
   - Click each thumbnail and confirm main image updates
   - Check that all 4 thumbnails are clickable
   - Verify product name and price are correct

2. **Interactive Elements**:
   - Test all size/variant selections
   - Click "Add to Cart" buttons (both regular and pre-order)
   - Verify order bump popup appears and functions
   - Test "Accept" and "Decline" buttons on order bump
   - Check Size Guide modal opens and closes

3. **Social Proof**:
   - Verify influencer section displays with correct quotes
   - Check review carousel navigation (arrows work)
   - Confirm testimonial images load
   - Test "Load More Reviews" button

4. **Trust Elements**:
   - Verify trust badges display
   - Check countdown timer updates
   - Confirm recent purchase notifications appear

### PHASE 3: Mobile Testing (iPhone 14 Pro - 393x852)
1. Resize viewport to mobile
2. Take screenshot of mobile view
3. **Mobile-Specific Checks**:
   - Verify NO horizontal scroll exists
   - Confirm product image is fully visible (not cut off)
   - Check thumbnails don't overlap main image
   - Test sticky "Add to Cart" button appears on scroll
   - Verify sticky button text is fully visible
   - Test mobile menu if present

4. **Mobile Interactions**:
   - Test thumbnail clicking on mobile
   - Verify size selection works
   - Test order bump on mobile
   - Check all buttons are tappable (min 44x44px)

### PHASE 4: User Flow Testing
Complete full user journey:
1. Land on page
2. View product images (click through thumbnails)
3. Select a size
4. Click "Add to Cart"
5. Handle order bump (accept or decline)
6. Verify checkout elements work
7. Test pre-order option
8. Scroll to reviews
9. Navigate back to top

### PHASE 5: Performance & Content Audit
1. **Performance Checks**:
   - Measure page load time
   - Verify images use lazy loading below fold
   - Check that WebP images are being used
   - Confirm no console errors

2. **Content Verification**:
   - Search for any remaining old product references
   - Verify all prices match (no old $69 or $120)
   - Confirm guarantee text is updated
   - Check influencer quotes mention new brand
   - Verify stock count and reviews are correct

3. **Cross-Browser Testing**:
   - Test in Chrome
   - Verify in Safari if on Mac
   - Check Firefox compatibility

### PHASE 6: Final Quality Checklist
Using Playwright, create a final report that confirms:
- [ ] All images load (0 broken images)
- [ ] All buttons are clickable
- [ ] No horizontal scroll on mobile
- [ ] Product image fully visible on all devices
- [ ] Order bump works correctly
- [ ] Sticky cart button functions on mobile
- [ ] All text updated to new product
- [ ] Color theme consistent throughout
- [ ] No JavaScript errors in console
- [ ] Page loads in under 3 seconds
- [ ] All thumbnails update main image
- [ ] Size selection works
- [ ] Trust badges display
- [ ] Countdown timer runs
- [ ] Review carousel navigates

### PHASE 7: Generate Test Report
Create a comprehensive test report including:
1. Screenshots at all breakpoints
2. List of any issues found
3. Performance metrics
4. Verification that all copy was updated
5. Color palette consistency check
6. Interaction test results
7. Mobile usability score

## PART 4: OUTPUT REQUIREMENTS

1. **Updated index.html** with all changes applied
2. **Test report** from Playwright verification
3. **Screenshots** showing:
   - Desktop view (full page)
   - Mobile view (iPhone)
   - Order bump popup
   - Key interactions
4. **Issues log** if any problems found
5. **Performance metrics** from testing

## PART 5: ITERATION INSTRUCTIONS

If Playwright finds any issues:
1. Fix the identified problems
2. Re-run the specific failed tests
3. Take new screenshots of fixes
4. Repeat until all tests pass
5. Generate final "all-green" test report

The page is ready for launch only when:
- All Playwright tests pass
- No visual issues on mobile/desktop
- Performance metrics are acceptable
- All copy is properly updated
- Color theme is consistent
- All interactions work flawlessly

Use the TodoWrite tool to track each phase of testing and mark them complete as you go.
```

## Automated Test Script to Include

```javascript
// Include this automated test sequence
async function completeTemplateAudit(productName, mainColor) {
  console.log(`🚀 Starting complete audit for ${productName}`);

  // Phase 1: Visual Verification
  await page.goto('file:///path/to/index.html');
  await page.screenshot({ path: 'audit-desktop-full.png', fullPage: true });

  // Phase 2: Content Verification
  const oldReferences = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const issues = [];
    if (bodyText.includes('Netlify') && !bodyText.includes('[YourBrand]')) {
      issues.push('Found old brand name "Netlify"');
    }
    if (bodyText.includes('beige') && !bodyText.includes('[YourColor]')) {
      issues.push('Found old color "beige"');
    }
    if (bodyText.includes('$69') && !bodyText.includes('[YourPrice]')) {
      issues.push('Found old price "$69"');
    }
    return issues;
  });

  // Phase 3: Interaction Testing
  const thumbnails = await page.$$('#thumbs img');
  for (let thumb of thumbnails) {
    await thumb.click();
    await page.waitForTimeout(500);
  }

  // Phase 4: Mobile Testing
  await page.setViewportSize({ width: 393, height: 852 });
  const horizontalScroll = await page.evaluate(() =>
    document.body.scrollWidth > window.innerWidth
  );

  // Phase 5: Generate Report
  return {
    productName,
    mainColor,
    timestamp: new Date(),
    contentIssues: oldReferences,
    horizontalScroll,
    thumbnailCount: thumbnails.length,
    mobileReady: !horizontalScroll && oldReferences.length === 0
  };
}
```

MAINTAIN ALL:
- Conversion optimization elements
- Psychological triggers
- Mobile responsiveness
- Animation effects
- Trust signals
- Page load optimizations
```