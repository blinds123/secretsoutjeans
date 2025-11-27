# Blue Sneaker Landing Page - Test Suite Documentation

## Overview

This comprehensive test suite verifies the complete integration between the Blue Sneaker landing page and the SimpleSwap Pool backend. It includes automated tests for functionality, visual design, user flows, and backend API health.

## Test Suite Components

### 1. **test-integration.js** - Integration Test
Tests the core integration flow from landing page to SimpleSwap.

**What it tests:**
- Page loads with `SIMPLESWAP_POOL_API` configured
- `processOrder()` function exists and is callable
- "COMPLETE PURCHASE" button is visible and clickable
- Backend API is called when button is clicked
- User is redirected to SimpleSwap
- Exchange ID is present in the redirect URL

**Expected behavior:**
- All elements load correctly
- Console logs show `[ORDER]` and `[POOL]` messages
- Redirect happens within 15 seconds
- SimpleSwap URL contains valid exchange ID

---

### 2. **test-backend.js** - Backend API Test
Tests the SimpleSwap Pool backend API directly.

**What it tests:**
- `/health` endpoint returns 200
- `/stats` endpoint shows pool counts
- `/buy-now` endpoint works for all price points ($29, $39, $69, $79)
- Response times are acceptable (<3s average)
- Exchange URLs are valid SimpleSwap URLs
- Pool depletion warnings

**Expected behavior:**
- Health check passes
- All pools have exchanges available
- Each price point returns valid exchange URL
- Response times under 5 seconds

---

### 3. **test-visual.js** - Visual Regression Test
Tests visual elements and responsive design.

**What it tests:**
- Page elements are visible (buttons, images, headings, prices)
- Button is clickable with proper dimensions
- Images load correctly (not broken)
- Responsive design works on mobile, tablet, desktop
- No critical console errors
- Screenshots for visual comparison

**Expected behavior:**
- All key elements visible
- Button has minimum 44x44px touch target
- Images have valid dimensions
- Layouts work across all viewports
- Fewer than 5 console errors

---

### 4. **test-flow.js** - Complete User Flow Test
Tests the complete customer journey from landing to purchase.

**What it tests:**
- Landing on the page
- Scrolling through content
- Product image gallery/thumbnails
- Size selection (if applicable)
- Order bump checkbox toggle
- Price updates when order bump is selected/deselected
- Completing purchase
- Redirect to SimpleSwap
- Exchange ID visible on SimpleSwap page

**Expected behavior:**
- Smooth user experience
- Price updates correctly (+$10 for order bump)
- All interactive elements work
- Complete flow from landing to SimpleSwap
- Screenshots captured at each step

---

### 5. **run-all-tests.js** - Test Runner
Runs all test suites in sequence and generates comprehensive reports.

**What it does:**
- Executes all 4 test suites
- Collects results from each suite
- Generates HTML report with visual summary
- Generates JSON report for CI/CD integration
- Provides consolidated pass/fail status

---

## Installation

### Prerequisites
- Node.js 14 or higher
- npm or yarn

### Install Dependencies

```bash
# Navigate to the project directory
cd "/Users/nelsonchan/Downloads/Blue Sneaker lander"

# Install Playwright (includes Chromium browser)
npm install -D playwright

# Or if you need standalone installation
npm install -D @playwright/test
npx playwright install chromium
```

## Running Tests

### Environment Variables

You can customize the test environment using these variables:

```bash
# Set the site URL to test (default: http://localhost:8080)
export SITE_URL="https://blue-sneaker-lander-xxx.netlify.app"

# Set the backend API (default: https://simpleswap-automation-1.onrender.com)
export BACKEND_API="https://simpleswap-automation-1.onrender.com"
```

### Run All Tests

```bash
# Run the complete test suite
node tests/run-all-tests.js

# Or with custom URL
SITE_URL="https://your-site.netlify.app" node tests/run-all-tests.js
```

### Run Individual Tests

```bash
# Backend API test only
node tests/test-backend.js

# Integration test only
node tests/test-integration.js

# Visual test only
node tests/test-visual.js

# User flow test only
node tests/test-flow.js
```

### Run with Custom Configuration

```bash
# Test production site
SITE_URL="https://blue-sneaker-lander-prod.netlify.app" node tests/run-all-tests.js

# Test local development
SITE_URL="http://localhost:3000" node tests/run-all-tests.js

# Test with different backend
SITE_URL="https://staging.example.com" BACKEND_API="https://staging-api.example.com" node tests/run-all-tests.js
```

## Understanding Results

### Exit Codes
- **0** = All tests passed ✅
- **1** = One or more tests failed ❌

### Console Output

Each test provides detailed console output:

```
✅ = Test passed
❌ = Test failed
⚠️  = Warning (test passed with issues)
ℹ️  = Informational message
📝 = Console log from page
📸 = Screenshot captured
⏱️ = Timing information
```

### Reports

After running `run-all-tests.js`, you'll get:

1. **HTML Report** (`tests/test-report.html`)
   - Visual summary dashboard
   - Individual test suite results
   - Expandable detailed output
   - Statistics and success rates
   - Open in browser for best experience

