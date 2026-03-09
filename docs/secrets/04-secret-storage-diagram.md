# Secret Storage Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECRET STORAGE LOCATIONS                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│   LOCAL DEVELOPMENT  │     │   ANDROID KEYSTORE   │     │   GITHUB SECRETS     │
│                      │     │                      │     │                      │
│   📄 .env            │     │   🔐 release.keystore│     │   ☁️  Repository     │
│   (mobile app)       │     │   (android/app/)     │     │   Settings           │
│                      │     │                      │     │                      │
│   ✓ API keys         │     │   ✓ Signing key      │     │   ✓ CI/CD secrets    │
│   ✓ Passwords        │     │   ✓ Certificate      │     │   ✓ Keystore base64  │
│   ✓ Mobile config    │     │                      │     │   ✓ Build passwords  │
│                      │     │                      │     │                      │
│   🚫 GITIGNORED      │     │   🚫 GITIGNORED      │     │   🔒 ENCRYPTED       │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│   LOCAL BACKEND      │     │   AWS LAMBDA ENV     │     │   TERRAFORM VARS     │
│                      │     │                      │     │                      │
│   📄 .env.backend    │     │   ☁️  Lambda Console │     │   🏗️  Infrastructure │
│   (backend/infra)    │     │   Environment Vars   │     │   Variables          │
│                      │     │                      │     │                      │
│   ✓ AWS credentials  │     │   ✓ Runtime config   │     │   ✓ Deploy config    │
│   ✓ CI/CD tokens     │     │   ✓ DB tables        │     │   ✓ Alert emails     │
│   ✓ Alert config     │     │   ✓ SNS topics       │     │   ✓ Region config    │
│                      │     │                      │     │                      │
│   🚫 GITIGNORED      │     │   🔒 IAM PROTECTED   │     │   🔒 STATE ENCRYPTED │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
         │                            │                             │
         │                            │                             │
         ▼                            ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOW SECRETS ARE ACCESSED                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│   REACT NATIVE APP   │     │   ANDROID BUILD      │     │   GITHUB ACTIONS     │
│                      │     │                      │     │                      │
│   react-native-config│────▶│   gradle.properties  │────▶│   workflow.yml       │
│   reads .env         │     │   reads env vars     │     │   uses secrets       │
│                      │     │                      │     │                      │
│   src/config/env.ts  │     │   build.gradle       │     │   android-build.yml  │
│   exports config     │     │   signingConfigs     │     │   env: ${{ secrets }}│
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│   LAMBDA FUNCTIONS   │     │   TERRAFORM          │     │   AWS SERVICES       │
│                      │     │                      │     │                      │
│   process.env.VAR    │────▶│   var.variable       │────▶│   IAM Roles          │
│   reads Lambda env   │     │   reads tfvars       │     │   uses roles         │
│                      │     │                      │     │                      │
│   dr-test/index.js   │     │   main.tf            │     │   DynamoDB, S3, SNS  │
│   failover/index.js  │     │   variables.tf       │     │   CloudWatch         │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

## Data Flow

### Local Development Build (Mobile)

```
.env file (mobile)
   │
   ├─▶ react-native-config (reads at build time)
   │
   ├─▶ src/config/env.ts (exports typed config)
   │
   ├─▶ Services use config
   │   ├─▶ OTAUpdateService.ts
   │   ├─▶ FeatureUpdateScheduler.ts
   │   ├─▶ ABTestingService.ts
   │   └─▶ VersionCompatibilityService.ts
   │
   └─▶ Android build.gradle (via System.getenv())
       └─▶ Signs APK with keystore
```

### Local Backend Development

```
.env.backend file
   │
   ├─▶ Loaded via source or direnv
   │
   ├─▶ AWS CLI uses credentials
   │   └─▶ Deploys Lambda functions
   │
   ├─▶ Terraform reads variables
   │   └─▶ Provisions infrastructure
   │
   └─▶ Lambda functions (local testing)
       └─▶ process.env.VARIABLE
```

### GitHub Actions Build (Mobile)

```
GitHub Secrets
   │
   ├─▶ Workflow sets environment variables
   │
   ├─▶ Decodes ANDROID_KEYSTORE_BASE64
   │   └─▶ Creates release.keystore file
   │
   └─▶ Gradle reads env vars
       └─▶ Signs APK with keystore
```

### GitHub Actions Build (Backend)

```
GitHub Secrets
   │
   ├─▶ Workflow sets AWS credentials
   │
   ├─▶ Runs Snyk security scan
   │   └─▶ Uses SNYK_TOKEN
   │
   ├─▶ Terraform deployment
   │   ├─▶ Uses AWS credentials
   │   └─▶ Sets ALERT_EMAIL variable
   │
   └─▶ Sends Slack notification
       └─▶ Uses SLACK_WEBHOOK
```

