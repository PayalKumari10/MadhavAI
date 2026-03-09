/**
 * FeedbackCollector Tests
 * Tests for feedback collection functionality
 */

import { FeedbackCollector } from '../FeedbackCollector';

describe('FeedbackCollector', () => {
  let collector: FeedbackCollector;

  beforeEach(() => {
    collector = new FeedbackCollector();
  });

  afterEach(async () => {
    await collector.clearFeedback();
  });

  describe('collectAcceptedFeedback', () => {
    it('should collect accepted feedback', async () => {
      const feedback = await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-456',
        { cropName: 'Rice' },
        { season: 'kharif', location: 'Punjab' }
      );

      expect(feedback.userId).toBe('user-123');
      expect(feedback.recommendationType).toBe('crop');
      expect(feedback.action).toBe('accepted');
      expect(feedback.recommendationData.cropName).toBe('Rice');
    });

    it('should generate unique feedback IDs', async () => {
      const feedback1 = await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-456',
        {},
        { season: 'kharif', location: 'Punjab' }
      );

      const feedback2 = await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-789',
        {},
        { season: 'kharif', location: 'Punjab' }
      );

      expect(feedback1.id).not.toBe(feedback2.id);
    });

    it('should store timestamp', async () => {
      const before = new Date();
      const feedback = await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-456',
        {},
        { season: 'kharif', location: 'Punjab' }
      );
      const after = new Date();

      expect(feedback.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(feedback.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('collectRejectedFeedback', () => {
    it('should collect rejected feedback with reason', async () => {
      const feedback = await collector.collectRejectedFeedback(
        'user-123',
        'fertilizer',
        'rec-456',
        { name: 'Urea' },
        'Too expensive',
        { season: 'rabi', location: 'Haryana' }
      );

      expect(feedback.action).toBe('rejected');
      expect(feedback.reason).toBe('Too expensive');
    });
  });

  describe('collectModifiedFeedback', () => {
    it('should collect modified feedback with modifications', async () => {
      const modifications = {
        dosage: 80,
        timing: 'Earlier',
      };

      const feedback = await collector.collectModifiedFeedback(
        'user-123',
        'fertilizer',
        'rec-456',
        { name: 'Urea', dosage: 100 },
        modifications,
        { season: 'kharif', location: 'Punjab' }
      );

      expect(feedback.action).toBe('modified');
      expect(feedback.modifications).toEqual(modifications);
    });
  });

  describe('getFeedbackByUser', () => {
    it('should retrieve all feedback for a user', async () => {
      await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-1',
        {},
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectRejectedFeedback('user-123', 'seed', 'rec-2', {}, 'Not suitable', {
        season: 'rabi',
        location: 'Punjab',
      });
      await collector.collectAcceptedFeedback(
        'user-456',
        'crop',
        'rec-3',
        {},
        { season: 'kharif', location: 'Haryana' }
      );

      const userFeedback = await collector.getFeedbackByUser('user-123');

      expect(userFeedback).toHaveLength(2);
      expect(userFeedback.every((f) => f.userId === 'user-123')).toBe(true);
    });
  });

  describe('getFeedbackByType', () => {
    it('should retrieve feedback by recommendation type', async () => {
      await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-1',
        {},
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectAcceptedFeedback(
        'user-456',
        'fertilizer',
        'rec-2',
        {},
        { season: 'rabi', location: 'Haryana' }
      );
      await collector.collectAcceptedFeedback(
        'user-789',
        'crop',
        'rec-3',
        {},
        { season: 'kharif', location: 'Punjab' }
      );

      const cropFeedback = await collector.getFeedbackByType('crop');

      expect(cropFeedback).toHaveLength(2);
      expect(cropFeedback.every((f) => f.recommendationType === 'crop')).toBe(true);
    });
  });

  describe('getFeedbackByDateRange', () => {
    it('should retrieve feedback within date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await collector.collectAcceptedFeedback(
        'user-123',
        'crop',
        'rec-1',
        {},
        { season: 'kharif', location: 'Punjab' }
      );

      const feedback = await collector.getFeedbackByDateRange(yesterday, tomorrow);

      expect(feedback).toHaveLength(1);
    });
  });

  describe('getFeedbackStats', () => {
    it('should calculate feedback statistics', async () => {
      await collector.collectAcceptedFeedback(
        'user-1',
        'crop',
        'rec-1',
        {},
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectAcceptedFeedback(
        'user-2',
        'crop',
        'rec-2',
        {},
        { season: 'kharif', location: 'Punjab' }
      );
      await collector.collectRejectedFeedback('user-3', 'crop', 'rec-3', {}, 'Not suitable', {
        season: 'kharif',
        location: 'Punjab',
      });
      await collector.collectModifiedFeedback(
        'user-4',
        'crop',
        'rec-4',
        {},
        { dosage: 80 },
        { season: 'kharif', location: 'Punjab' }
      );

      const stats = await collector.getFeedbackStats();

      expect(stats.total).toBe(4);
      expect(stats.accepted).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.modified).toBe(1);
      expect(stats.acceptanceRate).toBe(50);
    });

    it('should handle empty feedback', async () => {
      const stats = await collector.getFeedbackStats();

      expect(stats.total).toBe(0);
      expect(stats.acceptanceRate).toBe(0);
    });
  });
});
