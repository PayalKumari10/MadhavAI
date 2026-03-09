# Backend & Infrastructure Secrets Guide

This guide covers secrets for backend services, infrastructure, and CI/CD workflows.

---

## 📋 Overview

The project uses two separate environment files:

| File | Purpose | Used By |
|------|---------|---------|
| `.env` | Mobile app secrets | React Native app, local development |
| `.env.backend` | Backend/infrastructure secrets | Lambda functions, CI/CD workflows, Terraform |

---

## 🔐 Backend Secrets Setup

### Step 1: Create Backend Environment File

```bash
cp .env.backend.example .env.backend
```

### Step 2: Fill in Required Values

Open `.env.backend` and configure:

#### CI/CD & Security

```env
# Snyk Security Scanning
SNYK_TOKEN=your_snyk_token_here
```

Get your Snyk token:
1. Sign up at https://snyk.io
2. Go to Account Settings → API Token
3. Copy the token

#### Infrastructure Alerts

```env
# Email for alerts
ALERT_EMAIL=team@example.com

# Slack webhook for notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Create Slack webhook:
1. Go to https://api.slack.com/messaging/webhooks
2. Create a new webhook
3. Copy the webhook URL

#### Backend API URLs

```env
STAGING_API_URL=https://staging-api.madhavai.com
PRODUCTION_API_URL=https://api.madhavai.com
```

---

## 🚀 GitHub Secrets Setup (CI/CD)

These secrets are needed for automated workflows:

### Required for Backend CI/CD

Go to: **GitHub → Settings → Secrets → Actions**

Add these secrets:

| Secret Name | Value | Used For |
|-------------|-------|----------|
| `SNYK_TOKEN` | From Snyk account | Security scanning |
| `AWS_ACCESS_KEY_ID` | From AWS IAM | Backend deployment |
| `AWS_SECRET_ACCESS_KEY` | From AWS IAM | Backend deployment |
| `ALERT_EMAIL` | Your team email | Infrastructure alerts |
| `STAGING_API_URL` | Staging API URL | E2E testing |
| `SLACK_WEBHOOK` | Slack webhook URL | Deployment notifications |

### Required for Mobile CI/CD

| Secret Name | Value | Used For |
|-------------|-------|----------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore | APK signing |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | APK signing |
| `ANDROID_KEY_ALIAS` | Key alias | APK signing |
| `ANDROID_KEY_PASSWORD` | Key password | APK signing |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Service account JSON | Play Store upload |

---

## 📁 Where Secrets Are Used

### Mobile App (`.env`)

Used by:
- React Native app at runtime
- `react-native-config` package
- Local development builds
- `src/config/env.ts`

### Backend/Infrastructure (`.env.backend`)

Used by:
- GitHub Actions workflows (`.github/workflows/`)
- AWS Lambda functions (`infrastructure/lambda/`)
- Terraform deployments (`infrastructure/terraform/`)
- Backend CI/CD pipeline

---

## 🔍 Secret Usage by Workflow

### `android-build.yml` (Mobile Builds)

Uses these GitHub Secrets:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (optional)

### `backend-ci-cd.yml` (Backend Deployment)

Uses these GitHub Secrets:
- `SNYK_TOKEN`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ALERT_EMAIL`
- `STAGING_API_URL`
- `SLACK_WEBHOOK`

### `mobile-ci-cd.yml` (Mobile CI)

Uses no secrets (runs tests and linting only)

---

## 🛠️ Local Backend Development

If you're working on backend services locally:

### Step 1: Set up AWS credentials

```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

### Step 2: Load backend environment

```bash
# Load .env.backend variables
source .env.backend

# Or use direnv (recommended)
echo "dotenv .env.backend" > .envrc
direnv allow
```

### Step 3: Test Lambda functions locally

```bash
cd infrastructure/lambda/dr-test
npm install
npm test
```

---

## 🔒 Security Best Practices

### For Backend Secrets

1. **Never commit `.env.backend`** - It's in `.gitignore`
2. **Use IAM roles** - Prefer IAM roles over access keys when possible
3. **Rotate credentials** - Change AWS keys every 90 days
4. **Limit permissions** - Use least-privilege IAM policies
5. **Encrypt at rest** - Use AWS Secrets Manager for production

### For GitHub Secrets

1. **Use organization secrets** - For secrets shared across repos
2. **Limit workflow access** - Only give secrets to workflows that need them
3. **Audit regularly** - Review who has access to secrets
4. **Use environments** - Separate staging and production secrets

---

## 📊 Secret Management Matrix

| Secret | Local Dev | GitHub Actions | AWS Lambda | Terraform |
|--------|-----------|----------------|------------|-----------|
| `SNYK_TOKEN` | ❌ | ✅ | ❌ | ❌ |
| `AWS_ACCESS_KEY_ID` | ✅ | ✅ | ❌ (uses IAM role) | ✅ |
| `ALERT_EMAIL` | ❌ | ✅ | ✅ | ✅ |
| `STAGING_API_URL` | ✅ | ✅ | ❌ | ❌ |
| `SLACK_WEBHOOK` | ❌ | ✅ | ✅ | ❌ |
| `ANDROID_KEYSTORE_*` | ✅ | ✅ | ❌ | ❌ |

---

## 🆘 Troubleshooting

### Backend deployment fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify secrets are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

### Snyk scan fails

```bash
# Test Snyk token locally
snyk auth $SNYK_TOKEN
snyk test
```

### Slack notifications not working

```bash
# Test webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  $SLACK_WEBHOOK
```

### Terraform fails

```bash
# Check Terraform variables
cd infrastructure/terraform
terraform plan \
  -var="alert_email=$ALERT_EMAIL" \
  -var="environment=staging"
```

---

## 📚 Related Documentation

- [Mobile Secrets Setup](01-secrets-setup-guide.md) - Mobile app secrets
- [Environment Setup](02-env-setup.md) - Complete environment guide
- [Secret Variables Reference](03-secret-variables-reference.md) - All variables
- [Deployment Checklist](../deployment/03-deployment-checklist.md) - Deployment guide

---

## 🎯 Quick Reference

### Mobile Developer (Frontend)
- ✅ Need: `.env` file
- ❌ Don't need: `.env.backend` file

### Backend Developer
- ✅ Need: Both `.env` and `.env.backend` files
- ✅ Need: AWS credentials configured

### DevOps Engineer
- ✅ Need: All GitHub Secrets configured
- ✅ Need: AWS IAM permissions
- ✅ Need: Terraform access

---

**For mobile app secrets, see [Secrets Setup Guide](01-secrets-setup-guide.md)**
