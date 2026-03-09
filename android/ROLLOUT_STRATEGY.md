# MadhavAI Staged Rollout Strategy

## Overview

This document outlines the staged rollout strategy for MadhavAI app releases to minimize risk and ensure quality before reaching all users.

## Rollout Stages

### Stage 1: Internal Testing (10%)
- **Duration**: 2-3 days
- **Audience**: Internal team and beta testers
- **Monitoring**: Intensive monitoring of crash rates, ANRs, and user feedback
- **Success Criteria**:
  - Crash rate < 0.1%
  - ANR rate < 0.05%
  - No critical bugs reported
  - Core features working as expected

### Stage 2: Alpha Release (25%)
- **Duration**: 3-4 days
- **Audience**: Expanded to early adopters and power users
- **Monitoring**: Continue monitoring crash rates, performance metrics, and user feedback
- **Success Criteria**:
  - Crash rate remains < 0.1%
  - ANR rate remains < 0.05%
  - Positive user feedback
  - No major performance degradation
  - API error rates < 1%

### Stage 3: Beta Release (50%)
- **Duration**: 4-5 days
- **Audience**: Half of the user base
- **Monitoring**: Full monitoring of all metrics including backend load
- **Success Criteria**:
  - Crash rate < 0.1%
  - ANR rate < 0.05%
  - Backend services handling load well
  - Sync success rate > 99%
  - User retention stable or improving

### Stage 4: Production Release (100%)
- **Duration**: Ongoing
- **Audience**: All users
- **Monitoring**: Continuous monitoring with alerts
- **Success Criteria**:
  - All metrics remain within acceptable ranges
  - No significant increase in support requests
  - User satisfaction maintained

## Rollback Criteria

Immediately rollback to previous version if:
- Crash rate exceeds 1%
- ANR rate exceeds 0.5%
- Critical security vulnerability discovered
- Data loss or corruption reported
- Backend services overwhelmed
- Sync failure rate exceeds 5%

## Rollout Commands

### Using Google Play Console
1. Navigate to Release > Production
2. Create new release with AAB file
3. Set rollout percentage to 10%
4. Monitor for 2-3 days
5. Increase to 25%, 50%, then 100% based on success criteria

### Using GitHub Actions
```bash
# Trigger workflow with specific release type
gh workflow run android-build.yml \
  -f release_type=internal  # or alpha, beta, production
```

### Manual Rollout Percentage Update
```bash
# Using Google Play Developer API
curl -X PUT \
  "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.madhavai/edits/{editId}/tracks/production" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "releases": [{
      "versionCodes": ["1"],
      "status": "inProgress",
      "userFraction": 0.25
    }]
  }'
```

## Monitoring Checklist

### Pre-Rollout
- [ ] All tests passing
- [ ] Code review completed
- [ ] Release notes prepared
- [ ] Rollback plan documented
- [ ] Monitoring dashboards ready
- [ ] On-call team notified

### During Rollout
- [ ] Monitor crash rates every 4 hours
- [ ] Check ANR rates daily
- [ ] Review user feedback and ratings
- [ ] Monitor backend API performance
- [ ] Check sync success rates
- [ ] Review error logs for patterns

### Post-Rollout
- [ ] Verify all metrics stable
- [ ] Document any issues encountered
- [ ] Update rollout strategy if needed
- [ ] Celebrate successful release! 🎉

## Emergency Contacts

- **Release Manager**: [Contact Info]
- **Backend Team Lead**: [Contact Info]
- **On-Call Engineer**: [Contact Info]
- **Product Manager**: [Contact Info]

## Metrics Dashboard

Monitor these dashboards during rollout:
- Firebase Crashlytics: Crash and ANR rates
- Google Play Console: User ratings and reviews
- AWS CloudWatch: Backend API performance
- Custom Analytics: Sync success rates, feature usage

## Release Notes Template

```
Version X.Y.Z

New Features:
- [Feature 1]
- [Feature 2]

Improvements:
- [Improvement 1]
- [Improvement 2]

Bug Fixes:
- [Bug fix 1]
- [Bug fix 2]

Known Issues:
- [Issue 1 with workaround]
```

## A/B Testing Integration

For features requiring A/B testing:
1. Configure feature flags in backend
2. Deploy backend changes first
3. Deploy app with feature flag checks
4. Enable feature for test group (10-20%)
5. Monitor metrics for 7-14 days
6. Roll out to all users if successful

## Backward Compatibility

Maintain backward compatibility for 2 previous versions:
- Current version: 1.0.0
- Support: 0.9.x and 0.8.x
- API versioning: Use version headers
- Graceful degradation for old clients
