# How to Add New Products to auralo.store

## Quick Setup for New Products

### 1. Deploy new product to its own Netlify site
```bash
# In your new product directory
netlify init
netlify deploy --prod
# You'll get a URL like: https://new-product.netlify.app
```

### 2. Update _redirects in main site
Add these lines to _redirects:
```
/product-name/*  https://new-product.netlify.app/:splat  200!
/product-name    https://new-product.netlify.app/  200!
```

### 3. Redeploy main site
```bash
netlify deploy --prod
```

### 4. Access your new product
Your new product is now live at:
`auralo.store/product-name`

## Example Product URLs
- auralo.store (main/first product)
- auralo.store/summer-collection
- auralo.store/limited-edition
- auralo.store/sale-items

Each product:
- Has its own GitHub repo
- Deploys independently
- Updates without affecting other products