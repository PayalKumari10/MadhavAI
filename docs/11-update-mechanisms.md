# MadhavAI Update Mechanisms

## Overview

MadhavAI implements a comprehensive update system that includes:
1. **OTA Content Updates**: Update content without app store approval
2. **Critical Security Updates**: Push urgent security fixes immediately
3. **Monthly Feature Updates**: Scheduled feature rollouts
4. **Backward Compatibility**: Support for 2 previous versions

## Update Types

### 1. OTA Content Updates

**Purpose**: Update training content, schemes, market data without app store approval

**Frequency**: As needed (typically weekly)

**Process**:
1. Content team publishes new content to CMS
2. Backend generates OTA update package
3. App checks for updates every 24 hours
4. Updates download in background when on WiFi
5. Content becomes available immediately after installation

**Supported Content**:
- Training lessons and videos
- Government scheme information
- Market price data
- Configuration changes
- UI translations

**Implementation**:
```typescript
import OTAUpdateService from './services/OTAUpdateService';

// Check for updates
const updates = await OTAUpdateService.checkForUpdates();

// Install updates
await OTAUpdateService.installPendingUpdates();
```

### 2. Critical Security Updates

**Purpose**: Push urgent security fixes that cannot wait for app store approval

**Frequency**: As needed (rare)

**Process**:
1. Security team identifies critical vulnerability
2. Fix is packaged as OTA update with "critical" priority
3. App checks for updates on next launch
4. Update is forced before user can proceed
5. User cannot skip or delay critical updates

**Characteristics**:
- Mandatory installation
- Blocking UI until installed
- Highest priority
- Immediate rollout (100%)

**Implementation**:
```typescript
// Check for critical updates on app launch
const hasCritical = await OTAUpdateService.hasCriticalUpdates();

if (hasCritical) {
  // Force installation
  await OTAUpdateService.forceCriticalUpdates();
}
```

### 3. Monthly Feature Updates

**Purpose**: Roll out new features on a predictable schedule

**Frequency**: Monthly (first Monday of each month)

**Process**:
1. Features are developed and tested
2. Release is scheduled for specific date
3. Staged rollout: 10% → 25% → 50% → 100% over 2 weeks
4. Users receive features based on rollout percentage
5. Monitoring continues throughout rollout

**Rollout Schedule**:
- **Week 1**: 10% of users (internal + beta testers)
- **Week 2**: 25% of users (early adopters)
- **Week 3**: 50% of users (general rollout)
- **Week 4**: 100% of users (complete rollout)

**Implementation**:
```typescript
import FeatureUpdateScheduler from './services/FeatureUpdateScheduler';

// Check if feature is enabled for user
const isEnabled = await FeatureUpdateScheduler.isFeatureEnabled('new_feature_id');

if (isEnabled) {
  // Show new feature
}
```

### 4. App Store Updates

**Purpose**: Major version updates with significant changes

**Frequency**: Quarterly (every 3 months)

**Process**:
1. Major features and improvements bundled
2. Submitted to Google Play Store
3. Staged rollout via Play Console
4. Users update through Play Store

**When Required**:
- Native code changes
- New permissions required
- Major UI overhaul
- Breaking API changes
- New third-party SDKs

## Backward Compatibility

### Version Support Policy

**Current Version**: 1.0.0
**Supported Versions**: 1.0.0, 0.9.x, 0.8.x
**Minimum Version**: 0.8.0

### Compatibility Checks

```typescript
import VersionCompatibilityService from './services/VersionCompatibilityService';

// Check if current version is compatible
const isCompatible = await VersionCompatibilityService.checkCompatibility();

if (!isCompatible) {
  // Show update required message
}

// Check if feature is supported
const isSupported = VersionCompatibilityService.isFeatureSupported('soil_health');

if (!isSupported) {
  // Show fallback UI or disable feature
}
```

### API Versioning

**Current API Version**: v1
**Supported API Versions**: v1

**Version Mapping**:
- App v1.0.0 → API v1
- App v1.1.0 → API v1
- App v1.2.0 → API v2 (future)

**Endpoint Format**:
```
https://api.madhavai.app/v1/recommendations
https://api.madhavai.app/v1/schemes
https://api.madhavai.app/v1/weather
```

### Data Migration

When updating between versions, data is automatically migrated:

```typescript
// Migrate from v1.0.0 to v1.1.0
await VersionCompatibilityService.migrateData('1.0.0', '1.1.0');
```

**Migration Examples**:
- v1.0.0 → v1.1.0: Add soil health data structure
- v1.1.0 → v1.2.0: Add pest detection data structure
- v1.2.0 → v2.0.0: Restructure recommendation format

## Update Flow Diagrams

### OTA Content Update Flow

```
┌─────────────────┐
│  App Launch     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check for       │
│ Updates (24h)   │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │Updates?│
    └───┬────┘
        │
    Yes │ No
        │  └──────────────┐
        ▼                 │
┌─────────────────┐       │
│ Download in     │       │
│ Background      │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Verify Checksum │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Install Update  │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Content Ready   │◄──────┘
└─────────────────┘
```

### Critical Security Update Flow

