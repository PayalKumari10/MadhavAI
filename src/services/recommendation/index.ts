/**
 * Recommendation Service Exports
 */

export { DataAggregator, dataAggregator } from './DataAggregator';
export { FarmingContextBuilder, farmingContextBuilder } from './FarmingContextBuilder';
export { CropRecommender, cropRecommender } from './CropRecommender';
export { FertilizerRecommender, fertilizerRecommender } from './FertilizerRecommender';
export { SeedRecommender } from './SeedRecommender';
export { ExplainabilityEngine, explainabilityEngine } from './ExplainabilityEngine';
export { FeedbackCollector, feedbackCollector } from './FeedbackCollector';
export { FeedbackAnalyzer, feedbackAnalyzer } from './FeedbackAnalyzer';
export { RecommendationImprover, recommendationImprover } from './RecommendationImprover';

export type { EnhancedFarmingContext } from './FarmingContextBuilder';
export type { GrowthStage } from './FertilizerRecommender';
export type { RecommendationType, ExplanationInput } from './ExplainabilityEngine';
export type { FeedbackData, FeedbackAction } from './FeedbackCollector';
export type { FeedbackAnalysis, RecommendationPerformance } from './FeedbackAnalyzer';
export type { AdjustmentRule, ImprovementSuggestion } from './RecommendationImprover';
