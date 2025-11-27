#!/bin/bash
# Auto-generate manifest.json from actual files
# This would run on deploy/build time in real platforms

cd images
echo '{' > manifest.json

# Product images
echo '  "product": [' >> manifest.json
ls product/*.{jpg,jpeg,png} 2>/dev/null | sed 's/product\//    "/g; s/$/",/' | sed '$ s/,$//' >> manifest.json
echo '  ],' >> manifest.json

# Testimonial images
echo '  "testimonials": [' >> manifest.json
ls testimonials/*.{jpg,jpeg,png} 2>/dev/null | sed 's/testimonials\//    "/g; s/$/",/' | sed '$ s/,$//' >> manifest.json
echo '  ],' >> manifest.json

# Worn by favorites
echo '  "worn-by-favorites": [' >> manifest.json
ls worn-by-favorites/*.{jpg,jpeg,png} 2>/dev/null | sed 's/worn-by-favorites\//    "/g; s/$/",/' | sed '$ s/,$//' >> manifest.json
echo '  ]' >> manifest.json

echo '}' >> manifest.json

echo "✅ Manifest generated with $(ls product/*.{jpg,jpeg,png} 2>/dev/null | wc -l) product images, $(ls testimonials/*.{jpg,jpeg,png} 2>/dev/null | wc -l) testimonials, $(ls worn-by-favorites/*.{jpg,jpeg,png} 2>/dev/null | wc -l) favorites"