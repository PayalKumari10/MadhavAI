# 👋 START HERE - MadhavAI Setup

Welcome! This guide will get you from zero to deployed in 15 minutes.

---

## 📍 You Are Here

```
✅ MVP Development Complete
📍 YOU ARE HERE → Local Setup & Deployment
⬜ Play Store Deployment (optional)
⬜ Backend API Integration (when ready)
```

---

## 🚀 Quick Setup (15 minutes)

### 1. Create .env file (2 min)

```bash
cp .env.example .env
```

Edit `.env` and add these 3 values:

```env
ANDROID_KEYSTORE_PASSWORD=YourSecurePassword123!
ANDROID_KEY_ALIAS=madhavai-release-key
ANDROID_KEY_PASSWORD=YourKeyPassword123!
```

### 2. Generate keystore (2 min)

```bash
cd android
./generate-keystore.sh
cd ..
```

Use the same passwords from `.env` above.

### 3. Install & test (3 min)

```bash
npm install
npm run android
```

### 4. Push to GitHub (2 min)

```bash
git add .
git commit -m "feat: complete MVP with mobile build and OTA updates"
git push
```

### 5. Add GitHub Secrets (3 min)

```bash
# Encode keystore
base64 -i android/app/release.keystore | pbcopy  # macOS
base64 -w 0 android/app/release.keystore          # Linux
```

Go to: **GitHub → Settings → Secrets → Actions**

Add 4 secrets:
- `ANDROID_KEYSTORE_BASE64` (paste base64 output)
- `ANDROID_KEYSTORE_PASSWORD` (from .env)
- `ANDROID_KEY_ALIAS` (madhavai-release-key)
- `ANDROID_KEY_PASSWORD` (from .env)

### 6. Verify (3 min)

Go to **Actions** tab → Wait for build → Download APK → Test

---

## 📚 Documentation

### Quick Guides
- **[Quick Start](docs/deployment/01-quick-start.md)** - 10-minute setup
- **[What to Do Next](docs/deployment/02-what-to-do-next.md)** - Step-by-step guide
- **[Secrets Setup](docs/secrets/01-secrets-setup-guide.md)** - Secrets guide

### Complete Guides
- **[Deployment Checklist](docs/deployment/03-deployment-checklist.md)** - Complete deployment
- **[Environment Setup](docs/secrets/02-env-setup.md)** - Environment variables
- **[Documentation Index](docs/README.md)** - All documentation

---

## 📁 Project Structure

```
MadhavAI/
├── START_HERE.md                 ← You are here
├── README.md                        ← Project overview
├── .env.example                     ← Copy to .env
│
├── docs/
│   ├── README.md                    ← Documentation index
│   │
│   ├── deployment/                  ← Deployment guides
│   │   ├── 01-quick-start.md       ← 10-min setup
│   │   ├── 02-what-to-do-next.md   ← Next steps
│   │   └── 03-deployment-checklist.md ← Complete guide
│   │
│   └── secrets/                     ← Secrets & env vars
│       ├── 01-secrets-setup-guide.md  ← Quick setup
│       ├── 02-env-setup.md            ← Complete guide
│       ├── 03-secret-variables-reference.md
│       └── 04-secret-storage-diagram.md
│
├── android/
│   ├── BUILD_OPTIMIZATION.md       ← Build optimization
│   ├── ROLLOUT_STRATEGY.md         ← Deployment strategy
│   └── DIRECT_DISTRIBUTION.md      ← Direct APK distribution
│
└── src/                             ← Source code
```

---

## 🎯 What's Next?

After setup, you can:

1. **Deploy to Play Store** → See `android/ROLLOUT_STRATEGY.md`
2. **Distribute directly** → See `android/DIRECT_DISTRIBUTION.md`
3. **Set up backend API** → Update `API_BASE_URL` in `.env`
4. **Enable OTA updates** → See `docs/11-update-mechanisms.md`

---

## 🆘 Problems?

### App won't build
```bash
npm start -- --reset-cache
cd android && ./gradlew clean && cd ..
npm run android
```

### Missing .env file
```bash
cp .env.example .env
# Then edit .env
```

### GitHub Actions fails
- Check all 4 secrets are added
- Verify secret names match exactly
- Re-encode keystore if needed

---

## ✅ Checklist

Before pushing to GitHub:

- [ ] `.env` file created
- [ ] Keystore generated
- [ ] App builds locally
- [ ] Keystore backed up
- [ ] Ready to push!

After pushing to GitHub:

- [ ] Code pushed
- [ ] 4 GitHub Secrets added
- [ ] GitHub Actions succeeds
- [ ] APK downloaded and tested

---

## 📞 Need Help?

1. Check [Quick Start](docs/deployment/01-quick-start.md)
2. Review [What to Do Next](docs/deployment/02-what-to-do-next.md)
3. See [Documentation Index](docs/README.md)

---

**Ready? → [Quick Start Guide](docs/deployment/01-quick-start.md)**