### AWS Lambda Runtime

```
Lambda Environment Variables
   │
   ├─▶ Set via Terraform or Console
   │
   ├─▶ Lambda function reads process.env
   │   ├─▶ PRIMARY_REGION
   │   ├─▶ BACKUP_REGION
   │   ├─▶ SNS_TOPIC_ARN
   │   └─▶ LESSONS_TABLE
   │
   └─▶ Uses IAM role for AWS access
       └─▶ No access keys needed
```

## File Structure

```
project-root/
│
├── .env                          # ← MOBILE APP SECRETS (gitignored)
├── .env.example                  # ← Mobile template (committed)
├── .env.backend                  # ← BACKEND SECRETS (gitignored)
├── .env.backend.example          # ← Backend template (committed)
│
├── src/
│   ├── config/
│   │   └── env.ts               # ← Reads .env, exports config
│   │
│   └── services/
│       ├── OTAUpdateService.ts  # ← Uses config.OTA_API_BASE_URL
│       ├── FeatureUpdateScheduler.ts
│       ├── ABTestingService.ts
│       └── VersionCompatibilityService.ts
│
├── android/
│   ├── app/
│   │   ├── release.keystore     # ← YOUR KEYSTORE (gitignored)
│   │   └── build.gradle         # ← Reads env vars for signing
│   │
│   ├── gradle.properties        # ← Build configuration
│   └── generate-keystore.sh     # ← Script to create keystore
│
├── infrastructure/
│   ├── lambda/
│   │   ├── dr-test/
│   │   │   └── index.js         # ← Uses process.env.PRIMARY_REGION
│   │   └── failover-handler/
│   │       └── index.js         # ← Uses process.env.SNS_TOPIC_ARN
│   │
│   └── terraform/
│       ├── main.tf              # ← Uses var.alert_email
│       ├── variables.tf         # ← Defines variables
│       └── terraform.tfvars     # ← Variable values (gitignored)
│
├── .github/
│   └── workflows/
│       ├── android-build.yml    # ← Uses GitHub Secrets (mobile)
│       ├── backend-ci-cd.yml    # ← Uses GitHub Secrets (backend)
│       └── mobile-ci-cd.yml     # ← No secrets (tests only)
│
└── docs/
    └── secrets/
        ├── 01-secrets-setup-guide.md
        ├── 02-env-setup.md
        ├── 03-secret-variables-reference.md
        ├── 04-secret-storage-diagram.md      # ← This file
        ├── 05-backend-secrets-guide.md
        └── 06-complete-secrets-matrix.md
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: .gitignore
   ├─▶ .env
   ├─▶ .env.local
   ├─▶ .env.backend
   ├─▶ .env.backend.local
   ├─▶ android/app/release.keystore
   └─▶ infrastructure/terraform/terraform.tfvars
   
   ✓ Prevents accidental commits
   ✓ Files never reach version control

Layer 2: Local File System
   ├─▶ .env (readable only by you)
   ├─▶ .env.backend (readable only by you)
   └─▶ release.keystore (readable only by you)
   
   ✓ Protected by OS file permissions
   ✓ Only accessible on your machine

Layer 3: GitHub Secrets
   ├─▶ Encrypted at rest
   ├─▶ Encrypted in transit
   └─▶ Only accessible to workflows
   
   ✓ AES-256 encryption
   ✓ Only admins can view/edit
   ✓ Masked in logs

Layer 4: AWS IAM & Secrets Manager
   ├─▶ Lambda uses IAM roles (no keys)
   ├─▶ Secrets Manager for sensitive data
   └─▶ KMS encryption for data at rest
   
   ✓ No hardcoded credentials
   ✓ Automatic rotation
   ✓ Audit logging

Layer 5: Build-time Injection
   ├─▶ react-native-config injects at build
   └─▶ Not stored in JavaScript bundle
   
   ✓ Values compiled into native code
   ✓ Not easily extractable from APK
```

## Quick Reference

### Where to Store What

| Secret Type | Local Storage | GitHub Storage | AWS Storage | Notes |
|-------------|---------------|----------------|-------------|-------|
| Mobile API Keys | `.env` | GitHub Secrets | - | For mobile app |
| Android Keystore | `release.keystore` file | GitHub Secrets (base64) | - | Binary file |
| Keystore Passwords | `.env` | GitHub Secrets | - | For signing APK |
| AWS Credentials | `.env.backend` | GitHub Secrets | IAM Roles | For deployment |
| Backend API URLs | `.env.backend` | GitHub Secrets | - | For testing |
| CI/CD Tokens | `.env.backend` | GitHub Secrets | - | Snyk, Slack |
| Lambda Config | `.env.backend` | - | Lambda Env Vars | Runtime config |
| Database Names | `.env.backend` | - | Lambda Env Vars | DynamoDB tables |
| Infrastructure | `.env.backend` | - | Terraform State | Alert emails, regions |

