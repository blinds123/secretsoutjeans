#!/bin/bash

# Script to update index.html with correct image paths and SimpleSwap integration

cd "/Users/nelsonchan/Downloads/Blue Sneaker lander"

# Update product image references
sed -i '' 's/webp_Generated_Image_September_28,_2025_-_11_12AM\.webp/prodsneaker11.webp/g' index.html
sed -i '' 's/webp_Generated_Image_September_28,_2025_-_11_13AM_(1)\.webp/prodsneaker121.webp/g' index.html
sed -i '' 's/webp_Generated_Image_September_28,_2025_-_11_13AM\.webp/prodsneaker1231.webp/g' index.html
sed -i '' 's/webp_Generated_Image_September_28,_2025_-_11_14AM\.webp/prodsneaker12341.webp/g' index.html

# Update testimonial images to use new generated ones
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (1)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (1).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (2)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (2).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (3)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (3).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (4)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (4).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (5)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (5).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (6)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (6).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (7)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (7).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (8)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (8).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (9)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (9).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_16AM (10)\.webp'/'Generated Image September 30, 2025 - 8_42AM (1) (10).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (1)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (1).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (2)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (2).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (3)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (3).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (4)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (4).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (5)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (5).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (6)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (6).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (7)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (7).webp'/g" index.html
sed -i '' "s/'webp_Generated Image September 28, 2025 - 11_19AM (8)\.webp'/'Generated Image September 30, 2025 - 8_42AM (2) (8).webp'/g" index.html

# Update worn-by-favorites images
sed -i '' "s/'alix-earle\.jpg'/'alix-earle.webp'/g" index.html
sed -i '' "s/'monet-mcmichael\.jpg'/'monet-mcmichael.webp'/g" index.html
sed -i '' "s/'alex-cooper\.jpeg'/'alex-cooper.webp'/g" index.html

echo "✅ Image paths updated successfully!"
