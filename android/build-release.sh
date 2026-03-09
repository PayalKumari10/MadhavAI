#!/bin/bash

# Build script for generating release APK and AAB
# This script builds both APK (for direct distribution) and AAB (for Play Store)

set -e

echo "🚀 Starting MadhavAI release build..."

# Check if keystore properties are set
if [ -z "$MADHAVAI_UPLOAD_STORE_FILE" ]; then
    echo "❌ Error: MADHAVAI_UPLOAD_STORE_FILE environment variable not set"
    echo "Please set the following environment variables:"
    echo "  - MADHAVAI_UPLOAD_STORE_FILE"
    echo "  - MADHAVAI_UPLOAD_STORE_PASSWORD"
    echo "  - MADHAVAI_UPLOAD_KEY_ALIAS"
    echo "  - MADHAVAI_UPLOAD_KEY_PASSWORD"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd app
./gradlew clean

# Build release AAB (for Play Store)
echo "📦 Building release AAB..."
./gradlew bundleRelease

# Build release APK (for direct distribution)
echo "📦 Building release APK..."
./gradlew assembleRelease

# Display build outputs
echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📱 Build outputs:"
echo "  AAB: app/build/outputs/bundle/release/app-release.aab"
echo "  APK (Universal): app/build/outputs/apk/release/app-universal-release.apk"
echo "  APK (arm64-v8a): app/build/outputs/apk/release/app-arm64-v8a-release.apk"
echo "  APK (armeabi-v7a): app/build/outputs/apk/release/app-armeabi-v7a-release.apk"
echo ""

# Display file sizes
echo "📊 Build sizes:"
ls -lh app/build/outputs/bundle/release/app-release.aab 2>/dev/null || echo "  AAB not found"
ls -lh app/build/outputs/apk/release/app-universal-release.apk 2>/dev/null || echo "  Universal APK not found"
ls -lh app/build/outputs/apk/release/app-arm64-v8a-release.apk 2>/dev/null || echo "  arm64-v8a APK not found"
ls -lh app/build/outputs/apk/release/app-armeabi-v7a-release.apk 2>/dev/null || echo "  armeabi-v7a APK not found"
