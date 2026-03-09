# Complete Secrets Matrix

This document shows ALL secrets used in the project, their exact names, where they're used, and why.

---

## 📊 Complete Secrets Usage Matrix

### Mobile App Secrets

| Secret Name (Exact) | Local Dev (.env) | GitHub Actions | AWS Lambda | Terraform | Why Used |
|---------------------|------------------|----------------|------------|-----------|----------|
| `API_BASE_URL` | ✅ | ❌ | ❌ | ❌ | Main API endpoint for mobile app |
| `API_TIMEOUT` | ✅ | ❌ | ❌ | ❌ | API request timeout in milliseconds |
| `ENABLE_API` | ✅ | ❌ | ❌ | ❌ | Enable/disable API calls (offline mode) |
| `OTA_API_BASE_URL` | ✅ | ❌ | ❌ | ❌ | OTA update service endpoint |
| `STORAGE_LIMIT_MB` | ✅ | ❌ | ❌ | ❌ | Local storage limit for mobile app |
| `SYNC_INTERVAL_MS` | ✅ | ❌ | ❌ | ❌ | Data sync interval in milliseconds |
| `MAX_RETRY_ATTEMPTS` | ✅ | ❌ | ❌ | ❌ | Max retry attempts for failed requests |

### Android Build Secrets

| Secret Name (Exact) | Local Dev (.env) | GitHub Actions | AWS Lambda | Terraform | Why Used |
|---------------------|------------------|----------------|------------|-----------|----------|
| `ANDROID_KEYSTORE_PASSWORD` | ✅ | ✅ (as `ANDROID_KEYSTORE_PASSWORD`) | ❌ | ❌ | Password to unlock keystore file |
| `ANDROID_KEY_ALIAS` | ✅ | ✅ (as `ANDROID_KEY_ALIAS`) | ❌ | ❌ | Alias of the key inside keystore |
| `ANDROID_KEY_PASSWORD` | ✅ | ✅ (as `ANDROID_KEY_PASSWORD`) | ❌ | ❌ | Password for the specific key |
| `ANDROID_KEYSTORE_BASE64` | ❌ | ✅ | ❌ | ❌ | Base64 encoded keystore file (GitHub only) |

**Note on ANDROID_KEYSTORE vs ANDROID_KEYSTORE_BASE64:**
- **Local Dev**: Uses actual file `android/app/release.keystore` + password from `.env`
- **GitHub Actions**: Can't store binary files, so keystore is base64 encoded and stored as `ANDROID_KEYSTORE_BASE64` secret, then decoded during build

### AWS Amplify Secrets (Optional)

| Secret Name (Exact) | Local Dev (.env) | GitHub Actions | AWS Lambda | Terraform | Why Used |
|---------------------|------------------|----------------|------------|-----------|----------|
| `AWS_ACCESS_KEY_ID` | ✅ | ✅ | ❌ (uses IAM role) | ✅ | AWS authentication for Amplify CLI |
| `AWS_SECRET_ACCESS_KEY` | ✅ | ✅ | ❌ (uses IAM role) | ✅ | AWS authentication secret key |
| `AWS_REGION` | ✅ | ✅ | ✅ | ✅ | AWS region for services |
| `AWS_APPSYNC_GRAPHQL_ENDPOINT` | ✅ | ❌ | ❌ | ❌ | AppSync GraphQL API endpoint |
| `AWS_APPSYNC_API_KEY` | ✅ | ❌ | ❌ | ❌ | AppSync API key for authentication |
| `AWS_APPSYNC_REGION` | ✅ | ❌ | ❌ | ❌ | AppSync service region |
| `AWS_COGNITO_REGION` | ✅ | ❌ | ❌ | ❌ | Cognito service region |
| `AWS_COGNITO_USER_POOL_ID` | ✅ | ❌ | ❌ | ❌ | Cognito user pool identifier |
| `AWS_COGNITO_USER_POOL_WEB_CLIENT_ID` | ✅ | ❌ | ❌ | ❌ | Cognito app client ID |
| `AWS_COGNITO_IDENTITY_POOL_ID` | ✅ | ❌ | ❌ | ❌ | Cognito identity pool ID |

### Backend/Infrastructure Secrets

