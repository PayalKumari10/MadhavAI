/**
 * Feedback Analyzer Service
 * Analyzes patterns in user feedback to identify trends and insights
 * Requirements: 16.6
 */

import { FeedbackData, RecommendationType } from './FeedbackCollector';

/**
 * Analysis result for a specific context
 */
export interface FeedbackAnalysis {
  recommendationType: RecommendationType;
  context: {
    season?: string;
    soilType?: string;
    location?: string;
  };
  totalFeedback: number;
  acceptanceRate: number;
  rejectionRate: number;
  modificationRate: number;
  commonModifications: Array<{
    field: string;
    frequency: number;
    averageChange?: number;
  }>;
  commonRejectionReasons: Array<{
    reason: string;
    frequency: number;
  }>;
  insights: string[];
}

/**
 * Recommendation performance metrics
 */
export interface RecommendationPerformance {
  recommendationId: string;
  recommendationType: RecommendationType;
  acceptanceCount: number;
  rejectionCount: number;
  modificationCount: number;
  totalFeedback: number;
  performanceScore: number; // 0-100
}

/**
 * Feedback analyzer for identifying patterns and trends
 */
export class FeedbackAnalyzer {
  /**
   * Analyze feedback for a specific recommendation type
   */
  async analyzeByType(
    feedbackData: FeedbackData[],
    type: RecommendationType
  ): Promise<FeedbackAnalysis> {
    const typeFeedback = feedbackData.filter((f) => f.recommendationType === type);

    if (typeFeedback.length === 0) {
      return this.createEmptyAnalysis(type);
    }

    const total = typeFeedback.length;
    const accepted = typeFeedback.filter((f) => f.action === 'accepted').length;
    const rejected = typeFeedback.filter((f) => f.action === 'rejected').length;
    const modified = typeFeedback.filter((f) => f.action === 'modified').length;

    const commonModifications = this.analyzeModifications(typeFeedback);
    const commonRejectionReasons = this.analyzeRejectionReasons(typeFeedback);
    const insights = this.generateInsights(
      type,
      accepted / total,
      rejected / total,
      modified / total,
      commonModifications,
      commonRejectionReasons
    );

    return {
      recommendationType: type,
      context: {},
      totalFeedback: total,
      acceptanceRate: (accepted / total) * 100,
      rejectionRate: (rejected / total) * 100,
      modificationRate: (modified / total) * 100,
      commonModifications,
      commonRejectionReasons,
      insights,
    };
  }

  /**
   * Analyze feedback by context (season, soil type, location)
   */
  async analyzeByContext(
    feedbackData: FeedbackData[],
    context: {
      season?: string;
      soilType?: string;
      location?: string;
    }
  ): Promise<FeedbackAnalysis> {
    const contextFeedback = feedbackData.filter((f) => {
      if (context.season && f.contextSnapshot.season !== context.season) return false;
      if (context.soilType && f.contextSnapshot.soilType !== context.soilType) return false;
      if (context.location && f.contextSnapshot.location !== context.location) return false;
      return true;
    });

    if (contextFeedback.length === 0) {
      return this.createEmptyAnalysis('crop', context);
    }

    const total = contextFeedback.length;
    const accepted = contextFeedback.filter((f) => f.action === 'accepted').length;
    const rejected = contextFeedback.filter((f) => f.action === 'rejected').length;
    const modified = contextFeedback.filter((f) => f.action === 'modified').length;

    const commonModifications = this.analyzeModifications(contextFeedback);
    const commonRejectionReasons = this.analyzeRejectionReasons(contextFeedback);
    const insights = this.generateInsights(
      contextFeedback[0]?.recommendationType || 'crop',
      accepted / total,
      rejected / total,
      modified / total,
      commonModifications,
      commonRejectionReasons
    );

    return {
      recommendationType: contextFeedback[0]?.recommendationType || 'crop',
      context,
      totalFeedback: total,
      acceptanceRate: (accepted / total) * 100,
      rejectionRate: (rejected / total) * 100,
      modificationRate: (modified / total) * 100,
      commonModifications,
      commonRejectionReasons,
      insights,
    };
  }

