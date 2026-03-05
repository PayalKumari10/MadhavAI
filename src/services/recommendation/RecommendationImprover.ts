/**
 * Recommendation Improver Service
 * Uses feedback data to adjust and improve future recommendations
 * Requirements: 16.6
 */

import { FeedbackData, RecommendationType } from './FeedbackCollector';
import { FeedbackAnalyzer, feedbackAnalyzer } from './FeedbackAnalyzer';
import { EnhancedFarmingContext } from './FarmingContextBuilder';

/**
 * Adjustment rules learned from feedback
 */
export interface AdjustmentRule {
  id: string;
  recommendationType: RecommendationType;
  context: {
    season?: string;
    soilType?: string;
    location?: string;
  };
  field: string;
  adjustment: number | string;
  confidence: number; // 0-100
  basedOnFeedbackCount: number;
  createdAt: Date;
}

/**
 * Recommendation improvement suggestions
 */
export interface ImprovementSuggestion {
  recommendationType: RecommendationType;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  affectedCount: number;
}

/**
 * Recommendation improver that learns from feedback
 */
export class RecommendationImprover {
  private adjustmentRules: AdjustmentRule[] = [];
  private analyzer: FeedbackAnalyzer;

  constructor(analyzer: FeedbackAnalyzer = feedbackAnalyzer) {
    this.analyzer = analyzer;
  }

  /**
   * Learn from feedback and generate adjustment rules
   */
  async learnFromFeedback(feedbackData: FeedbackData[]): Promise<AdjustmentRule[]> {
    const newRules: AdjustmentRule[] = [];

    // Group feedback by type and context
    const groupedFeedback = this.groupFeedbackByContext(feedbackData);

    for (const [contextKey, contextFeedback] of Object.entries(groupedFeedback)) {
      const rules = await this.generateRulesForContext(contextKey, contextFeedback);
      newRules.push(...rules);
    }

    // Add new rules to existing rules
    this.adjustmentRules.push(...newRules);

    // Remove duplicate or conflicting rules
    this.consolidateRules();

    return newRules;
  }

  /**
   * Apply learned adjustments to a recommendation
   */
  async applyAdjustments<T extends Record<string, any>>(
    recommendation: T,
    recommendationType: RecommendationType,
    context: EnhancedFarmingContext
  ): Promise<T> {
    const adjustedRecommendation = { ...recommendation } as Record<string, any>;

    // Find applicable rules
    const applicableRules = this.findApplicableRules(recommendationType, {
      season: context.currentSeason,
      soilType: context.userProfile.soilType,
      location: context.userProfile.location.state,
    });

    // Apply each rule
    for (const rule of applicableRules) {
      if (rule.field in adjustedRecommendation) {
        const currentValue = adjustedRecommendation[rule.field];
        const adjustedValue = this.applyAdjustment(currentValue, rule.adjustment);
        adjustedRecommendation[rule.field] = adjustedValue;
      }
    }

    return adjustedRecommendation as T;
  }

