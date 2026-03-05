# Feedback Integration and Recommendation Improvement System

## Overview

The feedback integration system enables the platform to learn from user interactions with recommendations and continuously improve future recommendations. This implements **Requirement 16.6**: "The Recommendation_Engine SHALL learn from user feedback to improve future recommendations."

## Architecture

The system consists of three main components:

### 1. FeedbackCollector

Captures user feedback on recommendations in three categories:

- **Accepted**: User accepts and implements the recommendation as-is
- **Rejected**: User rejects the recommendation with an optional reason
- **Modified**: User accepts but modifies certain aspects (e.g., adjusts dosage, timing)

**Key Features:**
- Unique feedback ID generation
- Timestamp tracking
- Context snapshot (season, soil type, location)
- Query methods (by user, type, date range)
- Statistics calculation (acceptance rate, etc.)

### 2. FeedbackAnalyzer

Analyzes patterns in collected feedback to identify trends and insights:

- **By Type**: Analyze feedback for specific recommendation types (crop, fertilizer, seed)
- **By Context**: Analyze feedback for specific contexts (season, soil type, location)
- **Common Modifications**: Identify which fields users modify most frequently
- **Rejection Reasons**: Track common reasons for rejection
- **Performance Metrics**: Calculate performance scores for individual recommendations
- **Trend Analysis**: Identify improving/declining/stable trends over time

**Key Metrics:**
- Acceptance rate
- Rejection rate
- Modification rate
- Performance score (accepted = 100 pts, modified = 70 pts, rejected = 0 pts)

### 3. RecommendationImprover

Uses feedback analysis to generate adjustment rules and improve future recommendations:

- **Learning**: Generates adjustment rules from feedback patterns
- **Application**: Applies learned adjustments to new recommendations
- **Suggestions**: Provides improvement suggestions for recommendation algorithms
- **Context-Aware**: Rules are specific to contexts (season, soil type, location)

**Adjustment Strategy:**
- Minimum 5 feedback items required to generate a rule
- Minimum 3 modifications of same field required
- Confidence score based on feedback count
- Weighted adjustment: 70% current value + 30% learned value
- Rules with confidence < 30% are filtered out
- Maximum 50 rules maintained (top by confidence)

## Usage Examples

### Collecting Feedback

```typescript
import { feedbackCollector } from './services/recommendation';

// User accepts recommendation
await feedbackCollector.collectAcceptedFeedback(
  userId,
  'fertilizer',
  recommendationId,
  recommendationData,
  { season: 'kharif', soilType: 'loamy', location: 'Punjab' }
);

// User rejects recommendation
await feedbackCollector.collectRejectedFeedback(
  userId,
  'crop',
  recommendationId,
  recommendationData,
  'Too expensive',
  { season: 'rabi', location: 'Haryana' }
);

// User modifies recommendation
await feedbackCollector.collectModifiedFeedback(
  userId,
  'fertilizer',
  recommendationId,
  recommendationData,
  { dosage: 85 }, // User changed dosage from 100 to 85
  { season: 'kharif', soilType: 'loamy', location: 'Punjab' }
);
```

### Analyzing Feedback

```typescript
import { feedbackAnalyzer, feedbackCollector } from './services/recommendation';

// Get all feedback
const allFeedback = await feedbackCollector.getAllFeedback();

// Analyze by type
const cropAnalysis = await feedbackAnalyzer.analyzeByType(allFeedback, 'crop');
console.log(`Acceptance rate: ${cropAnalysis.acceptanceRate}%`);
console.log(`Common modifications:`, cropAnalysis.commonModifications);
console.log(`Insights:`, cropAnalysis.insights);

// Analyze by context
const kharifAnalysis = await feedbackAnalyzer.analyzeByContext(allFeedback, {
  season: 'kharif',
  soilType: 'loamy',
});

// Calculate performance for specific recommendation
const performance = await feedbackAnalyzer.calculateRecommendationPerformance(
  allFeedback,
  'rec-123'
);
console.log(`Performance score: ${performance.performanceScore}`);

// Identify trends
const trends = await feedbackAnalyzer.identifyTrends(allFeedback, 30);
console.log(`Trend: ${trends.acceptanceRateTrend}`);
```

