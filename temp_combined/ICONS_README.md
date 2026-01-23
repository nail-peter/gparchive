# PWA Icons

You need to create two icon files:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

## Quick Creation

### Option 1: Online Tools
1. Go to https://favicon.io/
2. Upload a logo or create text-based icon
3. Download and rename files

### Option 2: ImageMagick
```bash
# Create simple colored square icons
convert -size 192x192 xc:#000000 \
  -gravity center \
  -pointsize 120 \
  -fill white \
  -annotate +0+0 "GP" \
  icon-192.png

convert -size 512x512 xc:#000000 \
  -gravity center \
  -pointsize 320 \
  -fill white \
  -annotate +0+0 "GP" \
  icon-512.png
```

### Option 3: Design Tools
Use Figma, Canva, or Photoshop to create:
- Simple logo with "GP" text
- Minimalist design
- Black background with white text
- Export as PNG

## Important
- Icons must be present for PWA installation
- Use simple, recognizable design
- Test on both iOS and Android
