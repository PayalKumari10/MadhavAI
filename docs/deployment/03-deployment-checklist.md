# 🚀 MVP Deployment Checklist

Complete step-by-step guide from local setup to production deployment.

---

## 📍 PHASE 1: LOCAL SETUP (Do This First!)

### Step 1: Fix Amplify Import Issue

The project has a broken Amplify import that will cause crashes. Let's fix it:

```bash
# Option A: Remove Amplify (if not using it)
rm src/awsConfig.js

# Then edit index.js and remove this line:
# import './src/awsConfig';

# Option B: Create dummy aws-exports.js (if keeping Amplify for future)
# Create src/aws-exports.js with empty config
```

**Choose Option A for now** (we're not using Amplify yet).

### Step 2: Create Your .env File

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add these minimum required values:

```env
# Required for local development
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000
ENABLE_API=false

# Required for Android builds
ANDROID_KEYSTORE_PASSWORD=YourSecurePassword123!
ANDROID_KEY_ALIAS=madhavai-release-key
ANDROID_KEY_PASSWORD=YourKeyPassword123!

# OTA Updates (use default for now)
OTA_API_BASE_URL=https://api.madhavai.app

# Storage settings (use defaults)
STORAGE_LIMIT_MB=500
SYNC_INTERVAL_MS=60000
MAX_RETRY_ATTEMPTS=3
```

### Step 3: Generate Android Keystore

```bash
cd android
./generate-keystore.sh
```

When prompted:
- **Keystore password**: Use the same as `ANDROID_KEYSTORE_PASSWORD` in .env
- **Key alias**: Use `madhavai-release-key` (same as in .env)
- **Key password**: Use the same as `ANDROID_KEY_PASSWORD` in .env
- **Name**: Your name or company name
- **Organization**: Your organization
- **City, State, Country**: Your location

This creates: `android/app/release.keystore` (gitignored, never commit this!)

```bash
cd ..  # Go back to project root
```

### Step 4: Install Dependencies

```bash
# Install npm packages
npm install

# Clean Android build
cd android
./gradlew clean
cd ..
```

### Step 5: Test Local Build

```bash
# Start Metro bundler
npm start

# In another terminal, build and run Android
npm run android
```

**Expected result**: App should build and run without errors.

### Step 6: Test Release Build Locally

```bash
cd android
./gradlew assembleRelease
cd ..
```

**Expected result**: 
- Build succeeds
- APK created at: `android/app/build/outputs/apk/release/app-release.apk`
- File size should be under 50 MB

### Step 7: Verify Everything Works

- [ ] App launches without crashes
- [ ] No TypeScript errors: Check your IDE
- [ ] Release build succeeds
- [ ] APK file exists and is under 50 MB
- [ ] `.env` file is NOT committed (check with `git status`)
- [ ] `release.keystore` is NOT committed

---

## 📍 PHASE 2: PREPARE FOR GITHUB

### Step 8: Create Backup of Keystore

**CRITICAL**: If you lose this file, you can NEVER update your app on Play Store!

```bash
# Copy keystore to a secure location
cp android/app/release.keystore ~/Documents/madhavai-keystore-backup.keystore

# Or upload to secure cloud storage (encrypted)
```

Store these passwords securely (password manager):
- Keystore password
- Key alias
- Key password

### Step 9: Encode Keystore for GitHub

```bash
# On macOS
base64 -i android/app/release.keystore | pbcopy
# (Now it's in your clipboard)

# On Linux
base64 -w 0 android/app/release.keystore
# (Copy the output)

# Save this base64 string somewhere temporarily - you'll need it for GitHub Secrets
```

### Step 10: Review What Will Be Committed

```bash
# Check git status
git status

# Make sure these are NOT listed:
# - .env
# - .env.local
# - android/app/release.keystore
# - node_modules/

# If they appear, they should be in .gitignore already
```

### Step 11: Commit Your Code

```bash
# Add all files
git add .

# Commit
git commit -m "feat: complete MVP with mobile build and OTA updates

- Add mobile app build pipeline
- Configure Android release builds with ProGuard
- Implement OTA update system
- Add A/B testing service
- Set up version compatibility checks
- Configure environment variables with .env
- Add comprehensive documentation"

# Check your branch
git branch
```

---

## 📍 PHASE 3: GITHUB SETUP

### Step 12: Push to GitHub

```bash
# If this is a new repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main

# If repository already exists
git push
```

### Step 13: Add GitHub Secrets

Go to your GitHub repository:

1. Click **Settings** (top menu)
2. Click **Secrets and variables** → **Actions** (left sidebar)
3. Click **New repository secret**

Add these 4 secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `ANDROID_KEYSTORE_BASE64` | Paste the base64 string from Step 9 | From your clipboard/temp file |
| `ANDROID_KEYSTORE_PASSWORD` | Your keystore password | From your .env file |
| `ANDROID_KEY_ALIAS` | `madhavai-release-key` | From your .env file |
| `ANDROID_KEY_PASSWORD` | Your key password | From your .env file |

**Important**: 
- Secret names are case-sensitive
- No spaces in secret names
- Values are encrypted by GitHub

### Step 14: Verify GitHub Actions

1. Go to **Actions** tab in your repository
2. You should see a workflow run starting automatically
3. Wait for it to complete (5-10 minutes)

**Expected result**:
- ✅ Build succeeds
- ✅ APK artifact is created
- ✅ You can download the APK from the workflow run

If it fails:
- Check the logs in the Actions tab
- Verify all 4 secrets are added correctly
- Make sure secret names match exactly

---

## 📍 PHASE 4: TESTING & VALIDATION

### Step 15: Download and Test GitHub Build

1. Go to **Actions** tab
2. Click on the latest successful workflow run
3. Scroll down to **Artifacts**
4. Download `app-release.apk`
5. Install on a test device:

```bash
# Via ADB
adb install app-release.apk

# Or transfer to device and install manually
```

### Step 16: Test on Real Device

- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] All features work as expected
- [ ] No errors in logs
- [ ] Performance is acceptable

