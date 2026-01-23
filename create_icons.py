#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create black background
    img = Image.new('RGB', (size, size), color='black')
    draw = ImageDraw.Draw(img)

    # Calculate font size (roughly 60% of image size)
    font_size = int(size * 0.6)

    # Use default font
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default if arial not found
        font = ImageFont.load_default()

    # Text to draw
    text = "GP"

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Calculate position to center text
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    # Draw white text
    draw.text((x, y), text, fill='white', font=font)

    # Save
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

# Create both icons
create_icon(192, 'c:/Users/schmi/Downloads/gp_proxy_hosted/api/public/icon-192.png')
create_icon(512, 'c:/Users/schmi/Downloads/gp_proxy_hosted/api/public/icon-512.png')

print("\nIcons created successfully!")
