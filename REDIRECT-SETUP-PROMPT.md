# Prompt Template for Adding New Products to auralo.store

## Copy and paste this to Claude when adding a new product:

---

"I have a new product deployed to Netlify at: [YOUR-NETLIFY-URL]
I want it accessible at: auralo.store/[YOUR-CHOSEN-PATH]

Please update the _redirects file in: /Users/nelsonchan/Downloads/LAUNCH-READY-TEMPLATE copy 3/

Then deploy it to make it live."

---

## Examples:

### Example 1 - Adding Black Boots:
"I have a new product deployed to Netlify at: https://black-leather-boots.netlify.app
I want it accessible at: auralo.store/black-boots

Please update the _redirects file in: /Users/nelsonchan/Downloads/LAUNCH-READY-TEMPLATE copy 3/

Then deploy it to make it live."

### Example 2 - Adding Summer Collection:
"I have a new product deployed to Netlify at: https://summer-collection-2025.netlify.app
I want it accessible at: auralo.store/summer

Please update the _redirects file in: /Users/nelsonchan/Downloads/LAUNCH-READY-TEMPLATE copy 3/

Then deploy it to make it live."

### Example 3 - Multiple Products at Once:
"Add these products to auralo.store:
1. https://white-sneakers.netlify.app → auralo.store/white
2. https://red-heels.netlify.app → auralo.store/red-heels
3. https://clearance-items.netlify.app → auralo.store/sale

Please update the _redirects file in: /Users/nelsonchan/Downloads/LAUNCH-READY-TEMPLATE copy 3/

Then deploy it to make it live."

---

## What Claude Will Do:
1. Open your _redirects file
2. Add the routing rules for your product(s)
3. Deploy to Netlify with: netlify deploy --prod
4. Confirm your new URLs are working

## Required Info:
- Your new product's Netlify URL (e.g., project-name.netlify.app)
- Desired path on auralo.store (e.g., /product-name)
- Location of main project (usually: /Users/nelsonchan/Downloads/LAUNCH-READY-TEMPLATE copy 3/)