# Background Images

This folder is for background images used throughout the application.

## Current Images

- **`home-background.jpg`** - Background for the home page (Information Archive landing)
- **`family-selection-background.jpg`** - Background for the family selection page

## Adding/Replacing Images

### Home Page Background

1. Place your image file in this folder as `home-background.jpg`
2. The image should be:
   - High resolution (1920x1080 or larger recommended)
   - JPG or PNG format
   - Optimized for web (compressed but good quality)

3. The CSS in `client/src/index.css` is already configured to use this image via `.home-hub__bg-image`

### Family Selection Background

1. Place your image file in this folder as `family-selection-background.jpg`
2. Same image requirements as above
3. The CSS in `client/src/index.css` is already configured to use this image via `.family-selection__bg-image`

## Image Guidelines

- **Opacity**: Background images are displayed at ~18% opacity for subtlety
- **Pattern Overlay**: A light pattern overlay is automatically applied on top
- **Readability**: Gradient overlays ensure text remains readable over any image
- **File Size**: Keep images under 500KB for optimal loading (use image compression tools if needed)

## Supported Formats

- JPG (recommended for photos)
- PNG (for images with transparency)
- WebP (for modern browsers, best compression)

## Technical Details

Both background images use the same layering system:
1. Base background image (low opacity)
2. Gradient overlay for text readability
3. Pattern overlay for texture
4. Content layers (z-index: 3+)

The system includes fallback gradients if images are missing, so the pages will still look good even without images.