| Secret Name (Exact) | Local Dev (.env.backend) | GitHub Actions | AWS Lambda | Terraform | Why Used |
|---------------------|--------------------------|----------------|------------|-----------|----------|
| `SNYK_TOKEN` | ❌ | ✅ | ❌ | ❌ | Security vulnerability scanning in CI/CD |
| `ALERT_EMAIL` | ✅ | ✅ | ✅ | ✅ | Email for infrastructure alerts and notifications |
| `STAGING_API_URL` | ✅ | ✅ | ❌ | ❌ | Staging environment API for E2E tests |
| `PRODUCTION_API_URL` | ✅ | ❌ | ❌ | ❌ | Production environment API endpoint |
| `SLACK_WEBHOOK` | ❌ | ✅ | ✅ | ❌ | Slack notifications for deployments and alerts |

### Lambda Function Secrets

| Secret Name (Exact) | Local Dev (.env.backend) | GitHub Actions | AWS Lambda | Terraform | Why Used |
|---------------------|--------------------------|----------------|------------|-----------|----------|
| `PRIMARY_REGION` | ✅ | ❌ | ✅ | ✅ | Primary AWS region for disaster recovery |
| `BACKUP_REGION` | ✅ | ❌ | ✅ | ✅ | Backup AWS region for failover |
| `PROJECT_NAME` | ✅ | ❌ | ✅ | ✅ | Project identifier for resource naming |
| `ENVIRONMENT` | ✅ | ✅ | ✅ | ✅ | Environment name (dev/staging/prod) |
| `SNS_TOPIC_ARN` | ✅ | ❌ | ✅ | ✅ | SNS topic for sending alerts |
| `LESSONS_TABLE` | ✅ | ❌ | ✅ | ✅ | DynamoDB table for training lessons |
| `PROGRESS_TABLE` | ✅ | ❌ | ✅ | ✅ | DynamoDB table for learning progress |
| `CONTENT_BUCKET` | ✅ | ❌ | ✅ | ✅ | S3 bucket for training content |

### Google Play Store Secrets

| Secret Name (Exact) | Local Dev (.env) | GitHub Actions | AWS Lambda | Terraform | Why Used |
|---------------------|------------------|----------------|------------|-----------|----------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | ❌ | ✅ | ❌ | ❌ | Service account for automated Play Store uploads |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH` | ✅ | ❌ | ❌ | ❌ | Local path to service account JSON file |

---

## 🔍 Detailed Explanation

### Why ANDROID_KEYSTORE_PASSWORD vs ANDROID_KEYSTORE_BASE64?

**The Problem:**
- Keystore is a **binary file** (`android/app/release.keystore`)
- GitHub Secrets can only store **text strings**
- Can't upload binary files to GitHub Secrets

**The Solution:**

**Local Development:**
```bash
# You have the actual keystore file
android/app/release.keystore

# .env file contains:
ANDROID_KEYSTORE_PASSWORD=your_password
ANDROID_KEY_ALIAS=madhavai-release-key
ANDROID_KEY_PASSWORD=your_key_password

# Gradle reads the file directly:
storeFile file('release.keystore')
storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
```

**GitHub Actions:**
```bash
# Can't store binary file, so we encode it to text
base64 -i android/app/release.keystore > keystore.txt

# GitHub Secret contains:
ANDROID_KEYSTORE_BASE64=<base64 encoded text>
ANDROID_KEYSTORE_PASSWORD=your_password
ANDROID_KEY_ALIAS=madhavai-release-key
ANDROID_KEY_PASSWORD=your_key_password

