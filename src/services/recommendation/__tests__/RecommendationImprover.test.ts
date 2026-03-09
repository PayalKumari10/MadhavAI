/**
 * RecommendationImprover Tests
 * Tests for recommendation improvement functionality
 */

import { RecommendationImprover } from '../RecommendationImprover';
import { FeedbackData } from '../FeedbackCollector';
import { EnhancedFarmingContext } from '../FarmingContextBuilder';

describe('RecommendationImprover', () => {
  let improver: RecommendationImprover;

  beforeEach(() => {
    improver = new RecommendationImprover();
  });

  afterEach(() => {
    improver.clearRules();
  });

  const createMockFeedback = (
    action: 'accepted' | 'rejected' | 'modified',
    modifications?: Record<string, any>,
    reason?: string
  ): FeedbackData => ({
    id: `feedback-${Math.random()}`,
    userId: 'user-123',
    recommendationType: 'crop',
    recommendationId: 'rec-456',
    recommendationData: {},
    action,
    modifications,
    reason,
    timestamp: new Date(),
    contextSnapshot: {
      season: 'kharif',
      soilType: 'loamy',
      location: 'Punjab',
    },
  });

  const createMockContext = (): EnhancedFarmingContext => ({
    userProfile: {
      userId: 'user-123',
      mobileNumber: '+919876543210',
      name: 'Test User',
      location: {
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Test Village',
        pincode: '141001',
        coordinates: { latitude: 30.9, longitude: 75.85 },
      },
      farmSize: 5,
      primaryCrops: ['Rice', 'Wheat'],
      soilType: 'loamy',
      languagePreference: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    soilData: null,
    weatherForecast: null,
    marketData: null,
    currentSeason: 'kharif',
    timestamp: new Date(),
    computed: {
      farmSizeCategory: 'medium',
      soilHealthRating: 'good',
      weatherRisk: 'low',
      marketOpportunity: 'neutral',
      recommendationReadiness: 80,
    },
  });

  describe('learnFromFeedback', () => {
    it('should generate adjustment rules from feedback', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('modified', { dosage: 75 }),
        createMockFeedback('modified', { dosage: 82 }),
      ];

      const rules = await improver.learnFromFeedback(feedbackData);

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].field).toBe('dosage');
      expect(rules[0].recommendationType).toBe('crop');
    });

    it('should not generate rules with insufficient feedback', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
      ];

      const rules = await improver.learnFromFeedback(feedbackData);

      expect(rules).toHaveLength(0);
    });

    it('should calculate confidence based on feedback count', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
      ];

      const rules = await improver.learnFromFeedback(feedbackData);

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].confidence).toBeGreaterThan(0);
      expect(rules[0].confidence).toBeLessThanOrEqual(100);
    });

    it('should handle string modifications', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { timing: 'Earlier' }),
        createMockFeedback('modified', { timing: 'Earlier' }),
        createMockFeedback('modified', { timing: 'Earlier' }),
        createMockFeedback('modified', { timing: 'Later' }),
        createMockFeedback('accepted'),
      ];

      const rules = await improver.learnFromFeedback(feedbackData);

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].field).toBe('timing');
      expect(rules[0].adjustment).toBe('Earlier');
    });
  });

  describe('applyAdjustments', () => {
    it('should apply learned adjustments to recommendations', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('modified', { dosage: 75 }),
        createMockFeedback('modified', { dosage: 82 }),
      ];

      await improver.learnFromFeedback(feedbackData);

      const recommendation = {
        name: 'Urea',
        dosage: 100,
        timing: 'Standard',
      };

      const adjusted = await improver.applyAdjustments(recommendation, 'crop', createMockContext());

      expect(adjusted.dosage).not.toBe(100);
      expect(adjusted.dosage).toBeLessThan(100); // Should be adjusted towards 82.4
    });

    it('should not modify fields without rules', async () => {
      const recommendation = {
        name: 'Urea',
        dosage: 100,
        timing: 'Standard',
      };

      const adjusted = await improver.applyAdjustments(recommendation, 'crop', createMockContext());

      expect(adjusted).toEqual(recommendation);
    });

    it('should apply context-specific rules', async () => {
      const kharifFeedback: FeedbackData[] = [
        {
          ...createMockFeedback('modified', { dosage: 80 }),
          contextSnapshot: { season: 'kharif', location: 'Punjab' },
        },
        {
          ...createMockFeedback('modified', { dosage: 85 }),
          contextSnapshot: { season: 'kharif', location: 'Punjab' },
        },
        {
          ...createMockFeedback('modified', { dosage: 90 }),
          contextSnapshot: { season: 'kharif', location: 'Punjab' },
        },
        {
          ...createMockFeedback('modified', { dosage: 75 }),
          contextSnapshot: { season: 'kharif', location: 'Punjab' },
        },
        {
          ...createMockFeedback('modified', { dosage: 82 }),
          contextSnapshot: { season: 'kharif', location: 'Punjab' },
        },
      ];

      await improver.learnFromFeedback(kharifFeedback);

      const recommendation = { dosage: 100 };
      const context = createMockContext();
      context.currentSeason = 'kharif';

      const adjusted = await improver.applyAdjustments(recommendation, 'crop', context);

      expect(adjusted.dosage).not.toBe(100);
    });
  });

  describe('getImprovementSuggestions', () => {
    it('should generate suggestions for low acceptance rate', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('rejected', undefined, 'Not suitable'),
        createMockFeedback('rejected', undefined, 'Too expensive'),
        createMockFeedback('rejected', undefined, 'Not suitable'),
        createMockFeedback('accepted'),
      ];

      const suggestions = await improver.getImprovementSuggestions(feedbackData);

      expect(suggestions.length).toBeGreaterThan(0);
      const lowAcceptanceSuggestion = suggestions.find((s) =>
        s.issue.includes('Low acceptance rate')
      );
      expect(lowAcceptanceSuggestion).toBeDefined();
      expect(lowAcceptanceSuggestion!.priority).toBe('high');
    });

    it('should generate suggestions for high modification rate', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('accepted'),
      ];

      const suggestions = await improver.getImprovementSuggestions(feedbackData);

      expect(suggestions.length).toBeGreaterThan(0);
      const modificationSuggestion = suggestions.find((s) => s.issue.includes('frequently modify'));
      expect(modificationSuggestion).toBeDefined();
    });

    it('should generate suggestions for common rejection reasons', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('rejected', undefined, 'Too expensive'),
        createMockFeedback('rejected', undefined, 'Too expensive'),
        createMockFeedback('rejected', undefined, 'Too expensive'),
        createMockFeedback('accepted'),
      ];

      const suggestions = await improver.getImprovementSuggestions(feedbackData);

      expect(suggestions.length).toBeGreaterThan(0);
      const rejectionSuggestion = suggestions.find((s) => s.issue.includes('Too expensive'));
      expect(rejectionSuggestion).toBeDefined();
      expect(rejectionSuggestion!.priority).toBe('high');
    });

    it('should sort suggestions by priority and affected count', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('rejected', undefined, 'Not suitable'),
        createMockFeedback('rejected', undefined, 'Not suitable'),
        createMockFeedback('rejected', undefined, 'Not suitable'),
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('accepted'),
      ];

      const suggestions = await improver.getImprovementSuggestions(feedbackData);

      expect(suggestions.length).toBeGreaterThan(0);
      // High priority suggestions should come first
      if (suggestions.length > 1) {
        const priorities = suggestions.map((s) => s.priority);
        const highPriorityIndex = priorities.indexOf('high');
        const mediumPriorityIndex = priorities.indexOf('medium');
        if (highPriorityIndex !== -1 && mediumPriorityIndex !== -1) {
          expect(highPriorityIndex).toBeLessThan(mediumPriorityIndex);
        }
      }
    });
  });

  describe('getAdjustmentRules', () => {
    it('should return all adjustment rules', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('modified', { dosage: 75 }),
        createMockFeedback('modified', { dosage: 82 }),
      ];

      await improver.learnFromFeedback(feedbackData);

      const rules = improver.getAdjustmentRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('recommendationType');
      expect(rules[0]).toHaveProperty('field');
      expect(rules[0]).toHaveProperty('adjustment');
      expect(rules[0]).toHaveProperty('confidence');
    });
  });

  describe('rule consolidation', () => {
    it('should remove low-confidence rules', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
        createMockFeedback('accepted'),
      ];

      await improver.learnFromFeedback(feedbackData);

      const rules = improver.getAdjustmentRules();

      // All rules should have confidence >= 30
      rules.forEach((rule) => {
        expect(rule.confidence).toBeGreaterThanOrEqual(30);
      });
    });

    it('should remove duplicate rules', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', { dosage: 80 }),
        createMockFeedback('modified', { dosage: 85 }),
        createMockFeedback('modified', { dosage: 90 }),
        createMockFeedback('modified', { dosage: 75 }),
        createMockFeedback('modified', { dosage: 82 }),
      ];

      await improver.learnFromFeedback(feedbackData);
      await improver.learnFromFeedback(feedbackData); // Learn again

      const rules = improver.getAdjustmentRules();

      // Should not have duplicate rules for same field and context
      const ruleKeys = rules.map((r) => `${r.recommendationType}:${r.field}`);
      const uniqueKeys = new Set(ruleKeys);
      expect(ruleKeys.length).toBe(uniqueKeys.size);
    });
  });
});
