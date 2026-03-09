/**
 * TrainingService Tests
 */

import { TrainingService } from '../TrainingService';
import { ContentManager } from '../ContentManager';
import { ProgressTracker } from '../ProgressTracker';
import { apiClient } from '../../api/apiClient';

jest.mock('../ContentManager');
jest.mock('../ProgressTracker');
jest.mock('../../api/apiClient');

describe('TrainingService', () => {
  let trainingService: TrainingService;
  let mockContentManager: jest.Mocked<ContentManager>;
  let mockProgressTracker: jest.Mocked<ProgressTracker>;

  beforeEach(() => {
    mockContentManager = {
      getLessons: jest.fn(),
      getLesson: jest.fn(),
      storeLesson: jest.fn(),
      searchLessons: jest.fn(),
      getRelatedLessons: jest.fn(),
      isAvailableOffline: jest.fn(),
    } as any;

    mockProgressTracker = {
      markLessonComplete: jest.fn(),
      getUserProgress: jest.fn(),
    } as any;

    trainingService = new TrainingService(mockContentManager, mockProgressTracker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLessons', () => {
    it('should fetch lessons from API and store locally', async () => {
      const mockLessons = [
        { id: '1', title: 'Lesson 1' },
        { id: '2', title: 'Lesson 2' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { lessons: mockLessons },
      });

      const result = await trainingService.getLessons('pest_management', 'hi');

      expect(result).toEqual(mockLessons);
      expect(apiClient.get).toHaveBeenCalledWith('/training/lessons', {
        params: { category: 'pest_management', language: 'hi' },
      });
      expect(mockContentManager.storeLesson).toHaveBeenCalledTimes(2);
    });

    it('should fallback to local storage when API fails', async () => {
      const mockLocalLessons = [{ id: '1', title: 'Cached Lesson' }];

      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockContentManager.getLessons.mockResolvedValue(mockLocalLessons as any);

      const result = await trainingService.getLessons('irrigation', 'ta');

      expect(result).toEqual(mockLocalLessons);
      expect(mockContentManager.getLessons).toHaveBeenCalledWith('irrigation', 'ta');
    });

    it('should return empty array when API returns no lessons', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { lessons: null },
      });

      const result = await trainingService.getLessons('organic_farming', 'hi');

      expect(result).toEqual([]);
    });
  });

  describe('getLesson', () => {
    it('should fetch lesson detail from API and store locally', async () => {
      const mockLesson = {
        id: '1',
        title: 'Detailed Lesson',
        transcript: 'Full transcript',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { lesson: mockLesson },
      });

      const result = await trainingService.getLesson('1', 'hi');

      expect(result).toEqual(mockLesson);
      expect(apiClient.get).toHaveBeenCalledWith('/training/lessons/1', {
        params: { language: 'hi' },
      });
      expect(mockContentManager.storeLesson).toHaveBeenCalledWith(mockLesson);
    });

    it('should fallback to local storage when API fails', async () => {
      const mockLocalLesson = { id: '1', title: 'Cached Detail' };

      (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockContentManager.getLesson.mockResolvedValue(mockLocalLesson as any);

      const result = await trainingService.getLesson('1', 'hi');

      expect(result).toEqual(mockLocalLesson);
      expect(mockContentManager.getLesson).toHaveBeenCalledWith('1', 'hi');
    });

    it('should return null when lesson not found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { lesson: null },
      });

      const result = await trainingService.getLesson('999', 'hi');

      expect(result).toBeNull();
    });
  });

  describe('markLessonComplete', () => {
    it('should mark lesson complete and return related lessons', async () => {
      const mockRelatedLessons = [
        { id: '2', title: 'Related 1' },
        { id: '3', title: 'Related 2' },
      ];

      mockContentManager.getRelatedLessons.mockResolvedValue(mockRelatedLessons as any);

      const result = await trainingService.markLessonComplete('user1', 'lesson1');

      expect(mockProgressTracker.markLessonComplete).toHaveBeenCalledWith('user1', 'lesson1');
      expect(mockContentManager.getRelatedLessons).toHaveBeenCalledWith('lesson1', 'hi');
      expect(result.relatedLessons).toEqual(mockRelatedLessons);
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress from tracker', async () => {
      const mockProgress = {
        userId: 'user1',
        completedLessons: ['1', '2', '3'],
        totalLessons: 20,
        categories: { pest_management: 2, irrigation: 1 },
        lastAccessedAt: new Date(),
      };

      mockProgressTracker.getUserProgress.mockResolvedValue(mockProgress);

      const result = await trainingService.getUserProgress('user1');

      expect(result).toEqual(mockProgress);
      expect(mockProgressTracker.getUserProgress).toHaveBeenCalledWith('user1');
    });
  });

  describe('searchLessons', () => {
    it('should search lessons using content manager', async () => {
      const mockResults = [
        { id: '1', title: 'Pest Control' },
        { id: '2', title: 'Pest Prevention' },
      ];

      mockContentManager.searchLessons.mockResolvedValue(mockResults as any);

      const result = await trainingService.searchLessons('pest', 'hi');

      expect(result).toEqual(mockResults);
      expect(mockContentManager.searchLessons).toHaveBeenCalledWith('pest', 'hi');
    });
  });

  describe('isAvailableOffline', () => {
    it('should check offline availability', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(true);

      const result = await trainingService.isAvailableOffline('lesson1');

      expect(result).toBe(true);
      expect(mockContentManager.isAvailableOffline).toHaveBeenCalledWith('lesson1');
    });

    it('should return false when not available offline', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);

      const result = await trainingService.isAvailableOffline('lesson999');

      expect(result).toBe(false);
    });
  });
});
