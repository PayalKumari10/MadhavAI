#!/bin/bash

echo "🔧 Rebuilding Android app with image picker..."
echo ""

# Stop Metro bundler if running
echo "1. Stopping Metro bundler..."
pkill -f "react-native start" || true

# Clean Android build
echo "2. Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Clear Metro cache
echo "3. Clearing Metro cache..."
rm -rf /tmp/metro-* || true
rm -rf /tmp/haste-* || true

# Rebuild and run
echo "4. Rebuilding and installing app..."
npx react-native run-android

echo ""
echo "✅ Done! The app should now have the image picker working."
echo "   If you still see errors, try:"
echo "   1. Uninstall the app from your device"
echo "   2. Run this script again"
