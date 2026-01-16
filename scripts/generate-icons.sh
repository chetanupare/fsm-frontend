#!/bin/bash

# Generate PWA icons from a source image
# Usage: ./scripts/generate-icons.sh source-image.png

if [ -z "$1" ]; then
    echo "Usage: ./scripts/generate-icons.sh source-image.png"
    exit 1
fi

SOURCE=$1
OUTPUT_DIR="public"

# Create output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    echo "Please install ImageMagick manually: sudo apt-get install imagemagick"
    exit 1
fi

# Generate icons
echo "Generating PWA icons..."

# 192x192 icon
convert $SOURCE -resize 192x192 $OUTPUT_DIR/pwa-192x192.png

# 512x512 icon
convert $SOURCE -resize 512x512 $OUTPUT_DIR/pwa-512x512.png

echo "Icons generated successfully!"
echo "Files created:"
echo "  - $OUTPUT_DIR/pwa-192x192.png"
echo "  - $OUTPUT_DIR/pwa-512x512.png"
