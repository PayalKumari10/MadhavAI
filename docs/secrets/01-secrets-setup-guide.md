# 🔐 Secrets Setup Guide

Quick guide to set up all secrets and environment variables for the MadhavAI project.

## 📋 Quick Start (5 minutes)

### Step 1: Create Local .env File

```bash
# Copy the example file
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` in your text editor and fill in the values:

```env
# Required for local development
API_BASE_URL=http://localhost:3000/api
ENABLE_API=false

# Required for Android release builds
ANDROID_KEYSTORE_PASSWORD=your_password_here
ANDROID_KEY_ALIAS=madhavai-release-key
ANDROID_KEY_PASSWORD=your_key_password_here

# Optional: Fill in if using AWS
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### Step 3: Generate Android Keystore (First Time Only)

```bash
cd android
./generate-keystore.sh
cd ..
```

Follow the prompts and use the same passwords you put in `.env`.

### Step 4: Test It Works

```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npm start -- --reset-cache
npm run android
```

## 📚 Complete Documentation

For detailed information, see:

- **[docs/ENV_SETUP.md](docs/ENV_SETUP.md)** - Complete setup guide with troubleshooting
- **[docs/SECRET_VARIABLES_REFERENCE.md](docs/SECRET_VARIABLES_REFERENCE.md)** - All variables and where they're used
- **[docs/SECRET_STORAGE_DIAGRAM.md](docs/SECRET_STORAGE_DIAGRAM.md)** - Architecture diagrams

## 🔑 All Secret Variables

### Essential (Required for Development)

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `API_BASE_URL` | Your backend URL | `http://localhost:3000/api` |
| `ENABLE_API` | Set to `false` for local-only | `false` |
| `ANDROID_KEYSTORE_PASSWORD` | Choose a strong password | `MySecurePass123!` |
| `ANDROID_KEY_ALIAS` | Choose a key name | `madhavai-release-key` |
| `ANDROID_KEY_PASSWORD` | Choose a strong password | `MyKeyPass123!` |

### Optional (For Production Features)

| Variable | Where to Get It | When Needed |
|----------|----------------|-------------|
| `OTA_API_BASE_URL` | Your OTA update server | When using OTA updates |
| `AWS_ACCESS_KEY_ID` | AWS Console → IAM | When using AWS services |
| `AWS_SECRET_ACCESS_KEY` | AWS Console → IAM | When using AWS services |
| `AWS_APPSYNC_GRAPHQL_ENDPOINT` | AWS Amplify Console | When using AppSync |
| `AWS_COGNITO_USER_POOL_ID` | AWS Cognito Console | When using authentication |

## 🚀 GitHub Actions Setup (For CI/CD)

### Step 1: Encode Your Keystore

```bash
# On macOS
base64 -i android/app/release.keystore | pbcopy

# On Linux
base64 -w 0 android/app/release.keystore
```

### Step 2: Add to GitHub Secrets

1. Go to your repository on GitHub
2. Click: **Settings** → **Secrets and variables** → **Actions**
3. Click: **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `ANDROID_KEYSTORE_BASE64` | Paste the base64 output from Step 1 |
| `ANDROID_KEYSTORE_PASSWORD` | Same as in your `.env` |
| `ANDROID_KEY_ALIAS` | Same as in your `.env` |
| `ANDROID_KEY_PASSWORD` | Same as in your `.env` |

## ✅ Verification Checklist

After setup, verify:

- [ ] `.env` file exists in project root
- [ ] `.env` is listed in `.gitignore` (already done)
- [ ] `android/app/release.keystore` exists
- [ ] Keystore file is listed in `.gitignore` (already done)
- [ ] App builds successfully: `npm run android`
- [ ] No TypeScript errors: `npm run type-check` (if available)
- [ ] GitHub Secrets added (if using CI/CD)

## 🔒 Security Reminders

### ✅ DO:
- Keep `.env` file on your local machine only
- Store keystore backup in a secure location (password manager, encrypted drive)
- Use different passwords for keystore and key
- Rotate secrets every 90 days
- Use GitHub Secrets for CI/CD

### ❌ DON'T:
- Commit `.env` to git
- Commit keystore file to git
- Share secrets via email or chat
- Use production secrets in development
- Reuse passwords across environments

## 🆘 Troubleshooting

### Problem: "Config is undefined"

```bash
# Solution: Restart Metro with cache reset
npm start -- --reset-cache
```

### Problem: "Keystore not found"

```bash
# Solution: Generate keystore
cd android
./generate-keystore.sh
cd ..
```

### Problem: "Build fails with signing error"

```bash
# Solution: Check passwords match
# 1. Check .env file has correct passwords
# 2. Verify keystore was created with same passwords
# 3. Clean and rebuild
cd android && ./gradlew clean && cd ..
npm run android
```

### Problem: "GitHub Actions build fails"

```bash
# Solution: Verify GitHub Secrets
# 1. Check all 4 secrets are added
# 2. Verify secret names match exactly (case-sensitive)
# 3. Re-encode keystore if needed
```

## 📞 Need Help?

1. Check the detailed docs in `docs/` folder
2. Review `.env.example` for all available variables
3. Check GitHub Actions logs for CI/CD issues
4. Verify all files are in `.gitignore`

## 🎯 What's Next?

After setting up secrets:

1. **Test locally**: `npm run android`
2. **Push to GitHub**: Verify CI/CD builds pass
3. **Deploy**: Follow deployment guide in `android/ROLLOUT_STRATEGY.md`

---

**Remember**: Never commit secrets to version control! 🔐
