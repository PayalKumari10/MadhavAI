# Android Build Optimization Guide

## Overview

This document outlines the optimizations implemented to keep the MadhavAI app under 50 MB and ensure optimal performance on low-end devices (2 GB RAM, Android 8.0+).

## Current Optimizations

### 1. Code Optimization

#### ProGuard/R8 Configuration
- **Enabled**: Code shrinking, obfuscation, and optimization
- **Benefits**: Reduces APK size by 30-40%
- **Configuration**: `android/app/proguard-rules.pro`

```gradle
minifyEnabled true
shrinkResources true
proguardFiles getDefaultProguardFile("proguard-android-optimize.txt")
```

#### Hermes Engine
- **Enabled**: Using Hermes JavaScript engine
- **Benefits**: 
  - Faster app startup (50% improvement)
  - Reduced memory usage (30% reduction)
  - Smaller APK size (bytecode vs JavaScript)
- **Configuration**: `hermesEnabled=true` in `gradle.properties`

### 2. Resource Optimization

#### Image Assets
- Use WebP format for images (30% smaller than PNG)
- Provide only necessary densities (mdpi, hdpi, xhdpi, xxhdpi)
- Remove unused resources with `shrinkResources`

#### Vector Drawables
- Use vector drawables instead of raster images where possible
- Reduces size and supports all screen densities

#### Language Resources
- Enable language splitting in app bundle
- Users download only their selected language

### 3. Native Library Optimization

#### ABI Splitting
- Build separate APKs for different CPU architectures
- Users download only their device's architecture
- Reduces APK size by 60-70%

```gradle
splits {
    abi {
        enable true
        include "armeabi-v7a", "arm64-v8a"
    }
}
```

#### Supported ABIs
- **armeabi-v7a**: 32-bit ARM (older devices)
- **arm64-v8a**: 64-bit ARM (modern devices)
- **Excluded**: x86, x86_64 (emulator only, not needed for production)

### 4. App Bundle Optimization

#### Android App Bundle (AAB)
- Use AAB format for Play Store distribution
- Google Play generates optimized APKs for each device
- Reduces download size by 35% on average

```gradle
bundle {
    language { enableSplit = true }
    density { enableSplit = true }
    abi { enableSplit = true }
}
```

### 5. Dependency Optimization

#### Remove Unused Dependencies
Regularly audit and remove unused npm packages:
```bash
npm install -g depcheck
depcheck
```

#### Use Specific Imports
Import only needed components:
```javascript
// Bad
import _ from 'lodash';

// Good
import debounce from 'lodash/debounce';
```

### 6. Asset Optimization

#### Offline Data
- Compress offline data with gzip
- Use SQLite for structured data (more efficient than JSON)
- Lazy load non-essential data

#### Training Videos
- Store videos on S3, not in APK
- Download on-demand or during WiFi sync
- Use adaptive bitrate streaming

### 7. Build Variants

#### Debug vs Release
- Debug: Faster builds, no optimization
- Release: Full optimization, smaller size

```gradle
buildTypes {
    debug {
        minifyEnabled false
        shrinkResources false
    }
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

## Size Targets

### APK Size Targets
- **Universal APK**: < 50 MB (requirement)
- **arm64-v8a APK**: < 30 MB (target)
- **armeabi-v7a APK**: < 28 MB (target)

### Download Size (via Play Store)
- **Typical download**: 20-25 MB (with app bundle optimization)
- **First-time install**: 25-30 MB (includes base resources)

## Monitoring Build Size

### Automated Checks
The CI/CD pipeline automatically checks APK size:
```yaml
- name: Check APK size
  run: |
    APK_SIZE_MB=$((APK_SIZE / 1024 / 1024))
    if [ $APK_SIZE_MB -gt 50 ]; then
      echo "⚠️  Warning: APK size exceeds 50 MB target"
      exit 1
    fi
```

### Manual Analysis
Analyze APK composition:
```bash
# Build release APK
cd android
./gradlew assembleRelease

# Analyze APK
./gradlew :app:analyzeReleaseBundle

# Or use Android Studio APK Analyzer
# Build > Analyze APK > Select app-release.apk
```

## Performance Optimization

### Startup Time
- **Target**: < 3 seconds on low-end devices
- **Optimizations**:
  - Hermes engine for faster JS execution
  - Lazy load non-critical modules
  - Optimize splash screen
  - Defer analytics initialization

### Memory Usage
- **Target**: < 150 MB on low-end devices (2 GB RAM)
- **Optimizations**:
  - Use FlatList for long lists
  - Implement image caching with size limits
  - Release resources when not in use
  - Monitor memory leaks with LeakCanary

### Battery Consumption
- **Target**: < 5% per hour of active use
- **Optimizations**:
  - Batch network requests
  - Use WorkManager for background tasks
  - Optimize location tracking
  - Reduce wake locks

## Build Commands

### Development Build
```bash
cd android
./gradlew assembleDebug
```

### Release Build (Local)
```bash
# Set environment variables
export MADHAVAI_UPLOAD_STORE_FILE=/path/to/keystore
export MADHAVAI_UPLOAD_STORE_PASSWORD=your_password
export MADHAVAI_UPLOAD_KEY_ALIAS=your_alias
export MADHAVAI_UPLOAD_KEY_PASSWORD=your_key_password

# Build
cd android
./gradlew bundleRelease assembleRelease
```

### Analyze Build
```bash
cd android
./gradlew :app:analyzeReleaseBundle
```

## Troubleshooting

### Build Size Too Large

1. **Check resource usage**:
   ```bash
   ./gradlew :app:analyzeReleaseBundle
   ```

2. **Remove unused resources**:
   - Enable `shrinkResources true`
   - Remove unused images and assets
   - Compress images with WebP

3. **Optimize dependencies**:
   - Remove unused npm packages
   - Use specific imports
   - Consider lighter alternatives

4. **Check native libraries**:
   - Ensure ABI splitting is enabled
   - Remove x86/x86_64 ABIs for production

### ProGuard Issues

1. **App crashes after ProGuard**:
   - Check ProGuard rules in `proguard-rules.pro`
   - Add keep rules for reflection-based code
   - Test release builds thoroughly

2. **Missing classes**:
   - Add keep rules for third-party libraries
   - Check library documentation for ProGuard rules

### Build Performance

1. **Slow builds**:
   - Enable Gradle daemon
   - Increase Gradle memory: `org.gradle.jvmargs=-Xmx4096m`
   - Use build cache
   - Upgrade to latest Gradle version

## Future Optimizations

### Planned Improvements
1. **Dynamic Feature Modules**: Split app into modules, download on-demand
2. **Image Optimization**: Implement progressive image loading
3. **Code Splitting**: Lazy load JavaScript bundles
4. **Asset Compression**: Use Brotli compression for assets
5. **Native Code**: Move performance-critical code to native (C++)

### Monitoring
- Set up automated size tracking in CI/CD
- Alert when APK size increases by > 5%
- Regular size audits (monthly)
- Performance profiling on low-end devices

## References

- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [Shrink, obfuscate, and optimize your app](https://developer.android.com/studio/build/shrink-code)
- [Hermes Engine](https://reactnative.dev/docs/hermes)
- [React Native Performance](https://reactnative.dev/docs/performance)
