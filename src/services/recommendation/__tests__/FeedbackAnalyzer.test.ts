/**
 * FeedbackAnalyzer Tests
 * Tests for feedback analysis functionality
 */

import { FeedbackAnalyzer } from '../FeedbackAnalyzer';
import { FeedbackData } from '../FeedbackCollector';

describe('FeedbackAnalyzer', () => {
  let analyzer: FeedbackAnalyzer;

  beforeEach(() => {
    analyzer = new FeedbackAnalyzer();
  });

  const createMockFeedback = (
    action: 'accepted' | 'rejected' | 'modified',
    type: 'crop' | 'fertilizer' | 'seed' = 'crop',
    modifications?: Record<string, any>,
    reason?: string
  ): FeedbackData => ({
    id: `feedback-${Math.random()}`,
    userId: 'user-123',
    recommendationType: type,
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

  describe('analyzeByType', () => {
    it('should analyze feedback by recommendation type', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('accepted', 'crop'),
        createMockFeedback('accepted', 'crop'),
        createMockFeedback('rejected', 'crop', undefined, 'Not suitable'),
        createMockFeedback('modified', 'crop', { dosage: 80 }),
        createMockFeedback('accepted', 'fertilizer'),
      ];

      const analysis = await analyzer.analyzeByType(feedbackData, 'crop');

      expect(analysis.recommendationType).toBe('crop');
      expect(analysis.totalFeedback).toBe(4);
      expect(analysis.acceptanceRate).toBe(50);
      expect(analysis.rejectionRate).toBe(25);
      expect(analysis.modificationRate).toBe(25);
    });

    it('should identify common modifications', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('modified', 'crop', { dosage: 80 }),
        createMockFeedback('modified', 'crop', { dosage: 85 }),
        createMockFeedback('modified', 'crop', { dosage: 90 }),
        createMockFeedback('modified', 'crop', { timing: 'Earlier' }),
      ];

      const analysis = await analyzer.analyzeByType(feedbackData, 'crop');

      expect(analysis.commonModifications).toHaveLength(2);
      expect(analysis.commonModifications[0].field).toBe('dosage');
      expect(analysis.commonModifications[0].frequency).toBe(3);
      expect(analysis.commonModifications[0].averageChange).toBeCloseTo(85, 0);
    });

    it('should identify common rejection reasons', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('rejected', 'crop', undefined, 'Too expensive'),
        createMockFeedback('rejected', 'crop', undefined, 'Too expensive'),
        createMockFeedback('rejected', 'crop', undefined, 'Not suitable'),
        createMockFeedback('accepted', 'crop'),
      ];

      const analysis = await analyzer.analyzeByType(feedbackData, 'crop');

      expect(analysis.commonRejectionReasons).toHaveLength(2);
      expect(analysis.commonRejectionReasons[0].reason).toBe('Too expensive');
      expect(analysis.commonRejectionReasons[0].frequency).toBe(2);
    });

    it('should generate insights', async () => {
      const feedbackData: FeedbackData[] = [
        createMockFeedback('accepted', 'crop'),
        createMockFeedback('accepted', 'crop'),
        createMockFeedback('accepted', 'crop'),
        createMockFeedback('rejected', 'crop', undefined, 'Not suitable'),
      ];

      const analysis = await analyzer.analyzeByType(feedbackData, 'crop');

      expect(analysis.insights).toBeDefined();
      expect(analysis.insights.length).toBeGreaterThan(0);
    });

    it('should handle empty feedback', async () => {
      const analysis = await analyzer.analyzeByType([], 'crop');

      expect(analysis.totalFeedback).toBe(0);
      expect(analysis.acceptanceRate).toBe(0);
      expect(analysis.insights).toContain('No feedback data available for analysis.');
    });
  });

  describe('analyzeByContext', () => {
    it('should analyze feedback by context', async () => {
      const feedbackData: FeedbackData[] = [
        {
          ...createMockFeedback('accepted', 'crop'),
          contextSnapshot: { season: 'kharif', soilType: 'loamy', location: 'Punjab' },
        },
        {
          ...createMockFeedback('accepted', 'crop'),
          contextSnapshot: { season: 'kharif', soilType: 'loamy', location: 'Punjab' },
        },
        {
          ...createMockFeedback('rejected', 'crop'),
          contextSnapshot: { season: 'rabi', soilType: 'clayey', location: 'Haryana' },
        },
      ];

      const analysis = await analyzer.analyzeByContext(feedbackData, {
        season: 'kharif',
        soilType: 'loamy',
      });

      expect(analysis.totalFeedback).toBe(2);
      expect(analysis.acceptanceRate).toBe(100);
    });

    it('should filter by partial context', async () => {
      const feedbackData: FeedbackData[] = [
        {
          ...createMockFeedback('accepted', 'crop'),
          contextSnapshot: { season: 'kharif', soilType: 'loamy', location: 'Punjab' },
        },
        {
          ...createMockFeedback('accepted', 'crop'),
          contextSnapshot: { season: 'kharif', soilType: 'clayey', location: 'Punjab' },
        },
        {
          ...createMockFeedback('rejected', 'crop'),
          contextSnapshot: { season: 'rabi', soilType: 'loamy', location: 'Punjab' },
        },
      ];

      const analysis = await analyzer.analyzeByContext(feedbackData, {
        season: 'kharif',
      });

      expect(analysis.totalFeedback).toBe(2);
    });
  });

  describe('calculateRecommendationPerformance', () => {
    it('should calculate performance for a specific recommendation', async () => {
      const feedbackData: FeedbackData[] = [
        { ...createMockFeedback('accepted'), recommendationId: 'rec-123' },
        { ...createMockFeedback('accepted'), recommendationId: 'rec-123' },
        { ...createMockFeedback('modified'), recommendationId: 'rec-123' },
        { ...createMockFeedback('rejected'), recommendationId: 'rec-123' },
        { ...createMockFeedback('accepted'), recommendationId: 'rec-456' },
      ];

      const performance = await analyzer.calculateRecommendationPerformance(
        feedbackData,
        'rec-123'
      );

      expect(performance).not.toBeNull();
      expect(performance!.recommendationId).toBe('rec-123');
      expect(performance!.totalFeedback).toBe(4);
      expect(performance!.acceptanceCount).toBe(2);
      expect(performance!.modificationCount).toBe(1);
      expect(performance!.rejectionCount).toBe(1);
      expect(performance!.performanceScore).toBeCloseTo(67.5, 1);
    });

    it('should return null for non-existent recommendation', async () => {
      const feedbackData: FeedbackData[] = [createMockFeedback('accepted')];

      const performance = await analyzer.calculateRecommendationPerformance(
        feedbackData,
        'non-existent'
      );

      expect(performance).toBeNull();
    });
  });

  describe('identifyTrends', () => {
    it('should identify improving trend', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const feedbackData: FeedbackData[] = [
        { ...createMockFeedback('rejected'), timestamp: oldDate },
        { ...createMockFeedback('rejected'), timestamp: oldDate },
        { ...createMockFeedback('accepted'), timestamp: recentDate },
        { ...createMockFeedback('accepted'), timestamp: recentDate },
        { ...createMockFeedback('accepted'), timestamp: recentDate },
      ];

      const trends = await analyzer.identifyTrends(feedbackData, 30);

      expect(trends.acceptanceRateTrend).toBe('improving');
      expect(trends.trendPercentage).toBeGreaterThan(0);
    });

    it('should identify declining trend', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const feedbackData: FeedbackData[] = [
        { ...createMockFeedback('accepted'), timestamp: oldDate },
        { ...createMockFeedback('accepted'), timestamp: oldDate },
        { ...createMockFeedback('accepted'), timestamp: oldDate },
        { ...createMockFeedback('rejected'), timestamp: recentDate },
        { ...createMockFeedback('rejected'), timestamp: recentDate },
      ];

      const trends = await analyzer.identifyTrends(feedbackData, 30);

      expect(trends.acceptanceRateTrend).toBe('declining');
      expect(trends.trendPercentage).toBeLessThan(0);
    });

    it('should identify stable trend', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const feedbackData: FeedbackData[] = [
        { ...createMockFeedback('accepted'), timestamp: oldDate },
        { ...createMockFeedback('rejected'), timestamp: oldDate },
        { ...createMockFeedback('accepted'), timestamp: recentDate },
        { ...createMockFeedback('rejected'), timestamp: recentDate },
      ];

      const trends = await analyzer.identifyTrends(feedbackData, 30);

      expect(trends.acceptanceRateTrend).toBe('stable');
    });
  });
});