### What NOT to Store

❌ **Never store in code:**
- Passwords
- API keys
- Private keys
- Certificates
- OAuth secrets
- Database credentials

✅ **Store in code (safe):**
- Public API endpoints (if truly public)
- Feature flags (non-sensitive)
- Default configuration values
- Public constants

## Common Patterns

### Pattern 1: Environment-Specific Values (Mobile)

```typescript
// src/config/env.ts
const configs = {
  development: {
    API_BASE_URL: getEnvVar('API_BASE_URL', 'http://localhost:3000/api'),
    OTA_API_BASE_URL: getEnvVar('OTA_API_BASE_URL', 'https://api.madhavai.app'),
  },
  production: {
    API_BASE_URL: getEnvVar('API_BASE_URL', 'https://api.madhavai.com/api'),
    OTA_API_BASE_URL: getEnvVar('OTA_API_BASE_URL', 'https://api.madhavai.app'),
  },
};
```

### Pattern 2: Backend Environment Variables

```javascript
// infrastructure/lambda/dr-test/index.js
const PRIMARY_REGION = process.env.PRIMARY_REGION;
const BACKUP_REGION = process.env.BACKUP_REGION;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
```

### Pattern 3: Terraform Variables

```hcl
# infrastructure/terraform/variables.tf
variable "alert_email" {
  description = "Email for infrastructure alerts"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# infrastructure/terraform/main.tf
resource "aws_sns_topic_subscription" "alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
```

### Pattern 4: Fallback Values

```typescript
// Always provide fallback for non-critical values
const API_TIMEOUT = getEnvNumber('API_TIMEOUT', 30000);

// No fallback for critical secrets (will fail if missing)
const API_KEY = Config.API_KEY; // undefined if not set
```

### Pattern 5: Type-Safe Access

```typescript
// Export typed config object
export const config: EnvConfig = configs[ENV];

// Services use typed config
class MyService {
  private readonly apiUrl = config.API_BASE_URL; // Type-safe!
}
```

### Pattern 6: GitHub Actions Secret Usage

```yaml
# .github/workflows/android-build.yml
- name: Build release APK
  env:
    MADHAVAI_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    MADHAVAI_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
    MADHAVAI_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    cd android
    ./gradlew assembleRelease
```

### Pattern 7: Lambda Environment Variables

```yaml
# infrastructure/terraform/lambda.tf
resource "aws_lambda_function" "dr_test" {
  function_name = "madhavai-dr-test"
  
  environment {
    variables = {
      PRIMARY_REGION = var.primary_region
      BACKUP_REGION  = var.backup_region
      SNS_TOPIC_ARN  = aws_sns_topic.alerts.arn
      ENVIRONMENT    = var.environment
    }
  }
}
```

## Troubleshooting Flow

```
Problem: Variables not loading
   │
   ├─▶ Check: Does .env file exist?
   │   ├─▶ No: Copy from .env.example
   │   └─▶ Yes: Continue
   │
   ├─▶ Check: Is react-native-config installed?
   │   ├─▶ No: npm install react-native-config
   │   └─▶ Yes: Continue
   │
   ├─▶ Check: Did you restart Metro?
   │   ├─▶ No: npm start -- --reset-cache
   │   └─▶ Yes: Continue
   │
   └─▶ Check: Did you rebuild Android?
       ├─▶ No: cd android && ./gradlew clean
       └─▶ Yes: Check variable names match exactly
```

## Best Practices Checklist

### Mobile App
- [ ] `.env` file is in `.gitignore`
- [ ] `.env.example` is committed with placeholder values
- [ ] Keystore file is in `.gitignore`
- [ ] Keystore backup stored securely offline
- [ ] GitHub Secrets configured for CI/CD
- [ ] Different keys used for dev/staging/prod
- [ ] Secrets rotated regularly (every 90 days)

### Backend/Infrastructure
- [ ] `.env.backend` file is in `.gitignore`
- [ ] `.env.backend.example` is committed
- [ ] AWS credentials use IAM roles where possible
- [ ] Terraform state is encrypted and remote
- [ ] Lambda functions use environment variables
- [ ] No hardcoded secrets in code
- [ ] Secrets Manager used for sensitive data

### CI/CD
- [ ] All required GitHub Secrets added
- [ ] Secret names match exactly (case-sensitive)
- [ ] Secrets are masked in workflow logs
- [ ] Only necessary workflows have access to secrets
- [ ] Secrets are rotated after team member leaves

### General
- [ ] Team members have access only to needed secrets
- [ ] Documentation updated when adding new variables
- [ ] Tests use mock values, not real secrets
- [ ] Security audit performed quarterly