# Workflow decodes it back to binary:
echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > release.keystore
```

**Summary:**
- **Local**: Use actual keystore file + password
- **GitHub**: Use base64 encoded keystore + password

---

## 📍 Where Each Secret is Used

### In Code Files

| Secret | File | How It's Used |
|--------|------|---------------|
| `API_BASE_URL` | `src/config/env.ts` | Exported as `config.API_BASE_URL` |
| `OTA_API_BASE_URL` | `src/services/OTAUpdateService.ts` | Used for update checks |
| `OTA_API_BASE_URL` | `src/services/FeatureUpdateScheduler.ts` | Used for feature updates |
| `OTA_API_BASE_URL` | `src/services/ABTestingService.ts` | Used for A/B testing |
| `OTA_API_BASE_URL` | `src/services/VersionCompatibilityService.ts` | Used for version checks |
| `ANDROID_KEYSTORE_PASSWORD` | `android/app/build.gradle` | Used to sign release APK |
| `AWS_*` | `src/config/env.ts` | Exported as `awsConfig` object |
| `LESSONS_TABLE` | `src/api/handlers/trainingHandlers.ts` | DynamoDB table name |
| `PRIMARY_REGION` | `infrastructure/lambda/dr-test/index.js` | Disaster recovery config |
| `SNS_TOPIC_ARN` | `infrastructure/lambda/failover-handler/index.js` | Send alerts |

### In Workflow Files

| Secret | Workflow File | Step | Why |
|--------|---------------|------|-----|
| `ANDROID_KEYSTORE_BASE64` | `.github/workflows/android-build.yml` | Decode keystore | Create keystore file from base64 |
| `ANDROID_KEYSTORE_PASSWORD` | `.github/workflows/android-build.yml` | Build release APK | Sign APK with keystore |
| `ANDROID_KEY_ALIAS` | `.github/workflows/android-build.yml` | Build release APK | Identify key in keystore |
| `ANDROID_KEY_PASSWORD` | `.github/workflows/android-build.yml` | Build release APK | Unlock specific key |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | `.github/workflows/android-build.yml` | Upload to Play Store | Authenticate with Play Store API |
| `SNYK_TOKEN` | `.github/workflows/backend-ci-cd.yml` | Security scan | Authenticate with Snyk API |
| `AWS_ACCESS_KEY_ID` | `.github/workflows/backend-ci-cd.yml` | Deploy backend | Authenticate with AWS |
| `AWS_SECRET_ACCESS_KEY` | `.github/workflows/backend-ci-cd.yml` | Deploy backend | Authenticate with AWS |
| `ALERT_EMAIL` | `.github/workflows/backend-ci-cd.yml` | Terraform deploy | Set up alert notifications |
| `STAGING_API_URL` | `.github/workflows/backend-ci-cd.yml` | E2E tests | Test against staging API |
| `SLACK_WEBHOOK` | `.github/workflows/backend-ci-cd.yml` | Notify deployment | Send Slack notifications |

### In Gradle Build

| Secret | File | Variable Name | Why |
|--------|------|---------------|-----|
| `ANDROID_KEYSTORE_PASSWORD` | `android/app/build.gradle` | `MADHAVAI_UPLOAD_STORE_PASSWORD` | Unlock keystore file |
| `ANDROID_KEY_ALIAS` | `android/app/build.gradle` | `MADHAVAI_UPLOAD_KEY_ALIAS` | Select key from keystore |
| `ANDROID_KEY_PASSWORD` | `android/app/build.gradle` | `MADHAVAI_UPLOAD_KEY_PASSWORD` | Unlock specific key |

---

## 🎯 Quick Reference by Role

### Mobile Developer (Frontend)

**Needs in `.env`:**
- ✅ `API_BASE_URL`
- ✅ `ANDROID_KEYSTORE_PASSWORD`
- ✅ `ANDROID_KEY_ALIAS`
- ✅ `ANDROID_KEY_PASSWORD`
- ✅ `OTA_API_BASE_URL`

**Doesn't need:**
- ❌ Backend secrets
- ❌ CI/CD secrets
- ❌ Infrastructure secrets

### Backend Developer

**Needs in `.env.backend`:**
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`
- ✅ `STAGING_API_URL`
- ✅ `ALERT_EMAIL`
- ✅ All Lambda secrets

**Doesn't need:**
- ❌ Android keystore secrets
- ❌ Mobile app secrets

### DevOps Engineer

**Needs in GitHub Secrets:**
- ✅ All Android build secrets
- ✅ All AWS secrets
- ✅ All CI/CD secrets
- ✅ `SNYK_TOKEN`
- ✅ `SLACK_WEBHOOK`
- ✅ `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

**Needs locally:**
- ✅ Both `.env` and `.env.backend`

---

## 📝 Summary

**Total Secrets: 35+**

- **Mobile App**: 7 secrets
- **Android Build**: 4 secrets (3 passwords + 1 base64 file)
- **AWS Amplify**: 10 secrets (optional)
- **Backend/Infrastructure**: 5 secrets
- **Lambda Functions**: 8 secrets
- **Google Play**: 2 secrets

**Storage Locations:**
- `.env` - 17 secrets (mobile app)
- `.env.backend` - 13 secrets (backend)
- GitHub Secrets - 11 secrets (CI/CD)
- AWS Lambda Environment - 8 secrets (runtime)
- Terraform Variables - 5 secrets (infrastructure)

---

**For setup guides, see:**
- [Mobile Secrets Setup](01-secrets-setup-guide.md)
- [Backend Secrets Setup](05-backend-secrets-guide.md)
- [Complete Variables Reference](03-secret-variables-reference.md)