```
┌─────────────────┐
│  App Launch     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Critical  │
│ Updates         │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │Critical?│
    └───┬────┘
        │
    Yes │ No
        │  └──────────────┐
        ▼                 │
┌─────────────────┐       │
│ Show Blocking   │       │
│ Update UI       │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Force Install   │       │
│ (No Skip)       │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Restart App     │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Continue Normal │◄──────┘
└─────────────────┘
```

### Monthly Feature Update Flow

```
┌─────────────────┐
│ Release Date    │
│ Reached         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check User in   │
│ Rollout Group   │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │In Group?│
    └───┬────┘
        │
    Yes │ No
        │  └──────────────┐
        ▼                 │
┌─────────────────┐       │
│ Enable Features │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Show What's New │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Features Active │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Monitor Metrics │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ Wait for Next   │◄──────┘
│ Rollout Stage   │
└─────────────────┘
```

## Monitoring and Metrics

### Update Success Metrics

**OTA Updates**:
- Download success rate: Target > 95%
- Installation success rate: Target > 98%
- Average download time: Target < 30 seconds
- Update check frequency: Every 24 hours

**Critical Updates**:
- Installation success rate: Target 100%
- Time to install: Target < 2 minutes
- Rollback rate: Target < 0.1%

**Feature Updates**:
- Rollout completion time: Target 2 weeks
- Feature adoption rate: Target > 70%
- Crash rate during rollout: Target < 0.1%
- User satisfaction: Target > 4.0/5.0

### Monitoring Dashboard

Monitor these metrics in real-time:
- Update download rate
- Installation success/failure rate
- Update-related crashes
- User feedback on new features
- API error rates after updates
- Rollback requests

### Alerts

Set up alerts for:
- Update installation failure rate > 5%
- Critical update installation failure
- Crash rate increase > 50% after update
- API error rate > 2% after update
- Negative user feedback spike

## Rollback Procedures

### OTA Update Rollback

If issues are detected after OTA update:

1. **Immediate Actions**:
   - Pause update distribution
   - Investigate issue
   - Prepare rollback package

2. **Rollback Process**:
   ```typescript
   // Server-side: Mark update as rolled back
   PUT /api/ota/updates/{updateId}/rollback
   
   // Client-side: Revert to previous version
   await OTAUpdateService.rollbackUpdate(updateId);
   ```

3. **Communication**:
   - Notify affected users
   - Provide workaround if available
   - Estimate fix timeline

### Feature Update Rollback

If feature causes issues:

1. **Pause Rollout**:
   - Stop increasing rollout percentage
   - Keep current users on feature

2. **Disable Feature**:
   ```typescript
   // Server-side: Disable feature flag
   PUT /api/features/{featureId}/disable
   
   // Client-side: Feature automatically disabled on next check
   ```

3. **Fix and Re-release**:
   - Fix issue
   - Test thoroughly
   - Resume rollout

## Best Practices

### For Developers

1. **Test Updates Thoroughly**:
   - Test on multiple devices and Android versions
   - Test with poor network conditions
   - Test rollback procedures

2. **Version Updates Carefully**:
   - Use semantic versioning
   - Document breaking changes
   - Maintain backward compatibility

3. **Monitor After Release**:
   - Watch crash rates
   - Monitor user feedback
   - Check API error rates

4. **Communicate Changes**:
   - Write clear release notes
   - Highlight breaking changes
   - Provide migration guides

### For Users

1. **Keep App Updated**:
   - Enable automatic updates
   - Update when prompted
   - Check for updates regularly

2. **Report Issues**:
   - Use in-app feedback
   - Provide detailed descriptions
   - Include screenshots if possible

3. **Backup Data**:
   - App automatically backs up data
   - Export important data periodically

## Troubleshooting

### Update Failed to Download

**Symptoms**: Update download fails or times out

**Solutions**:
1. Check internet connection
2. Switch to WiFi if on mobile data
3. Clear app cache
4. Retry update

### Update Failed to Install

**Symptoms**: Update downloads but fails to install

**Solutions**:
1. Restart app
2. Clear app cache
3. Check available storage
4. Reinstall app if persistent

### Features Not Appearing

**Symptoms**: New features not visible after update

**Solutions**:
1. Check if in rollout group (may not be available yet)
2. Force update check
3. Restart app
4. Check app version

### App Crashes After Update

**Symptoms**: App crashes or freezes after update

**Solutions**:
1. Restart device
2. Clear app cache
3. Reinstall app
4. Report issue to support

## Future Enhancements

### Planned Improvements

1. **Delta Updates**: Download only changed files, not full packages
2. **Peer-to-Peer Updates**: Share updates between nearby devices
3. **Offline Update Packages**: Pre-download updates for offline installation
4. **Smart Scheduling**: Update during low-usage hours
5. **Bandwidth Optimization**: Compress updates more efficiently

### Timeline

- **Q2 2024**: Delta updates
- **Q3 2024**: Peer-to-peer updates
- **Q4 2024**: Offline update packages
- **Q1 2025**: Smart scheduling and bandwidth optimization

## Support

For update-related issues:
- **Email**: support@madhavai.app
- **Phone**: 1800-XXX-XXXX (Toll-free)
- **WhatsApp**: +91-XXXXX-XXXXX
- **In-App**: Settings > Help & Support
