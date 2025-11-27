# Blue Sneaker Test Suite - Deployment Checklist

## ✅ Files Created

### Core Test Files
- [x] `test-integration.js` - Landing page → SimpleSwap integration test
- [x] `test-backend.js` - Backend API health and pool status test
- [x] `test-visual.js` - Visual regression and responsive design test
- [x] `test-flow.js` - Complete user journey test

### Supporting Files
- [x] `run-all-tests.js` - Master test runner with HTML/JSON reporting
- [x] `README-TESTS.md` - Comprehensive documentation
- [x] `QUICK-START.md` - Fast setup guide
- [x] `TEST-SUMMARY.md` - Complete overview
- [x] `CHECKLIST.md` - This checklist

### Infrastructure
- [x] `screenshots/` directory created
- [x] `package.json` updated with test scripts
- [x] Playwright dependency confirmed

## 🔧 Pre-Deployment Setup

### 1. Dependencies
```bash
cd "/Users/nelsonchan/Downloads/Blue Sneaker lander"

# Install Node dependencies (if not done)
npm install

# Install Playwright browser
npx playwright install chromium
```

### 2. Environment Variables
```bash
# Set site URL (replace with your actual URL)
export SITE_URL="https://blue-sneaker-lander-xxx.netlify.app"

# Optional: Set custom backend API
export BACKEND_API="https://simpleswap-automation-1.onrender.com"
```

### 3. Verify Setup
```bash
# Test that Node and npm are working
node --version  # Should be 14+
npm --version

# Verify Playwright installation
npx playwright --version

# Check test files exist
ls -la tests/
```

## 🧪 Pre-Launch Testing

### Step 1: Test Locally First
```bash
# Start local server (if you have one)
# python -m http.server 8080
# OR
# npx serve .

# Run tests against local
SITE_URL="http://localhost:8080" npm run test:integration
```

### Step 2: Test Individual Components
```bash
# Test backend API health
npm run test:backend

# Test page integration
npm run test:integration

# Test visual elements
npm run test:visual

# Test user flow
npm run test:flow
```

### Step 3: Run Full Suite
```bash
# Run everything
npm test

# Check reports
open tests/test-report.html
cat tests/test-report.json
```

## 🚀 Deployment Day Checklist

### Before Deployment
- [ ] All tests pass locally
- [ ] Code committed to git
- [ ] Backend API is healthy
- [ ] Pool inventory is sufficient (>10 per price point)
- [ ] Environment variables documented

### During Deployment
- [ ] Deploy to staging first (if available)
- [ ] Run test suite against staging
- [ ] Verify all tests pass
- [ ] Check screenshots look correct
- [ ] Review HTML report

### After Deployment to Production
- [ ] Update SITE_URL to production URL
- [ ] Run full test suite immediately
- [ ] Verify redirect URLs are correct
- [ ] Check pool depletion warnings
- [ ] Save passing test report as baseline

### Production Verification Commands
```bash
# Set production URL
export SITE_URL="https://blue-sneaker-lander-prod.netlify.app"

# Run full suite
npm test

# Quick backend check
npm run test:backend

# Verify integration
npm run test:integration
```

## 📊 Post-Launch Monitoring

### Daily Checks
- [ ] Run `npm run test:backend` to check pool status
- [ ] Monitor for pool depletion warnings
- [ ] Check response times (<3s average)

### Weekly Checks
- [ ] Run full test suite
- [ ] Review HTML reports for trends
- [ ] Compare screenshots for visual changes
- [ ] Check for new console errors

### After Any Changes
- [ ] Run affected test (integration, visual, flow)
- [ ] Run full suite if major changes
- [ ] Update baseline screenshots if intentional changes

## 🔍 Troubleshooting Checklist

### If Backend Test Fails
- [ ] Check backend URL is correct
- [ ] Verify backend is deployed and running
- [ ] Wait 30s for Render cold start
- [ ] Check pool inventory at `/stats`
- [ ] Test manually: `curl https://simpleswap-automation-1.onrender.com/health`

### If Integration Test Fails
- [ ] Verify site is accessible in browser
- [ ] Check SIMPLESWAP_POOL_API constant in HTML
- [ ] Verify processOrder function exists
- [ ] Check console for JavaScript errors
- [ ] Test button click manually

### If Visual Test Fails
- [ ] Open site in browser and verify manually
- [ ] Check if HTML structure changed
- [ ] Verify images are loading
- [ ] Test responsive breakpoints
- [ ] Review screenshots for actual issues

### If Flow Test Fails
- [ ] Test user journey manually
- [ ] Verify order bump checkbox works
- [ ] Check price calculations manually
- [ ] Test on actual device (mobile/tablet)
- [ ] Verify SimpleSwap redirect works

## 🎯 Success Criteria

### Green Light to Launch ✅
All of the following must be true:
- [ ] All 4 test suites pass (100%)
- [ ] Backend response times <3s average
- [ ] All pools have >5 exchanges
- [ ] Visual tests pass on all viewports
- [ ] Complete user flow works end-to-end
- [ ] Screenshots look correct
- [ ] No critical console errors (<5 total)
- [ ] HTML report shows 100% pass rate

### Yellow Light (Launch with Caution) ⚠️
Some issues present but not critical:
- [ ] 95%+ tests pass
- [ ] Minor console warnings only
- [ ] One pool running low (but not empty)
- [ ] Response times 3-5s
- [ ] Visual differences are intentional

### Red Light (Do Not Launch) 🚫
Critical issues present:
- [ ] <95% tests pass
- [ ] Backend not responding
- [ ] Any pool completely empty
- [ ] Response times >5s
- [ ] JavaScript errors on page load
- [ ] Redirect to SimpleSwap fails
- [ ] Price calculations incorrect

## 📝 Documentation Updates

### After Successful Launch
- [ ] Update README-TESTS.md with production URL
- [ ] Document any test failures and fixes
- [ ] Save baseline screenshots
- [ ] Note any environment-specific issues
- [ ] Update expected response times if different

### If Tests Were Modified
- [ ] Document what changed and why
- [ ] Update QUICK-START.md if commands changed
- [ ] Update TEST-SUMMARY.md if coverage changed
- [ ] Commit changes to git
- [ ] Update this checklist if needed

## 🎉 Launch Day Success

Once all checks pass:
1. ✅ Save successful test report
2. ✅ Document production URL in tests
3. ✅ Set up scheduled testing (optional)
4. ✅ Share test report with team
5. ✅ Monitor for first few hours
6. ✅ Celebrate! 🎊

## 📞 Emergency Contacts

If tests fail in production:
1. Check HTML report for specific failures
2. Review screenshots for visual issues
3. Check backend `/health` and `/stats` manually
4. Test purchase flow manually in browser
5. Contact backend admin if pools depleted
6. Rollback if critical issues found

---

**Remember:** Tests are your safety net. If they fail, there's a reason!

**Pro Tip:** Run tests before AND after any code changes, no matter how small.
