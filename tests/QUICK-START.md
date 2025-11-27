# Quick Start Guide - Blue Sneaker Test Suite

## 🚀 Fast Setup (30 seconds)

```bash
# 1. Navigate to project
cd "/Users/nelsonchan/Downloads/Blue Sneaker lander"

# 2. Install dependencies (if not already installed)
npm install

# 3. Install browser
npx playwright install chromium

# 4. Run all tests
npm test
```

## 📋 Quick Commands

```bash
# Run everything
npm test

# Run specific test
npm run test:backend      # Backend API only
npm run test:integration  # Integration test only
npm run test:visual       # Visual test only
npm run test:flow         # User flow only

# Test production site
SITE_URL="https://your-site.netlify.app" npm test

# Test local development
SITE_URL="http://localhost:8080" npm test
```

## 📊 View Results

After running tests:
- **Open:** `tests/test-report.html` in your browser
- **Check:** `tests/test-report.json` for JSON data
- **View:** `tests/screenshots/` for visual evidence

## ✅ What Each Test Does

### test-backend.js (10-15 sec)
✓ Backend API health check
✓ Pool availability check
✓ All price points working

### test-integration.js (15-30 sec)
✓ Page loads with correct configuration
✓ processOrder function exists
✓ Button click triggers backend call
✓ Redirect to SimpleSwap works

### test-visual.js (20-40 sec)
✓ All elements visible
✓ Button clickable
✓ Images load correctly
✓ Mobile/tablet/desktop layouts work

### test-flow.js (20-35 sec)
✓ Complete user journey
✓ Scroll, click, select
✓ Order bump toggle works
✓ Price updates correctly
✓ Purchase flow completes

## 🔧 Troubleshooting

### "Page failed to load"
→ Check if `SITE_URL` is correct and site is live

### "Backend not responding"
→ Wait 30s for Render cold start, try again

### "Pool depleted"
→ Not a test failure, just low inventory warning

### Screenshots missing
→ Run: `mkdir -p tests/screenshots`

## 📞 Need Help?

Read the full documentation: `tests/README-TESTS.md`

---

**Expected Total Time:** 60-120 seconds for full suite
**Expected Pass Rate:** 100% (if site and backend are healthy)
