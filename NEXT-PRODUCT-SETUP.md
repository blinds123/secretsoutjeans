# Setting Up Your Next Product

## Step 1: Create Your New Product
1. Copy your template to a new folder
2. Customize it for the new product (e.g., Black Leather Boots)
3. Test it locally

## Step 2: Deploy to Netlify
```bash
cd "your-new-product-folder"
netlify init
# Choose "Create & configure a new site"
# Give it a name like "auralo-black-boots"
netlify deploy --prod
```

You'll get a URL like: `https://auralo-black-boots.netlify.app`

## Step 3: Add Route in Main Site
Edit the `_redirects` file in your MAIN auralo.store project:

```bash
# In your main project (this current baby blue project)
cd "/Users/nelsonchan/Downloads/LAUNCH-READY-TEMPLATE copy 3"
```

Update _redirects:
```
# Existing baby blue sneakers at root
/  /index.html  200

# ADD YOUR NEW PRODUCT HERE:
/black-boots/*  https://auralo-black-boots.netlify.app/:splat  200!
/black-boots    https://auralo-black-boots.netlify.app/  200!

# Future products:
/white-sneakers/*  https://auralo-white.netlify.app/:splat  200!
/summer-sale/*  https://auralo-summer.netlify.app/:splat  200!
```

## Step 4: Redeploy Main Site
```bash
netlify deploy --prod
```

## Your Product is Now Live at:
- `auralo.store/black-boots`

## To Change URLs:

### Change Product Path (e.g., /black-boots to /limited-edition)
1. Edit `_redirects` in main project:
   ```
   # Change from:
   /black-boots/*  https://auralo-black-boots.netlify.app/:splat  200!

   # To:
   /limited-edition/*  https://auralo-black-boots.netlify.app/:splat  200!
   ```
2. Redeploy: `netlify deploy --prod`

### Move Baby Blue to Subpath (so homepage can be a catalog)
1. Deploy a new homepage/catalog site to Netlify
2. Update _redirects:
   ```
   # Homepage shows catalog
   /*  https://auralo-catalog.netlify.app/:splat  200!

   # Baby blue at specific path
   /baby-blue/*  https://burgundyset.netlify.app/:splat  200!
   /baby-blue    https://burgundyset.netlify.app/  200!
   ```