#!/bin/bash

# Quick Template Setup Script
# Usage: ./quick-setup.sh "Product Name" "#HEX_COLOR" "PRICE"

PRODUCT_NAME=$1
COLOR_HEX=$2
PRICE=$3
OLD_PRICE=$4

echo "🚀 Setting up landing page for: $PRODUCT_NAME"
echo "🎨 Primary Color: $COLOR_HEX"
echo "💰 Price: \$$PRICE (was \$$OLD_PRICE)"

# Create backup
cp index.html index-backup-$(date +%Y%m%d).html

# Update product name
sed -i '' "s/Netlify Beige Suede Wedge Sneakers/$PRODUCT_NAME/g" index.html

# Update color theme
sed -i '' "s/#C9A887/$COLOR_HEX/g" index.html

# Update prices
sed -i '' "s/\$69/\$$PRICE/g" index.html
sed -i '' "s/\$120/\$$OLD_PRICE/g" index.html

echo "✅ Basic setup complete!"
echo "📝 Next steps:"
echo "   1. Replace product images in /images/product/"
echo "   2. Update influencer photos in /images/worn-by-favorites/"
echo "   3. Fine-tune the guarantee text"
echo "   4. Adjust testimonials for your product"
echo "   5. Test on mobile and desktop"