  /**
   * Get improvement suggestions based on feedback analysis
   */
  async getImprovementSuggestions(
    feedbackData: FeedbackData[]
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    // Analyze each recommendation type
    const types: RecommendationType[] = ['crop', 'fertilizer', 'seed'];

    for (const type of types) {
      const analysis = await this.analyzer.analyzeByType(feedbackData, type);

      // Low acceptance rate
      if (analysis.acceptanceRate < 40) {
        suggestions.push({
          recommendationType: type,
          issue: `Low acceptance rate (${analysis.acceptanceRate.toFixed(1)}%)`,
          suggestion: 'Review recommendation algorithm and consider user preferences more heavily',
          priority: 'high',
          affectedCount: analysis.totalFeedback,
        });
      }

      // High modification rate
      if (analysis.modificationRate > 30 && analysis.commonModifications.length > 0) {
        const topMod = analysis.commonModifications[0];
        suggestions.push({
          recommendationType: type,
          issue: `Users frequently modify ${topMod.field}`,
          suggestion: `Adjust default ${topMod.field} values based on user modifications`,
          priority: 'medium',
          affectedCount: topMod.frequency,
        });
      }

      // Common rejection reasons
      if (analysis.commonRejectionReasons.length > 0) {
        const topReason = analysis.commonRejectionReasons[0];
        suggestions.push({
          recommendationType: type,
          issue: `Common rejection: ${topReason.reason}`,
          suggestion: 'Address this concern in recommendation logic',
          priority: 'high',
          affectedCount: topReason.frequency,
        });
      }
    }

    // Sort by priority and affected count
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.affectedCount - a.affectedCount;
    });

    return suggestions;
  }

  /**
   * Get all adjustment rules
   */
  getAdjustmentRules(): AdjustmentRule[] {
    return [...this.adjustmentRules];
  }

  /**
   * Clear all adjustment rules (for testing)
   */
  clearRules(): void {
    this.adjustmentRules = [];
  }

  /**
   * Group feedback by context
   */
  private groupFeedbackByContext(
    feedbackData: FeedbackData[]
  ): Record<string, FeedbackData[]> {
    const grouped: Record<string, FeedbackData[]> = {};

    feedbackData.forEach((feedback) => {
      const key = this.createContextKey(
        feedback.recommendationType,
        feedback.contextSnapshot
      );
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(feedback);
    });

    return grouped;
  }

  /**
   * Create context key for grouping
   */
  private createContextKey(
    type: RecommendationType,
    context: FeedbackData['contextSnapshot']
  ): string {
    return `${type}:${context.season || 'any'}:${context.soilType || 'any'}:${context.location || 'any'}`;
  }

  /**
   * Generate adjustment rules for a specific context
   */
  private async generateRulesForContext(
    contextKey: string,
    feedbackData: FeedbackData[]
  ): Promise<AdjustmentRule[]> {
    const rules: AdjustmentRule[] = [];

    // Only generate rules if we have enough feedback (minimum 5)
    if (feedbackData.length < 5) {
      return rules;
    }

    const modifiedFeedback = feedbackData.filter((f) => f.action === 'modified');

    if (modifiedFeedback.length === 0) {
      return rules;
    }

    // Analyze modifications by field
    const fieldModifications: Record<string, any[]> = {};

    modifiedFeedback.forEach((feedback) => {
      if (feedback.modifications) {
        Object.entries(feedback.modifications).forEach(([field, value]) => {
          if (!fieldModifications[field]) {
            fieldModifications[field] = [];
          }
          fieldModifications[field].push(value);
        });
      }
    });

    // Generate rules for fields with consistent modifications
    const [type, season, soilType, location] = contextKey.split(':');

    Object.entries(fieldModifications).forEach(([field, values]) => {
      // Only create rule if field was modified at least 3 times
      if (values.length >= 3) {
        const adjustment = this.calculateAdjustment(values);
        const confidence = Math.min(100, (values.length / feedbackData.length) * 100);

        rules.push({
          id: this.generateRuleId(),
          recommendationType: type as RecommendationType,
          context: {
            season: season !== 'any' ? season : undefined,
            soilType: soilType !== 'any' ? soilType : undefined,
            location: location !== 'any' ? location : undefined,
          },
          field,
          adjustment,
          confidence,
          basedOnFeedbackCount: values.length,
          createdAt: new Date(),
        });
      }
    });

    return rules;
  }

  /**
   * Calculate adjustment from modification values
   */
  private calculateAdjustment(values: any[]): number | string {
    // For numeric values, calculate average
    if (values.every((v) => typeof v === 'number')) {
      const sum = values.reduce((a, b) => a + b, 0);
      return sum / values.length;
    }

    // For string values, use most common
    if (values.every((v) => typeof v === 'string')) {
      const counts: Record<string, number> = {};
      values.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }

    // For mixed types, return first value
    return values[0];
  }

  /**
   * Find applicable rules for a context
   */
  private findApplicableRules(
    type: RecommendationType,
    context: {
      season?: string;
      soilType?: string;
      location?: string;
    }
  ): AdjustmentRule[] {
    return this.adjustmentRules
      .filter((rule) => {
        // Type must match
        if (rule.recommendationType !== type) return false;

        // Context must match (or be undefined in rule)
        if (rule.context.season && rule.context.season !== context.season) return false;
        if (rule.context.soilType && rule.context.soilType !== context.soilType) return false;
        if (rule.context.location && rule.context.location !== context.location) return false;

        return true;
      })
      .sort((a, b) => b.confidence - a.confidence); // Higher confidence first
  }

  /**
   * Apply adjustment to a value
   */
  private applyAdjustment(currentValue: any, adjustment: number | string): any {
    if (typeof currentValue === 'number' && typeof adjustment === 'number') {
      // For numeric values, use weighted average (70% current, 30% adjustment)
      return currentValue * 0.7 + adjustment * 0.3;
    }

    if (typeof currentValue === 'string' && typeof adjustment === 'string') {
      // For string values, replace with adjustment
      return adjustment;
    }

    // If types don't match, keep current value
    return currentValue;
  }

  /**
   * Consolidate rules by removing duplicates and low-confidence rules
   */
  private consolidateRules(): void {
    // Remove rules with confidence < 30
    this.adjustmentRules = this.adjustmentRules.filter((rule) => rule.confidence >= 30);

    // Remove duplicate rules (same type, context, and field)
    const seen = new Set<string>();
    this.adjustmentRules = this.adjustmentRules.filter((rule) => {
      const key = `${rule.recommendationType}:${JSON.stringify(rule.context)}:${rule.field}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    // Keep only top 50 rules by confidence
    this.adjustmentRules.sort((a, b) => b.confidence - a.confidence);
    this.adjustmentRules = this.adjustmentRules.slice(0, 50);
  }

  /**
   * Generate unique rule ID
   */
  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export singleton instance
export const recommendationImprover = new RecommendationImprover();
