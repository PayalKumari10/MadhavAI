/**
 * ContentManager Tests
 */

import { ContentManager } from '../ContentManager';
import { DatabaseService } from '../../storage/DatabaseService';
import { LessonDetail, LessonCategory } from '../../../types/training.types';

// Mock DatabaseService
jest.mock('../../storage/DatabaseService');

describe('ContentManager', () => {
  let contentManager: ContentManager;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = {
      query: jest.fn(),
      execute: jest.fn(),
    } as any;
    contentManager = new ContentManager(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLessons', () => {
    it('should retrieve lessons by category and language', async () => {
      const mockLessons = [
        { id: '1', title: 'Pest Control', category: 'pest_management', language: 'hi' },
        { id: '2', title: 'Organic Methods', category: 'pest_management', language: 'hi' },
      ];

      mockDatabaseService.query.mockResolvedValue(mockLessons);

      const result = await contentManager.getLessons('pest_management' as LessonCategory, 'hi');

      expect(result).toEqual(mockLessons);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE category = ? AND language = ? AND verified = 1'),
        ['pest_management', 'hi']
      );
    });

    it('should return empty array when no lessons found', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await contentManager.getLessons('irrigation' as LessonCategory, 'ta');

      expect(result).toEqual([]);
    });
  });

  describe('getLesson', () => {
    it('should retrieve lesson detail by ID and language', async () => {
      const mockLesson: LessonDetail = {
        id: '1',
        title: 'Pest Control Basics',
        category: 'pest_management',
        duration: 240,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        difficulty: 'beginner',
        verified: true,
        language: 'hi',
        videoUrl: 'https://example.com/video.mp4',
        audioUrl: 'https://example.com/audio.mp3',
        transcript: 'Lesson transcript...',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        relatedLessons: ['2', '3'],
        visualAids: ['https://example.com/aid1.jpg'],
      };

      mockDatabaseService.query.mockResolvedValue([mockLesson]);

      const result = await contentManager.getLesson('1', 'hi');

      expect(result).toEqual(mockLesson);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND language = ?'),
        ['1', 'hi']
      );
    });

    it('should return null when lesson not found', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await contentManager.getLesson('999', 'hi');

      expect(result).toBeNull();
    });
  });

  describe('storeLesson', () => {
    it('should store lesson with all fields', async () => {
      const lesson: LessonDetail = {
        id: '1',
        title: 'Test Lesson',
        category: 'irrigation',
        duration: 180,
        thumbnailUrl: 'thumb.jpg',
        difficulty: 'intermediate',
        verified: true,
        language: 'hi',
        videoUrl: 'video.mp4',
        audioUrl: 'audio.mp3',
        transcript: 'Transcript',
        keyPoints: ['Key 1', 'Key 2', 'Key 3'],
        relatedLessons: ['2'],
        visualAids: ['aid.jpg'],
      };

      await contentManager.storeLesson(lesson);

      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO training_content'),
        expect.arrayContaining([
          '1',
          'Test Lesson',
          'irrigation',
          180,
          'thumb.jpg',
          'intermediate',
          1,
          'hi',
          'video.mp4',
          'audio.mp3',
          'Transcript',
          JSON.stringify(['Key 1', 'Key 2', 'Key 3']),
          JSON.stringify(['2']),
          JSON.stringify(['aid.jpg']),
        ])
      );
    });
  });

  describe('searchLessons', () => {
    it('should search lessons by keyword', async () => {
      const mockResults = [
        { id: '1', title: 'Organic Pest Control', category: 'pest_management' },
        { id: '2', title: 'Pest Prevention', category: 'pest_management' },
      ];

      mockDatabaseService.query.mockResolvedValue(mockResults);

      const result = await contentManager.searchLessons('pest', 'hi');

      expect(result).toEqual(mockResults);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('title LIKE ? OR transcript LIKE ?'),
        ['%pest%', '%pest%', 'hi']
      );
    });
  });

  describe('getRelatedLessons', () => {
    it('should get related lessons from same category', async () => {
      const mainLesson: LessonDetail = {
        id: '1',
        category: 'pest_management',
        language: 'hi',
      } as LessonDetail;

      const relatedLessons = [
        { id: '2', title: 'Related 1', category: 'pest_management' },
        { id: '3', title: 'Related 2', category: 'pest_management' },
      ];

      mockDatabaseService.query
        .mockResolvedValueOnce([mainLesson])
        .mockResolvedValueOnce(relatedLessons);

      const result = await contentManager.getRelatedLessons('1', 'hi', 5);

      expect(result).toEqual(relatedLessons);
      expect(mockDatabaseService.query).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when main lesson not found', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await contentManager.getRelatedLessons('999', 'hi');

      expect(result).toEqual([]);
    });
  });

  describe('isAvailableOffline', () => {
    it('should return true when lesson has metadata', async () => {
      mockDatabaseService.query.mockResolvedValue([
        { lessonId: '1', localPath: '/path/to/lesson' },
      ]);

      const result = await contentManager.isAvailableOffline('1');

      expect(result).toBe(true);
    });

    it('should return false when lesson has no metadata', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await contentManager.isAvailableOffline('999');

      expect(result).toBe(false);
    });
  });

  describe('deleteLesson', () => {
    it('should delete lesson and metadata', async () => {
      await contentManager.deleteLesson('1');

      expect(mockDatabaseService.execute).toHaveBeenCalledTimes(2);
      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM training_content WHERE id = ?'),
        ['1']
      );
      expect(mockDatabaseService.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM content_metadata WHERE lessonId = ?'),
        ['1']
      );
    });
  });
});
