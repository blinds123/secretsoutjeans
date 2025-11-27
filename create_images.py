#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# Create directory if it doesn't exist
os.makedirs('images/order-bump', exist_ok=True)

# Create sunglasses image
sunglasses = Image.new('RGB', (400, 400), color='#E8E8E8')
draw = ImageDraw.Draw(sunglasses)

# Draw sunglasses shape
# Left lens
draw.ellipse([60, 130, 180, 230], fill='black')
# Right lens
draw.ellipse([220, 130, 340, 230], fill='black')
# Bridge
draw.arc([180, 170, 220, 190], 0, 180, fill='black', width=5)
# Arms
draw.rectangle([40, 175, 60, 185], fill='black')
draw.rectangle([340, 175, 360, 185], fill='black')

# Add text
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
    small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
except:
    font = ImageFont.load_default()
    small_font = ImageFont.load_default()

draw.text((200, 280), "SUNGLASSES", fill='black', anchor='mm', font=font)
draw.text((200, 320), "Designer Shades", fill='gray', anchor='mm', font=small_font)

# Add visual indicator
draw.rectangle([10, 10, 390, 30], fill='#FFD700')
draw.text((200, 20), "🕶️ SUNGLASSES IMAGE", fill='black', anchor='mm')

sunglasses.save('images/order-bump/sunglasses.jpeg', 'JPEG', quality=95)
print("✅ Created sunglasses.jpeg")

# Create wallet image
wallet = Image.new('RGB', (400, 400), color='#E8E8E8')
draw = ImageDraw.Draw(wallet)

# Draw wallet shape
draw.rectangle([100, 120, 300, 260], fill='#8B4513')
draw.rectangle([105, 125, 295, 255], fill='#A0522D')

# Card slots
draw.rectangle([120, 140, 180, 170], fill='#654321')
draw.rectangle([190, 140, 250, 170], fill='#654321')
draw.rectangle([120, 180, 180, 210], fill='#654321')

# Money symbol
draw.text((200, 195), "$$$", fill='#00AA00', anchor='mm', font=font)

# Add text
draw.text((200, 290), "WALLET", fill='black', anchor='mm', font=font)
draw.text((200, 330), "Premium Leather", fill='gray', anchor='mm', font=small_font)

# Add visual indicator
draw.rectangle([10, 10, 390, 30], fill='#8B4513')
draw.text((200, 20), "💼 WALLET IMAGE", fill='white', anchor='mm')

wallet.save('images/order-bump/wallet.jpeg', 'JPEG', quality=95)
print("✅ Created wallet.jpeg")

print("\n📁 Images saved to: images/order-bump/")
print("   - sunglasses.jpeg (with sunglasses visual)")
print("   - wallet.jpeg (with wallet visual)")