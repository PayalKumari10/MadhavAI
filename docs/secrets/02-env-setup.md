# Environment Variables Setup

This document explains how to set up and manage environment variables for local development and production builds.

## Local Development Setup

### 1. Create .env File

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

### 2. Edit .env File

Open `.env` and add your actual values:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000
ENABLE_API=false

# Android Build Secrets (for local release builds)
ANDROID_KEYSTORE_PASSWORD=your_actual_keystore_password
ANDROID_KEY_ALIAS=your_actual_key_alias
ANDROID_KEY_PASSWORD=your_actual_key_password

# AWS Amplify (if using)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Storage Configuration
STORAGE_LIMIT_MB=500
SYNC_INTERVAL_MS=60000
MAX_RETRY_ATTEMPTS=3
```

### 3. Generate Android Keystore (First Time Only)

If you haven't generated a keystore yet:

```bash
cd android
./generate-keystore.sh
```

This will create `android/app/release.keystore` and prompt you for passwords. Use the same passwords in your `.env` file.

## Where Secrets Are Stored

### Local Development
- **File**: `.env` (in project root)
- **Purpose**: Store API keys, keystore passwords, AWS credentials
- **Security**: This file is gitignored and never committed to version control
- **Access**: Used by `react-native-config` package to inject values at build time

### Android Keystore
- **File**: `android/app/release.keystore`
- **Purpose**: Sign release builds of the Android app
- **Security**: This file is gitignored and never committed
- **Backup**: Keep a secure backup of this file - if lost, you cannot update your app on Play Store

### GitHub Actions (CI/CD)
- **Location**: GitHub Repository Settings → Secrets and variables → Actions
- **Purpose**: Build release APKs in CI/CD pipeline
- **Required Secrets**:
  - `ANDROID_KEYSTORE_BASE64` - Base64 encoded keystore file
  - `ANDROID_KEYSTORE_PASSWORD` - Keystore password
  - `ANDROID_KEY_ALIAS` - Key alias
  - `ANDROID_KEY_PASSWORD` - Key password
  - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (optional) - For automated Play Store uploads

## Using Environment Variables in Code

### JavaScript/TypeScript

```typescript
import { config } from './config/env';

// Access configuration
console.log(config.API_BASE_URL);
console.log(config.ENABLE_API);
```

### Android Native Code (build.gradle)

```groovy
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
}
```

## Different Environments

### Development
- Uses `.env` file
- `ENABLE_API=false` for local-only mode
- Debug logging enabled

### Staging
- Uses environment variables from CI/CD or staging server
- `ENABLE_API=true` with staging API URL
- Debug logging enabled

### Production
- Uses environment variables from CI/CD or production server
- `ENABLE_API=true` with production API URL
- Debug logging disabled

## Security Best Practices

1. **Never commit .env file** - It's in `.gitignore` for a reason
2. **Never commit keystore file** - Keep secure backups separately
3. **Use different keys for dev/prod** - Don't use production keys in development
4. **Rotate secrets regularly** - Change passwords and keys periodically
5. **Limit access** - Only give secrets to team members who need them
6. **Use GitHub Secrets** - For CI/CD, always use GitHub's encrypted secrets

## Troubleshooting

### "Config is undefined" Error
- Make sure you've created the `.env` file
- Restart Metro bundler: `npm start -- --reset-cache`
- Rebuild the app: `cd android && ./gradlew clean && cd .. && npm run android`

### Build Fails with Keystore Error
- Check that keystore file exists: `ls -la android/app/release.keystore`
- Verify environment variables are set correctly in `.env`
- Make sure passwords match the keystore you generated

### Environment Variables Not Loading
- Ensure `react-native-config` is installed: `npm list react-native-config`
- For Android, rebuild: `cd android && ./gradlew clean`
- For iOS, reinstall pods: `cd ios && pod install`

## Adding New Environment Variables

1. Add to `.env.example` with placeholder value
2. Add to `.env` with actual value
3. Update `src/config/env.ts` to read the new variable
4. Add to GitHub Secrets if needed for CI/CD
5. Document in this file