  /**
   * Analyze modifications to identify common patterns
   */
  private analyzeModifications(
    feedbackData: FeedbackData[]
  ): Array<{ field: string; frequency: number; averageChange?: number }> {
    const modifiedFeedback = feedbackData.filter((f) => f.action === 'modified');

    if (modifiedFeedback.length === 0) {
      return [];
    }

    // Count modifications by field
    const fieldCounts: Record<string, { count: number; changes: number[] }> = {};

    modifiedFeedback.forEach((feedback) => {
      if (feedback.modifications) {
        Object.keys(feedback.modifications).forEach((field) => {
          if (!fieldCounts[field]) {
            fieldCounts[field] = { count: 0, changes: [] };
          }
          fieldCounts[field].count++;

          // Track numeric changes
          const change = feedback.modifications![field];
          if (typeof change === 'number') {
            fieldCounts[field].changes.push(change);
          }
        });
      }
    });

    // Convert to array and sort by frequency
    return Object.entries(fieldCounts)
      .map(([field, data]) => ({
        field,
        frequency: data.count,
        averageChange:
          data.changes.length > 0
            ? data.changes.reduce((a, b) => a + b, 0) / data.changes.length
            : undefined,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5); // Top 5 modifications
  }

  /**
   * Analyze rejection reasons
   */
  private analyzeRejectionReasons(
    feedbackData: FeedbackData[]
  ): Array<{ reason: string; frequency: number }> {
    const rejectedFeedback = feedbackData.filter((f) => f.action === 'rejected' && f.reason);

    if (rejectedFeedback.length === 0) {
      return [];
    }

    // Count reasons
    const reasonCounts: Record<string, number> = {};

    rejectedFeedback.forEach((feedback) => {
      if (feedback.reason) {
        reasonCounts[feedback.reason] = (reasonCounts[feedback.reason] || 0) + 1;
      }
    });

    // Convert to array and sort by frequency
    return Object.entries(reasonCounts)
      .map(([reason, frequency]) => ({ reason, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5); // Top 5 reasons
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    type: RecommendationType,
    acceptanceRate: number,
    rejectionRate: number,
    modificationRate: number,
    modifications: Array<{ field: string; frequency: number }>,
    rejections: Array<{ reason: string; frequency: number }>
  ): string[] {
    const insights: string[] = [];

    // Acceptance rate insights
    if (acceptanceRate > 0.7) {
      insights.push(`High acceptance rate (${(acceptanceRate * 100).toFixed(1)}%) indicates ${type} recommendations are well-received.`);
    } else if (acceptanceRate < 0.4) {
      insights.push(`Low acceptance rate (${(acceptanceRate * 100).toFixed(1)}%) suggests ${type} recommendations need improvement.`);
    }

    // Modification insights
    if (modificationRate > 0.3) {
      insights.push(`High modification rate (${(modificationRate * 100).toFixed(1)}%) indicates users prefer to customize recommendations.`);
      
      if (modifications.length > 0) {
        const topMod = modifications[0];
        insights.push(`Most commonly modified field: ${topMod.field} (${topMod.frequency} times).`);
      }
    }

    // Rejection insights
    if (rejectionRate > 0.3) {
      insights.push(`High rejection rate (${(rejectionRate * 100).toFixed(1)}%) requires investigation.`);
      
      if (rejections.length > 0) {
        const topReason = rejections[0];
        insights.push(`Most common rejection reason: ${topReason.reason} (${topReason.frequency} times).`);
      }
    }

    // General insights
    if (insights.length === 0) {
      insights.push(`${type} recommendations show balanced user feedback with room for optimization.`);
    }

    return insights;
  }

  /**
   * Calculate performance score for a specific recommendation
   */
  async calculateRecommendationPerformance(
    feedbackData: FeedbackData[],
    recommendationId: string
  ): Promise<RecommendationPerformance | null> {
    const recFeedback = feedbackData.filter((f) => f.recommendationId === recommendationId);

    if (recFeedback.length === 0) {
      return null;
    }

    const acceptanceCount = recFeedback.filter((f) => f.action === 'accepted').length;
    const rejectionCount = recFeedback.filter((f) => f.action === 'rejected').length;
    const modificationCount = recFeedback.filter((f) => f.action === 'modified').length;
    const total = recFeedback.length;

    // Performance score: accepted = 100 points, modified = 70 points, rejected = 0 points
    const performanceScore =
      ((acceptanceCount * 100 + modificationCount * 70) / total);

    return {
      recommendationId,
      recommendationType: recFeedback[0].recommendationType,
      acceptanceCount,
      rejectionCount,
      modificationCount,
      totalFeedback: total,
      performanceScore,
    };
  }

  /**
   * Identify trends over time
   */
  async identifyTrends(
    feedbackData: FeedbackData[],
    periodDays: number = 30
  ): Promise<{
    period: string;
    acceptanceRateTrend: 'improving' | 'declining' | 'stable';
    trendPercentage: number;
  }> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const midPoint = new Date(now.getTime() - (periodDays / 2) * 24 * 60 * 60 * 1000);

    const firstHalf = feedbackData.filter(
      (f) => f.timestamp >= periodStart && f.timestamp < midPoint
    );
    const secondHalf = feedbackData.filter(
      (f) => f.timestamp >= midPoint && f.timestamp <= now
    );

    const firstHalfAcceptance =
      firstHalf.length > 0
        ? firstHalf.filter((f) => f.action === 'accepted').length / firstHalf.length
        : 0;
    const secondHalfAcceptance =
      secondHalf.length > 0
        ? secondHalf.filter((f) => f.action === 'accepted').length / secondHalf.length
        : 0;

    const trendPercentage = ((secondHalfAcceptance - firstHalfAcceptance) * 100);

    let trend: 'improving' | 'declining' | 'stable';
    if (trendPercentage > 5) {
      trend = 'improving';
    } else if (trendPercentage < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return {
      period: `Last ${periodDays} days`,
      acceptanceRateTrend: trend,
      trendPercentage,
    };
  }

  /**
   * Create empty analysis result
   */
  private createEmptyAnalysis(
    type: RecommendationType,
    context: any = {}
  ): FeedbackAnalysis {
    return {
      recommendationType: type,
      context,
      totalFeedback: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
      modificationRate: 0,
      commonModifications: [],
      commonRejectionReasons: [],
      insights: ['No feedback data available for analysis.'],
    };
  }
}

// Export singleton instance
export const feedbackAnalyzer = new FeedbackAnalyzer();
