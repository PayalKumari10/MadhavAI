# ⚡ Quick Start Guide

**Time needed**: 10-15 minutes

---

## 🎯 What You'll Do

```
Local Setup → Test Build → Push to GitHub → Add Secrets → Deploy
   (5 min)      (3 min)       (2 min)        (3 min)      (Done!)
```

---

## 1️⃣ LOCAL SETUP (5 minutes)

### Create .env file

```bash
cp .env.example .env
```

Edit `.env` - **only these 3 are required**:

```env
API_BASE_URL=http://localhost:3000/api
ANDROID_KEYSTORE_PASSWORD=YourPassword123!
ANDROID_KEY_PASSWORD=YourKeyPass123!
```

### Generate keystore

```bash
cd android
./generate-keystore.sh
cd ..
```

Use the same passwords from `.env` above.

### Install & build

```bash
npm install
cd android && ./gradlew clean && cd ..
npm run android
```

**✅ Success**: App launches without errors

---

## 2️⃣ TEST BUILD (3 minutes)

```bash
cd android
./gradlew assembleRelease
cd ..
```

**✅ Success**: APK created at `android/app/build/outputs/apk/release/app-release.apk`

---

## 3️⃣ PUSH TO GITHUB (2 minutes)

### Backup keystore first!

```bash
cp android/app/release.keystore ~/Documents/madhavai-keystore-BACKUP.keystore
```

### Commit and push

```bash
git add .
git commit -m "feat: complete MVP with mobile build and OTA updates"
git push
```

---

## 4️⃣ ADD GITHUB SECRETS (3 minutes)

### Encode keystore

```bash
# macOS
base64 -i android/app/release.keystore | pbcopy

# Linux
base64 -w 0 android/app/release.keystore
```

### Add to GitHub

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these 4 secrets:

| Name | Value |
|------|-------|
| `ANDROID_KEYSTORE_BASE64` | Paste the base64 output |
| `ANDROID_KEYSTORE_PASSWORD` | From your .env |
| `ANDROID_KEY_ALIAS` | `madhavai-release-key` |
| `ANDROID_KEY_PASSWORD` | From your .env |

---

## 5️⃣ VERIFY DEPLOYMENT (2 minutes)

1. Go to **Actions** tab in GitHub
2. Wait for build to complete (5-10 min)
3. Download APK from artifacts
4. Install and test on device

**✅ Success**: APK installs and runs!

---

## 🎉 YOU'RE DONE!

Your MVP is now:
- ✅ Building locally
- ✅ Building on GitHub Actions
- ✅ Ready for distribution
- ✅ Configured for OTA updates

---

## 📚 Next Steps

- **Deploy to Play Store**: See `android/play-store/LISTING.md`
- **Set up backend API**: Update `API_BASE_URL` in `.env`
- **Enable OTA updates**: Deploy OTA server and update `OTA_API_BASE_URL`

---

## 🆘 Problems?

### App crashes on launch
```bash
# Reset everything
npm start -- --reset-cache
cd android && ./gradlew clean && cd ..
npm run android
```

### Build fails
```bash
# Check .env exists
ls -la .env

# Check keystore exists
ls -la android/app/release.keystore

# Reinstall
rm -rf node_modules && npm install
```

### GitHub Actions fails
- Verify all 4 secrets are added
- Check secret names are exact (case-sensitive)
- Re-encode keystore if needed

---

## 📖 Full Documentation

For detailed guides, see:
- `DEPLOYMENT_CHECKLIST.md` - Complete step-by-step guide
- `docs/ENV_SETUP.md` - Environment variables setup
- `docs/SECRET_VARIABLES_REFERENCE.md` - All variables explained
- `SECRETS_SETUP_GUIDE.md` - Quick secrets guide