### Improving Recommendations

```typescript
import {
  recommendationImprover,
  feedbackCollector,
  farmingContextBuilder,
} from './services/recommendation';

// Get feedback
const allFeedback = await feedbackCollector.getAllFeedback();

// Learn from feedback
const rules = await recommendationImprover.learnFromFeedback(allFeedback);
console.log(`Generated ${rules.length} adjustment rules`);

// Apply improvements to new recommendation
const context = await farmingContextBuilder.buildContext(userProfile);
const recommendation = {
  name: 'Urea',
  dosage: 100,
  timing: 'Standard',
};

const improved = await recommendationImprover.applyAdjustments(
  recommendation,
  'fertilizer',
  context
);
console.log(`Adjusted dosage: ${improved.dosage}`);

// Get improvement suggestions
const suggestions = await recommendationImprover.getImprovementSuggestions(allFeedback);
suggestions.forEach((s) => {
  console.log(`[${s.priority}] ${s.issue}: ${s.suggestion}`);
});
```

## Integration with Recommenders

The feedback system integrates with existing recommenders (CropRecommender, FertilizerRecommender, SeedRecommender):

```typescript
import {
  cropRecommender,
  recommendationImprover,
  farmingContextBuilder,
} from './services/recommendation';

// Generate recommendations
const context = await farmingContextBuilder.buildContext(userProfile);
const recommendations = await cropRecommender.generateRecommendations(context);

// Apply learned improvements
const improvedRecommendations = await Promise.all(
  recommendations.map((rec) =>
    recommendationImprover.applyAdjustments(rec, 'crop', context)
  )
);
```

## Data Storage

Currently, feedback is stored in-memory. For production, integrate with:

- **Local Storage**: SQLite for offline feedback collection
- **Cloud Storage**: DynamoDB for centralized feedback analysis
- **Sync Service**: Synchronize local feedback to cloud when online

### Recommended Schema

```typescript
// DynamoDB Table: Feedback
{
  id: string (PK)
  userId: string (GSI)
  recommendationType: string (GSI)
  recommendationId: string
  action: 'accepted' | 'rejected' | 'modified'
  modifications?: object
  reason?: string
  timestamp: number (GSI)
  contextSnapshot: {
    season: string
    soilType?: string
    location: string
  }
}

// DynamoDB Table: AdjustmentRules
{
  id: string (PK)
  recommendationType: string (GSI)
  context: object
  field: string
  adjustment: number | string
  confidence: number
  basedOnFeedbackCount: number
  createdAt: number
}
```

## Performance Considerations

- **Batch Processing**: Analyze feedback in batches (e.g., daily) rather than real-time
- **Caching**: Cache adjustment rules to avoid recalculation
- **Async Learning**: Run learning algorithms asynchronously
- **Rule Limits**: Maintain maximum 50 rules to prevent memory issues
- **Confidence Threshold**: Only apply rules with confidence ≥ 30%

## Testing

Comprehensive test coverage includes:

- **Unit Tests**: 36 tests across all three components
- **Integration Tests**: End-to-end workflow testing
- **Property Tests**: Validates Requirement 16.6 (feedback integration)

Run tests:
```bash
npm test -- src/services/recommendation/__tests__/Feedback
```

## Future Enhancements

1. **Machine Learning**: Replace rule-based learning with ML models
2. **A/B Testing**: Test different adjustment strategies
3. **User Segmentation**: Learn different patterns for different user segments
4. **Collaborative Filtering**: Use feedback from similar users
5. **Explainability**: Explain why adjustments were made
6. **Real-time Updates**: Update rules in real-time as feedback arrives
7. **Feedback Quality**: Weight feedback by user expertise/history

## Monitoring

Track these metrics in production:

- Feedback collection rate (% of recommendations with feedback)
- Acceptance rate by recommendation type
- Modification frequency by field
- Rule generation rate
- Adjustment application rate
- Performance score trends
- User satisfaction correlation

## References

- **Requirement 16.6**: AI Recommendation Engine - Feedback Integration
- **Design Document**: Section on Recommendation Engine
- **Property 59**: Feedback Integration Property Test