### Step 17: Run Tests (if you have them)

```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📍 PHASE 5: DOCUMENTATION & CLEANUP

### Step 18: Update README

Add to your README.md:

```markdown
## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Run `npm install`
4. Generate keystore: `cd android && ./generate-keystore.sh`
5. Run `npm run android`

## Building Release APK

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Environment Variables

See [docs/ENV_SETUP.md](docs/ENV_SETUP.md) for complete setup guide.
```

### Step 19: Create Release Notes

Create a file `RELEASE_NOTES.md`:

```markdown
# Release Notes - MVP v1.0.0

## Features Implemented

### Mobile App Build & Distribution
- ✅ Android release build pipeline with ProGuard
- ✅ APK optimization (under 50 MB)
- ✅ Staged rollout configuration
- ✅ Direct APK distribution option

### OTA Updates
- ✅ Over-the-air content updates
- ✅ Critical security update system
- ✅ Feature update scheduler
- ✅ Version compatibility checks
- ✅ Backward compatibility for 2 versions

### A/B Testing
- ✅ Feature flag system
- ✅ User assignment tracking
- ✅ Metrics collection
- ✅ Variant performance tracking

### Infrastructure
- ✅ Environment variable management
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Automated release builds
- ✅ Comprehensive documentation

## Technical Details

- **Build Tool**: Gradle 8.x
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Bundle Size**: ~30-40 MB
- **Supported ABIs**: armeabi-v7a, arm64-v8a

## Documentation

- [Environment Setup](docs/ENV_SETUP.md)
- [Secret Variables Reference](docs/SECRET_VARIABLES_REFERENCE.md)
- [Build Optimization](android/BUILD_OPTIMIZATION.md)
- [Rollout Strategy](android/ROLLOUT_STRATEGY.md)
- [Update Mechanisms](docs/UPDATE_MECHANISMS.md)
```

---

## 📍 PHASE 6: NEXT STEPS (OPTIONAL)

### Step 20: Set Up Play Store (When Ready)

1. Create Google Play Developer account ($25 one-time fee)
2. Follow guide in `android/play-store/LISTING.md`
3. Upload APK or App Bundle
4. Configure staged rollout (10% → 25% → 50% → 100%)

### Step 21: Set Up Backend API (When Ready)

1. Deploy your backend API
2. Update `.env`:
   ```env
   API_BASE_URL=https://your-api.com/api
   ENABLE_API=true
   ```
3. Rebuild and test

### Step 22: Set Up OTA Update Server (When Ready)

1. Deploy OTA update service
2. Update `.env`:
   ```env
   OTA_API_BASE_URL=https://your-ota-api.com
   ```
3. Test update flow

### Step 23: Set Up Monitoring (Recommended)

Consider adding:
- Crash reporting (Sentry, Firebase Crashlytics)
- Analytics (Firebase Analytics, Mixpanel)
- Performance monitoring (Firebase Performance)
- Error tracking

---

## 🎯 QUICK REFERENCE

### Local Development
```bash
npm start                    # Start Metro
npm run android             # Run on Android
npm test                    # Run tests
```

### Building
```bash
cd android
./gradlew assembleRelease   # Build release APK
./gradlew bundleRelease     # Build App Bundle
./gradlew clean             # Clean build
```

### Troubleshooting
```bash
npm start -- --reset-cache  # Reset Metro cache
cd android && ./gradlew clean  # Clean Android build
rm -rf node_modules && npm install  # Reinstall dependencies
```

---

## ✅ FINAL CHECKLIST

Before considering MVP complete:

### Local
- [ ] `.env` file created and configured
- [ ] Keystore generated and backed up
- [ ] App builds and runs locally
- [ ] Release build succeeds
- [ ] No TypeScript errors
- [ ] All tests pass

### GitHub
- [ ] Code pushed to GitHub
- [ ] All 4 GitHub Secrets added
- [ ] GitHub Actions workflow succeeds
- [ ] APK artifact downloadable
- [ ] APK installs and runs on device

### Documentation
- [ ] README.md updated
- [ ] RELEASE_NOTES.md created
- [ ] All docs reviewed and accurate
- [ ] Team members can follow setup guide

### Security
- [ ] `.env` is gitignored
- [ ] Keystore is gitignored
- [ ] Keystore backup stored securely
- [ ] Passwords stored in password manager
- [ ] GitHub Secrets configured correctly

---

## 🆘 TROUBLESHOOTING

### Build Fails Locally
1. Check `.env` file exists and has all required values
2. Verify keystore exists: `ls -la android/app/release.keystore`
3. Clean build: `cd android && ./gradlew clean`
4. Reinstall: `rm -rf node_modules && npm install`

### GitHub Actions Fails
1. Verify all 4 secrets are added
2. Check secret names match exactly (case-sensitive)
3. Re-encode keystore if needed
4. Check workflow logs for specific error

### App Crashes on Launch
1. Check for Amplify import error in `index.js`
2. Remove `import './src/awsConfig';` if not using Amplify
3. Check Metro bundler logs for errors
4. Verify all dependencies installed

---

## 📞 NEED HELP?

1. Check documentation in `docs/` folder
2. Review GitHub Actions logs
3. Check `.env.example` for required variables
4. Verify keystore passwords match

**You're ready to deploy! 🎉**