2. **JSON Report** (`tests/test-report.json`)
   - Machine-readable format
   - Perfect for CI/CD integration
   - Contains all test results and metrics

3. **Screenshots** (`tests/screenshots/`)
   - Visual evidence of test execution
   - Before/after comparisons
   - Mobile, tablet, desktop views
   - User flow progression

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install -D playwright
      - run: npx playwright install chromium
      - name: Run tests
        run: |
          SITE_URL="${{ secrets.SITE_URL }}" node tests/run-all-tests.js
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: |
            tests/test-report.html
            tests/test-report.json
            tests/screenshots/
```

### Netlify Deploy Preview Example

```yaml
# netlify.toml
[build.environment]
  NODE_VERSION = "16"

[[plugins]]
  package = "@netlify/plugin-lighthouse"

[context.deploy-preview]
  command = "npm install -D playwright && npx playwright install chromium && SITE_URL=$DEPLOY_PRIME_URL node tests/run-all-tests.js"
```

## Troubleshooting

### Test Fails: "Page failed to load"

**Possible causes:**
- Site is not accessible at the URL
- Site takes too long to load (>30s)
- Network connection issues

**Solutions:**
- Verify the `SITE_URL` is correct and accessible
- Check if site is deployed and live
- Increase timeout in test file if needed
- Check network connectivity

---

### Test Fails: "Backend API not responding"

**Possible causes:**
- Backend server is down or slow
- Cold start on Render (first request takes longer)
- Network issues

**Solutions:**
- Check backend health: `curl https://simpleswap-automation-1.onrender.com/health`
- Wait 30 seconds and try again (Render cold starts)
- Check Render dashboard for server status

---

### Test Fails: "Button not found"

**Possible causes:**
- HTML structure changed
- Button text changed
- Element is hidden or not rendered

**Solutions:**
- Manually visit the site and verify button exists
- Check if selector needs updating in test file
- Verify page loaded completely before test ran

---

### Test Fails: "Pool depleted"

**Status:** This is expected when pools run out.

**Solutions:**
- Contact backend admin to refill pools
- Check `/stats` endpoint to see pool counts
- This is not a test failure, just a resource warning

---

### Screenshots Not Generated

**Possible causes:**
- Screenshots directory doesn't exist
- Permission issues
- Browser failed to launch

**Solutions:**
- Manually create directory: `mkdir -p tests/screenshots`
- Check file permissions
- Run with `DEBUG=pw:api` to see Playwright logs

---

### Playwright Installation Issues

**Common error:** "Executable doesn't exist at ..."

**Solution:**
```bash
# Install browsers explicitly
npx playwright install chromium

# Or install all browsers
npx playwright install
```

---

## Performance Benchmarks

### Expected Response Times

| Test | Expected Duration |
|------|------------------|
| Backend API Test | 5-15 seconds |
| Integration Test | 15-30 seconds |
| Visual Test | 20-40 seconds |
| User Flow Test | 20-35 seconds |
| **Full Suite** | **60-120 seconds** |

### Backend API Response Times

| Endpoint | Expected Response Time |
|----------|----------------------|
| `/health` | <500ms |
| `/stats` | <1000ms |
| `/buy-now` | <3000ms |

**Warning thresholds:**
- ⚠️  Response time >3s
- 🚨 Response time >5s

---

## Test Coverage

### What's Tested ✅

- ✅ Page loading and rendering
- ✅ JavaScript functionality
- ✅ Button interactions
- ✅ Form validation (order bump checkbox)
- ✅ Price calculations
- ✅ Backend API integration
- ✅ Redirect flow
- ✅ Exchange ID validation
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Image loading
- ✅ Console error detection
- ✅ Pool status monitoring

### What's NOT Tested ❌

- ❌ Actual cryptocurrency transactions (uses test mode)
- ❌ Email notifications
- ❌ Payment processing beyond redirect
- ❌ Browser compatibility (only Chromium tested)
- ❌ Accessibility (WCAG compliance) - add separate test if needed

---

## Adding New Tests

### Template for New Test File

```javascript
const { chromium } = require('playwright');

async function runMyTest() {
  console.log('🧪 MY NEW TEST\n');

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Your test logic here
    console.log('TEST 1: Description');
    try {
      // Test code
      console.log('✅ Test passed');
      passed++;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      failed++;
    }

  } finally {
    if (browser) await browser.close();
  }

  // Summary
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);

  process.exit(failed === 0 ? 0 : 1);
}

runMyTest().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
```

### Adding Test to Suite

Edit `run-all-tests.js` and add to `TEST_SUITES` array:

```javascript
{
  name: 'My New Test',
  file: 'test-mynew.js',
  description: 'Description of what this test does'
}
```

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test output in `test-report.html`
3. Check console logs for error details
4. Verify environment variables are set correctly

---

## Version History

- **v1.0** (2025-11-24)
  - Initial test suite
  - Backend API testing
  - Integration testing
  - Visual regression testing
  - User flow testing
  - HTML/JSON reporting

---

## License

Test suite is provided as-is for the Blue Sneaker Landing Page project.
