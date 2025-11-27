# Blue Sneaker Lander - Deployment Guide

## Current Status

✅ **Completed Steps:**
1. SimpleSwap pool integration added to index.html
2. netlify.toml configuration created
3. .gitignore updated
4. README.md created with full documentation
5. GitHub repository created: https://github.com/blinds123/blue-sneaker-lander
6. Code pushed to GitHub

⏳ **Remaining Steps:**
1. Deploy to Netlify
2. Test the complete integration

---

## Deploy to Netlify (Choose One Method)

### Method 1: Netlify CLI (Interactive)

```bash
cd "/Users/nelsonchan/Downloads/Blue Sneaker lander"

# Initialize new Netlify site
netlify init

# When prompted, select:
# 1. "Create & configure a new project"
# 2. Team: "nelson"
# 3. Site name: "blue-sneaker-lander" (or leave blank)
# 4. Build command: Press Enter (configured in netlify.toml)
# 5. Deploy directory: Press Enter (configured in netlify.toml)

# Deploy to production
netlify deploy --prod

# Open the deployed site
netlify open:site
```

### Method 2: Netlify Web Dashboard (Easier)

1. Go to: https://app.netlify.com
2. Click: **"Add new site"** → **"Import an existing project"**
3. Select: **GitHub**
4. Choose repository: **blinds123/blue-sneaker-lander**
5. Build settings (leave as is - netlify.toml handles it):
   - Build command: (leave blank or use: `echo 'No build required - static site'`)
   - Publish directory: `.` (or leave blank)
6. Click: **"Deploy site"**

Netlify will:
- Read netlify.toml configuration
- Deploy your site automatically
- Set up continuous deployment (auto-deploys on Git push)
- Provide you with a URL like: `https://blue-sneaker-lander.netlify.app`

---

## Verification Steps

After deployment completes, run these tests:

### 1. Check Integration Code is Deployed
```bash
# Replace [your-site-url] with your actual Netlify URL
curl -s https://[your-site-url]/ | grep "SIMPLESWAP_POOL_API"
```
Expected: Should find "SIMPLESWAP_POOL_API" in the output

### 2. Test Backend Connection
```bash
curl -X POST https://simpleswap-automation-1.onrender.com/buy-now \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 69}'
```
Expected response:
```json
{
  "success": true,
  "exchangeUrl": "https://simpleswap.io/?id=...",
  "poolStatus": "instant"
}
```

### 3. Check Pool Status
```bash
curl -s https://simpleswap-automation-1.onrender.com/stats | python3 -m json.tool
```
Expected: Pool counts for each price point ($29, $39, $69, $79)

### 4. Test the Full User Flow
1. Visit your Netlify URL
2. Open browser DevTools (F12) → Console tab
3. Select product size
4. Click "COMPLETE PURCHASE"
5. Look for console logs:
   - `[ORDER] Processing order...`
   - `[POOL] Requesting exchange for 69...`
   - `[POOL] Redirecting to exchange: https://simpleswap.io/?id=...`
6. Verify you're redirected to SimpleSwap exchange page
7. Check for exchange ID badge at top of SimpleSwap page

---

## CORS Configuration (If Needed)

If you get CORS errors after deployment, you'll need to add your Netlify domain to the backend's allowed origins.

Your Netlify URL will be something like: `https://blue-sneaker-lander.netlify.app`

**Option A: Update Backend Code**

If you have access to the backend (Render), add your domain to the CORS configuration:

```javascript
const allowedOrigins = [
    'https://beigesneaker.netlify.app',
    'https://blue-sneaker-lander.netlify.app'  // Add your new domain
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
```

**Option B: Use Environment Variable (Recommended)**

On Render dashboard, add environment variable:
- Key: `ADDITIONAL_ORIGINS`
- Value: `https://blue-sneaker-lander.netlify.app`

Then redeploy the backend on Render.

---

## Monitoring & Maintenance

### Check Site Status
```bash
netlify status
```

### View Recent Deploys
```bash
netlify deploys:list
```

### Monitor Pool Health
```bash
# Run this periodically to ensure pools are full
curl -s https://simpleswap-automation-1.onrender.com/stats | python3 -m json.tool
```

### Reinitialize Pools (If Empty)
```bash
curl -X POST https://simpleswap-automation-1.onrender.com/admin/init-pool \
  -H "Content-Type: application/json"
```

---

## Troubleshooting

### Issue: "Unable to create exchange"

**Check:**
1. Pool status: `curl https://simpleswap-automation-1.onrender.com/stats`
2. Backend health: `curl https://simpleswap-automation-1.onrender.com/health`
3. Browser console for error messages

**Fix:**
- If pools are empty, reinitialize them
- If backend is down, check Render dashboard
- If CORS error, add your domain to allowed origins

### Issue: Button Doesn't Change Text

**Check:**
- Button selector in code: `document.querySelector('[onclick*="processOrder"]')`
- Verify button has `onclick="processOrder()"`

### Issue: No Redirect Happens

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Ensure `async/await` is working properly

---

## Auto-Deploy Configuration

Your site is now configured for auto-deployment:
- Every push to `main` branch on GitHub
- Automatically deploys to Netlify
- No manual deployment needed

To trigger a deployment:
```bash
git add .
git commit -m "Update landing page"
git push origin main
```

Netlify will detect the push and deploy automatically.

---

## Important URLs

- **GitHub Repository**: https://github.com/blinds123/blue-sneaker-lander
- **Backend API**: https://simpleswap-automation-1.onrender.com
- **Original Beige Sneaker Site**: https://beigesneaker.netlify.app
- **Your Netlify URL**: (will be provided after deployment)

---

## Success Criteria Checklist

- [ ] Netlify site created and deployed
- [ ] Site URL accessible
- [ ] Integration code present (check with curl/grep)
- [ ] Backend responding to requests
- [ ] CORS configured (if needed)
- [ ] "COMPLETE PURCHASE" button redirects to SimpleSwap
- [ ] Exchange ID appears on SimpleSwap page
- [ ] Console logs show pool integration working
- [ ] Old beigesneaker.netlify.app site still works (unchanged)

---

## Next Steps After Deployment

1. **Test thoroughly** with real user flows
2. **Monitor pool status** regularly
3. **Track conversion metrics** via TikTok Pixel
4. **Customize pricing** if needed (edit processOrder() function)
5. **Update product details** in TikTok tracking event

Congratulations! Your Blue Sneaker landing page is now connected to the SimpleSwap pool system! 🎉
