/**
 * ProgressTracker Tests
 */

import { ProgressTracker } from '../ProgressTracker';
import { DatabaseService } from '../../storage/DatabaseService';

jest.mock('../../storage/DatabaseService');

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = {
      query: jest.fn(),
      execute: jest.fn(),
    } as any;
    progressTracker = new ProgressTracker(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('markLessonComplete', () => {
    it('should mark lesson as complete and update summary', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([{ lessonId: '1' }]) // completed lessons
        .mockResolvedValueOnce([{ count: 10 }]) // total lessons
        .mockResolvedValueOnce([]) // category breakdown
        .mockResolvedValueOnce([]); // summary

      await progressTracker.markLessonComplete('user1', 'lesson1');

      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE INTO learning_progress'),
        expect.arrayContaining(['user1', 'lesson1'])
      );
    });
  });

  describe('isLessonComplete', () => {
    it('should return true when lesson is completed', async () => {
      mockDatabaseService.query.mockResolvedValue([{ count: 1 }]);

      const result = await progressTracker.isLessonComplete('user1', 'lesson1');

      expect(result).toBe(true);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM learning_progress'),
        ['user1', 'lesson1']
      );
    });

    it('should return false when lesson is not completed', async () => {
      mockDatabaseService.query.mockResolvedValue([{ count: 0 }]);

      const result = await progressTracker.isLessonComplete('user1', 'lesson999');

      expect(result).toBe(false);
    });
  });

  describe('getUserProgress', () => {
    it('should return complete user progress', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([
          { lessonId: 'lesson1' },
          { lessonId: 'lesson2' },
          { lessonId: 'lesson3' },
        ])
        .mockResolvedValueOnce([{ count: 20 }])
        .mockResolvedValueOnce([
          { category: 'pest_management', count: 2 },
          { category: 'irrigation', count: 1 },
        ])
        .mockResolvedValueOnce([{ lastAccessedAt: '2024-01-01T00:00:00Z' }]);

      const result = await progressTracker.getUserProgress('user1');

      expect(result).toEqual({
        userId: 'user1',
        completedLessons: ['lesson1', 'lesson2', 'lesson3'],
        totalLessons: 20,
        categories: {
          pest_management: 2,
          irrigation: 1,
        },
        lastAccessedAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('should handle user with no progress', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 20 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await progressTracker.getUserProgress('newuser');

      expect(result.completedLessons).toEqual([]);
      expect(result.totalLessons).toBe(20);
      expect(result.categories).toEqual({});
    });
  });

  describe('getCompletedLessonsByCategory', () => {
    it('should return completed lessons for specific category', async () => {
      mockDatabaseService.query.mockResolvedValue([
        { lessonId: 'lesson1' },
        { lessonId: 'lesson2' },
      ]);

      const result = await progressTracker.getCompletedLessonsByCategory(
        'user1',
        'pest_management'
      );

      expect(result).toEqual(['lesson1', 'lesson2']);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.userId = ? AND c.category = ?'),
        ['user1', 'pest_management']
      );
    });
  });

  describe('getCategoryProgress', () => {
    it('should calculate category completion percentage', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([{ count: 3 }]) // completed
        .mockResolvedValueOnce([{ count: 10 }]); // total

      const result = await progressTracker.getCategoryProgress('user1', 'irrigation');

      expect(result).toBe(30);
    });

    it('should handle division by zero', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await progressTracker.getCategoryProgress('user1', 'new_category');

      expect(result).toBe(0);
    });
  });

  describe('resetProgress', () => {
    it('should delete all progress for user', async () => {
      await progressTracker.resetProgress('user1');

      expect(mockDatabaseService.execute).toHaveBeenCalledTimes(2);
      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM learning_progress WHERE userId = ?'),
        ['user1']
      );
      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM progress_summary WHERE userId = ?'),
        ['user1']
      );
    });
  });

  describe('getRecentlyCompleted', () => {
    it('should return recently completed lessons', async () => {
      const mockResults = [
        { lessonId: 'lesson3', completedAt: '2024-01-03T00:00:00Z' },
        { lessonId: 'lesson2', completedAt: '2024-01-02T00:00:00Z' },
        { lessonId: 'lesson1', completedAt: '2024-01-01T00:00:00Z' },
      ];

      mockDatabaseService.query.mockResolvedValue(mockResults);

      const result = await progressTracker.getRecentlyCompleted('user1', 3);

      expect(result).toHaveLength(3);
      expect(result[0].lessonId).toBe('lesson3');
      expect(result[0].completedAt).toEqual(new Date('2024-01-03T00:00:00Z'));
    });
  });
});
