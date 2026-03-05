/**
 * Feedback Integration Tests
 * Tests for end-to-end feedback integration workflow
 * Requirements: 16.6
 */

import { FeedbackCollector } from '../FeedbackCollector';
import { FeedbackAnalyzer } from '../FeedbackAnalyzer';
import { RecommendationImprover } from '../RecommendationImprover';
import { EnhancedFarmingContext } from '../FarmingContextBuilder';

describe('Feedback Integration', () => {
  let collector: FeedbackCollector;
  let analyzer: FeedbackAnalyzer;
  let improver: RecommendationImprover;

  beforeEach(() => {
    collector = new FeedbackCollector();
    analyzer = new FeedbackAnalyzer();
    improver = new RecommendationImprover(analyzer);
  });

  afterEach(async () => {
    await collector.clearFeedback();
    improver.clearRules();
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

  describe('Complete feedback workflow', () => {
    it('should collect, analyze, and improve recommendations', async () => {
      const context = createMockContext();
      const contextSnapshot = {
        season: context.currentSeason,
        soilType: context.userProfile.soilType,
        location: context.userProfile.location.state,
      };

      // Step 1: Collect feedback from multiple users
      await collector.collectAcceptedFeedback(
        'user-1',
        'fertilizer',
        'rec-1',
        { name: 'Urea', dosage: 100 },
        contextSnapshot
      );

      await collector.collectModifiedFeedback(
        'user-2',
        'fertilizer',
        'rec-2',
        { name: 'Urea', dosage: 100 },
        { dosage: 80 },
        contextSnapshot
      );

      await collector.collectModifiedFeedback(
        'user-3',
        'fertilizer',
        'rec-3',
        { name: 'Urea', dosage: 100 },
        { dosage: 85 },
        contextSnapshot
      );

      await collector.collectModifiedFeedback(
        'user-4',
        'fertilizer',
        'rec-4',
        { name: 'Urea', dosage: 100 },
        { dosage: 90 },
        contextSnapshot
      );

      await collector.collectModifiedFeedback(
        'user-5',
        'fertilizer',
        'rec-5',
        { name: 'Urea', dosage: 100 },
        { dosage: 75 },
        contextSnapshot
      );

      // Step 2: Analyze feedback
      const allFeedback = await collector.getAllFeedback();
      const analysis = await analyzer.analyzeByType(allFeedback, 'fertilizer');

      expect(analysis.totalFeedback).toBe(5);
      expect(analysis.modificationRate).toBe(80);
      expect(analysis.commonModifications.length).toBeGreaterThan(0);
      expect(analysis.commonModifications[0].field).toBe('dosage');

      // Step 3: Learn from feedback
      const rules = await improver.learnFromFeedback(allFeedback);

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].field).toBe('dosage');

      // Step 4: Apply improvements to new recommendation
      const newRecommendation = {
        name: 'Urea',
        dosage: 100,
        timing: 'Standard',
      };

      const improved = await improver.applyAdjustments(
        newRecommendation,
        'fertilizer',
        context
      );

      // Dosage should be adjusted based on user feedback
      expect(improved.dosage).not.toBe(100);
      expect(improved.dosage).toBeLessThan(100);
      expect(improved.dosage).toBeGreaterThan(70);
    });

    it('should generate improvement suggestions from feedback', async () => {
      const contextSnapshot = {
        season: 'kharif',
        location: 'Punjab',
      };

      // Collect feedback with common rejection reason
      await collector.collectRejectedFeedback(
        'user-1',
        'crop',
        'rec-1',
        { cropName: 'Cotton' },
        'Too expensive',
        contextSnapshot
      );

      await collector.collectRejectedFeedback(
        'user-2',
        'crop',
        'rec-2',
        { cropName: 'Cotton' },
        'Too expensive',
        contextSnapshot
      );

      await collector.collectRejectedFeedback(
        'user-3',
        'crop',
        'rec-3',
        { cropName: 'Cotton' },
        'Too expensive',
        contextSnapshot
      );

      await collector.collectAcceptedFeedback(
        'user-4',
        'crop',
        'rec-4',
        { cropName: 'Rice' },
        contextSnapshot
      );

      const allFeedback = await collector.getAllFeedback();
      const suggestions = await improver.getImprovementSuggestions(allFeedback);

      expect(suggestions.length).toBeGreaterThan(0);
      
      const expensiveSuggestion = suggestions.find((s) =>
        s.issue.includes('Too expensive')
      );
      expect(expensiveSuggestion).toBeDefined();
      expect(expensiveSuggestion!.priority).toBe('high');
    });

    it('should track feedback statistics over time', async () => {
      const contextSnapshot = {
        season: 'kharif',
        location: 'Punjab',
      };

      // Collect diverse feedback
      await collector.collectAcceptedFeedback(
        'user-1',
        'crop',
        'rec-1',
        {},
        contextSnapshot
      );
      await collector.collectAcceptedFeedback(
        'user-2',
        'crop',
        'rec-2',
        {},
        contextSnapshot
      );
      await collector.collectRejectedFeedback(
        'user-3',
        'crop',
        'rec-3',
        {},
        'Not suitable',
        contextSnapshot
      );
      await collector.collectModifiedFeedback(
        'user-4',
        'crop',
        'rec-4',
        {},
        { dosage: 80 },
        contextSnapshot
      );

      const stats = await collector.getFeedbackStats();

      expect(stats.total).toBe(4);
      expect(stats.accepted).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.modified).toBe(1);
      expect(stats.acceptanceRate).toBe(50);
    });

    it('should identify trends in feedback', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const contextSnapshot = {
        season: 'kharif',
        location: 'Punjab',
      };

      // Old feedback - mostly rejected
      await collector.collectRejectedFeedback(
        'user-1',
        'crop',
        'rec-1',
        {},
        'Not suitable',
        contextSnapshot
      );
      await collector.collectRejectedFeedback(
        'user-2',
        'crop',
        'rec-2',
        {},
        'Not suitable',
        contextSnapshot
      );

      // Manually set old timestamps
      const allFeedback = await collector.getAllFeedback();
      allFeedback[0].timestamp = oldDate;
      allFeedback[1].timestamp = oldDate;

      // Recent feedback - mostly accepted
      await collector.collectAcceptedFeedback(
        'user-3',
        'crop',
        'rec-3',
        {},
        contextSnapshot
      );
      await collector.collectAcceptedFeedback(
        'user-4',
        'crop',
        'rec-4',
        {},
        contextSnapshot
      );
      await collector.collectAcceptedFeedback(
        'user-5',
        'crop',
        'rec-5',
        {},
        contextSnapshot
      );

      const updatedFeedback = await collector.getAllFeedback();
      updatedFeedback[2].timestamp = recentDate;
      updatedFeedback[3].timestamp = recentDate;
      updatedFeedback[4].timestamp = recentDate;

      const trends = await analyzer.identifyTrends(updatedFeedback, 30);

      expect(trends.acceptanceRateTrend).toBe('improving');
      expect(trends.trendPercentage).toBeGreaterThan(0);
    });

    it('should handle context-specific feedback', async () => {
      // Kharif season feedback
      await collector.collectModifiedFeedback(
        'user-1',
        'crop',
        'rec-1',
        { dosage: 100 },
        { dosage: 80 },
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-2',
        'crop',
        'rec-2',
        { dosage: 100 },
        { dosage: 85 },
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-3',
        'crop',
        'rec-3',
        { dosage: 100 },
        { dosage: 90 },
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-4',
        'crop',
        'rec-4',
        { dosage: 100 },
        { dosage: 75 },
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-5',
        'crop',
        'rec-5',
        { dosage: 100 },
        { dosage: 82 },
        { season: 'kharif', location: 'Punjab' }
      );

      // Rabi season feedback (different pattern)
      await collector.collectModifiedFeedback(
        'user-6',
        'crop',
        'rec-6',
        { dosage: 100 },
        { dosage: 110 },
        { season: 'rabi', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-7',
        'crop',
        'rec-7',
        { dosage: 100 },
        { dosage: 115 },
        { season: 'rabi', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-8',
        'crop',
        'rec-8',
        { dosage: 100 },
        { dosage: 105 },
        { season: 'rabi', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-9',
        'crop',
        'rec-9',
        { dosage: 100 },
        { dosage: 112 },
        { season: 'rabi', location: 'Punjab' }
      );
      await collector.collectModifiedFeedback(
        'user-10',
        'crop',
        'rec-10',
        { dosage: 100 },
        { dosage: 108 },
        { season: 'rabi', location: 'Punjab' }
      );

      const allFeedback = await collector.getAllFeedback();

      // Analyze kharif feedback
      const kharifAnalysis = await analyzer.analyzeByContext(allFeedback, {
        season: 'kharif',
      });
      expect(kharifAnalysis.totalFeedback).toBe(5);
      expect(kharifAnalysis.commonModifications[0].averageChange).toBeLessThan(100);

      // Analyze rabi feedback
      const rabiAnalysis = await analyzer.analyzeByContext(allFeedback, {
        season: 'rabi',
      });
      expect(rabiAnalysis.totalFeedback).toBe(5);
      expect(rabiAnalysis.commonModifications[0].averageChange).toBeGreaterThan(100);

      // Learn from feedback
      await improver.learnFromFeedback(allFeedback);

      // Apply adjustments for kharif season
      const kharifContext = createMockContext();
      kharifContext.currentSeason = 'kharif';
      const kharifRec = await improver.applyAdjustments(
        { dosage: 100 },
        'crop',
        kharifContext
      );
      expect(kharifRec.dosage).toBeLessThan(100);

      // Apply adjustments for rabi season
      const rabiContext = createMockContext();
      rabiContext.currentSeason = 'rabi';
      const rabiRec = await improver.applyAdjustments(
        { dosage: 100 },
        'crop',
        rabiContext
      );
      expect(rabiRec.dosage).toBeGreaterThan(100);
    });
  });

  describe('Property 59: Feedback Integration', () => {
    it('should record and use feedback for future improvements', async () => {
      const context = createMockContext();
      const contextSnapshot = {
        season: context.currentSeason,
        soilType: context.userProfile.soilType,
        location: context.userProfile.location.state,
      };

      // Collect feedback
      const feedback = await collector.collectModifiedFeedback(
        'user-123',
        'crop',
        'rec-456',
        { cropName: 'Rice', dosage: 100 },
        { dosage: 85 },
        contextSnapshot
      );

      // Verify feedback is recorded
      expect(feedback.id).toBeDefined();
      expect(feedback.action).toBe('modified');
      expect(feedback.modifications).toEqual({ dosage: 85 });

      // Collect more similar feedback
      await collector.collectModifiedFeedback(
        'user-124',
        'crop',
        'rec-457',
        { cropName: 'Rice', dosage: 100 },
        { dosage: 80 },
        contextSnapshot
      );
      await collector.collectModifiedFeedback(
        'user-125',
        'crop',
        'rec-458',
        { cropName: 'Rice', dosage: 100 },
        { dosage: 90 },
        contextSnapshot
      );
      await collector.collectModifiedFeedback(
        'user-126',
        'crop',
        'rec-459',
        { cropName: 'Rice', dosage: 100 },
        { dosage: 82 },
        contextSnapshot
      );
      await collector.collectModifiedFeedback(
        'user-127',
        'crop',
        'rec-460',
        { cropName: 'Rice', dosage: 100 },
        { dosage: 88 },
        contextSnapshot
      );

      // Learn from feedback
      const allFeedback = await collector.getAllFeedback();
      const rules = await improver.learnFromFeedback(allFeedback);

      // Verify rules were created
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].field).toBe('dosage');

      // Apply to new recommendation
      const newRecommendation = { cropName: 'Rice', dosage: 100 };
      const improved = await improver.applyAdjustments(
        newRecommendation,
        'crop',
        context
      );

      // Verify improvement was applied
      // The adjustment uses weighted average: 70% current (100) + 30% learned (85) = 95.5
      expect(improved.dosage).not.toBe(100);
      expect(improved.dosage).toBeGreaterThan(80);
      expect(improved.dosage).toBeLessThan(100);
    });
  });
});
