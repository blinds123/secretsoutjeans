# Product Landing Page Template Instructions

## Directory Structure Required
```
/your-product-folder/
├── index.html (main template file)
├── images/
│   ├── product/
│   │   ├── prodsneaker11.webp (main product image)
│   │   ├── prodsneaker121.webp (thumbnail 2)
│   │   ├── prodsneaker1231.webp (thumbnail 3)
│   │   └── prodsneaker12341.webp (thumbnail 4)
│   ├── worn-by-favorites/
│   │   ├── alix-earle.webp (influencer 1)
│   │   ├── monet-mcmichael.webp (influencer 2)
│   │   └── alex-cooper.webp (influencer 3)
│   ├── testimonials/
│   │   └── [customer testimonial images]
│   └── order-bump/
│       └── [order bump product images]
└── checkout-video-mobile/
    └── mobile-popup-checkout-video-optimized.mp4

## Dynamic Elements to Update

### 1. Product Information
- **Product Name**: Currently "Netlify Beige Suede Wedge Sneakers"
- **Price**: $69 (was $120)
- **Color Theme**: #C9A887 (beige - matches product)
- **Stock Count**: 32
- **Review Count**: 473

### 2. Color Palette Variables
The main color (#C9A887) appears in:
- Star ratings
- CTA button gradients
- Guarantee text color
- Accent elements

### 3. Sales Copy Elements
- **Headline**: [Brand] [Color] [Product Type]
- **Guarantee**: "Free Lifetime Perfect-Fit Guarantee..."
- **Influencer Quotes**: Must mention brand name
- **Testimonials**: Product-specific language

### 4. Image Requirements
- **Main Product**: 1200x1500px recommended, WebP format
- **Thumbnails**: 4 different angles, 300x300px min
- **Influencers**: 3 images, square format
- **Testimonials**: 18-20 customer photos

## Conversion Prompt for New Products

Use this prompt after duplicating and renaming the directory:

```
I have duplicated and renamed the landing page template directory and need to adapt it for my new product.

Working in: [Current directory name]
New Product: [YOUR PRODUCT NAME]
Main Product Color: [HEX CODE or describe the dominant color]
Product Images Location: [path to your product images]

Please update the following:

1. PRODUCT DETAILS:
   - Change product name from "Netlify Beige Suede Wedge Sneakers" to "[YOUR PRODUCT NAME]"
   - Update price from $69/$120 to $[NEW_PRICE]/$[OLD_PRICE]
   - Change all color references from "beige" to "[YOUR COLOR]"

2. COLOR PALETTE:
   - Extract the dominant color from the main product image
   - Replace all instances of #C9A887 with the new product's color
   - Update button gradients to use variations of the new color
   - Ensure star ratings and accents match

3. SALES COPY:
   - Rewrite the guarantee to be specific to [PRODUCT TYPE]
   - Update influencer quotes to mention the new product
   - Adjust testimonials language to match product category
   - Keep the psychological triggers but make them product-relevant

4. IMAGES:
   - Update all image paths in the HTML
   - Maintain the same image naming convention
   - Ensure order bump images are updated

5. PRODUCT-SPECIFIC ELEMENTS:
   - Update size chart (if applicable) or replace with relevant options
   - Modify product descriptions for the category
   - Adjust "Materials & Craftsmanship" content

Keep the same:
- Overall layout structure
- Conversion optimization elements
- Mobile responsiveness
- Animation effects
- Trust badges placement
- Urgency/scarcity messaging format

The color theme should automatically adapt based on the main product color to maintain visual cohesion.
```

## Key Template Features to Preserve

1. **Conversion Elements**
   - Influencer social proof at top
   - Review carousel
   - Stock countdown
   - Order bump popup
   - Sticky add-to-cart on mobile
   - Trust badges

2. **Technical Optimizations**
   - WebP image format
   - Lazy loading for below-fold
   - Mobile-first responsive design
   - Smooth animations
   - Fast page load

3. **Psychological Triggers**
   - Authority (influencers)
   - Social proof (reviews)
   - Scarcity (stock count)
   - Urgency (recent purchases)
   - Risk reversal (guarantee)

## Automation Possibilities

For full automation, you could create a script that:
1. Analyzes the main product image for dominant color
2. Replaces all color hex codes
3. Updates product name throughout
4. Swaps image paths
5. Generates appropriate sales copy using AI