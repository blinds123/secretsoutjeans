# Blue Sneaker Landing Page

Connected to SimpleSwap pool system for instant crypto payment processing.

## Backend
- **Pool API**: https://simpleswap-automation-1.onrender.com
- **Pools**: $29, $39, $69, $79 (Pre-created exchanges)

## Pricing
- **Base Price**: $69
- **Order Bump**: +$10 (optional)

## Features
- Instant checkout with pre-created SimpleSwap exchanges
- Automatic pool management (refills exchanges as needed)
- TikTok pixel tracking for purchase events
- Mobile-optimized responsive design
- Order bump functionality

## Deployment
- **Platform**: Netlify
- **Auto-deploy**: On push to main branch
- **Build**: Static site (no build process required)

## Testing

### Test the integration locally:
1. Open `index.html` in a browser
2. Select product options
3. Click "COMPLETE PURCHASE"
4. Verify redirect to SimpleSwap exchange page

### Test the deployed site:
1. Visit the live Netlify URL
2. Complete a test purchase flow
3. Check browser console for `[POOL]` logs
4. Verify exchange ID badge appears on SimpleSwap page

## Monitoring Pool Status

Check pool availability:
```bash
curl -s https://simpleswap-automation-1.onrender.com/stats | python3 -m json.tool
```

Expected output:
```json
{
  "pools": {
    "29": 5,
    "39": 5,
    "69": 5,
    "79": 5
  },
  "status": "operational"
}
```

## Integration Details

### How it works:
1. User clicks "COMPLETE PURCHASE" button
2. `processOrder()` calculates total (base price + optional order bump)
3. Fires TikTok Purchase tracking event
4. Calls `getExchangeFromPool(amount)` to request pre-created exchange
5. Backend returns SimpleSwap exchange URL from pool
6. User is redirected to SimpleSwap to complete payment

### Key files:
- `index.html` - Landing page with pool integration (lines 1667-1747)
- `netlify.toml` - Netlify configuration
- `.gitignore` - Ignored files for Git

## Troubleshooting

### Issue: Button doesn't redirect
Check browser console:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for `[POOL]` and `[ORDER]` logs
4. Check for CORS errors

### Issue: Pool empty
Reinitialize the pool:
```bash
curl -X POST https://simpleswap-automation-1.onrender.com/admin/init-pool \
  -H "Content-Type: application/json"
```

### Issue: CORS errors
Update backend to allow your domain:
1. Contact backend administrator
2. Add your Netlify URL to allowed origins
3. Redeploy backend on Render

## Backend Architecture

The pool system is shared across all landing pages:
- **Location**: Deployed on Render
- **Technology**: Node.js with Puppeteer + BrightData
- **Pools**: Maintains 5 pre-created exchanges per price point
- **Auto-refill**: Automatically creates new exchanges when pool drops below threshold

## Related Sites

- **Beige Sneaker Site**: https://beigesneaker.netlify.app (original implementation)
- **Backend Service**: https://simpleswap-automation-1.onrender.com

## Support

- **Backend Status**: https://simpleswap-automation-1.onrender.com/health
- **Pool Stats**: https://simpleswap-automation-1.onrender.com/stats
- **GitHub**: See repository for complete setup guide

## Environment Variables (Backend Only)

These are configured on Render and should NOT be in this repository:
- `BRIGHT_DATA_CUSTOMER_ID` - BrightData customer ID
- `BRIGHT_DATA_ZONE` - BrightData zone
- `BRIGHT_DATA_PASSWORD` - BrightData password
- `MERCHANT_WALLET` - SimpleSwap merchant wallet address
- `FRONTEND_URL` - Allowed frontend URLs for CORS

## Deployment Commands

### Initial setup:
```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize new site
netlify init

# Deploy to production
netlify deploy --prod
```

### After updates:
```bash
# Just push to GitHub - auto-deploys
git add .
git commit -m "Update landing page"
git push origin main
```

## Performance

This landing page is optimized for:
- Fast load times (< 2s)
- Mobile-first design
- Lazy loading for images
- Minified CSS/JS via Netlify
- Edge caching for static assets

## License

Private - All Rights Reserved
