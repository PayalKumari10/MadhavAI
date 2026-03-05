/**
 * ContentVerification Tests
 */

import { ContentVerification } from '../ContentVerification';
import { LessonDetail } from '../../../types/training.types';

describe('ContentVerification', () => {
  let contentVerification: ContentVerification;

  beforeEach(() => {
    contentVerification = new ContentVerification();
  });

  describe('verifyContent', () => {
    it('should verify valid lesson content', async () => {
      const validLesson: LessonDetail = {
        id: '1',
        title: 'Valid Lesson',
        category: 'pest_management',
        duration: 240, // 4 minutes
        thumbnailUrl: 'thumb.jpg',
        difficulty: 'beginner',
        verified: true,
        language: 'hi',
        videoUrl: 'video.mp4',
        audioUrl: 'audio.mp3',
        transcript: 'This is a valid transcript',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        relatedLessons: ['2'],
        visualAids: ['aid1.jpg', 'aid2.jpg'],
      };

      const result = await contentVerification.verifyContent(validLesson);

      expect(result.verified).toBe(true);
      expect(result.reviewNotes).toBe('All quality checks passed');
      expect(result.verifiedAt).toBeDefined();
    });

    it('should fail verification for lesson with invalid duration', async () => {
      const invalidLesson: LessonDetail = {
        id: '1',
        duration: 120, // Too short (2 minutes)
        verified: true,
        language: 'hi',
        audioUrl: 'audio.mp3',
        transcript: 'Transcript',
        keyPoints: ['P1', 'P2', 'P3'],
        visualAids: ['aid.jpg'],
      } as LessonDetail;

      const result = await contentVerification.verifyContent(invalidLesson);

      expect(result.verified).toBe(false);
      expect(result.reviewNotes).toBe('Some quality checks failed');
    });

    it('should fail verification for lesson without audio', async () => {
      const invalidLesson: LessonDetail = {
        id: '1',
        duration: 240,
        verified: true,
        language: 'hi',
        audioUrl: '', // Missing audio
        transcript: 'Transcript',
        keyPoints: ['P1', 'P2', 'P3'],
        visualAids: ['aid.jpg'],
      } as LessonDetail;

      const result = await contentVerification.verifyContent(invalidLesson);

      expect(result.verified).toBe(false);
    });

    it('should fail verification for lesson without visual aids', async () => {
      const invalidLesson = {
        id: '1',
        duration: 240,
        verified: true,
        language: 'hi',
        audioUrl: 'audio.mp3',
        transcript: 'Transcript',
        keyPoints: ['P1', 'P2', 'P3'],
        visualAids: [], // No visual aids
      } as unknown as LessonDetail;

      const result = await contentVerification.verifyContent(invalidLesson);

      expect(result.verified).toBe(false);
    });

    it('should fail verification for lesson with insufficient key points', async () => {
      const invalidLesson: LessonDetail = {
        id: '1',
        duration: 240,
        verified: true,
        language: 'hi',
        audioUrl: 'audio.mp3',
        transcript: 'Transcript',
        keyPoints: ['P1', 'P2'], // Only 2 key points
        visualAids: ['aid.jpg'],
      } as LessonDetail;

      const result = await contentVerification.verifyContent(invalidLesson);

      expect(result.verified).toBe(false);
    });
  });

  describe('markAsVerified', () => {
    it('should mark content as verified by expert', async () => {
      const result = await contentVerification.markAsVerified(
        'lesson1',
        'expert@example.com',
        'Reviewed and approved'
      );

      expect(result.verified).toBe(true);
      expect(result.verifiedBy).toBe('expert@example.com');
      expect(result.reviewNotes).toBe('Reviewed and approved');
      expect(result.verifiedAt).toBeDefined();
    });
  });

  describe('isApprovedSource', () => {
    it('should approve valid sources', () => {
      expect(contentVerification.isApprovedSource('agricultural_university')).toBe(true);
      expect(contentVerification.isApprovedSource('government_extension')).toBe(true);
      expect(contentVerification.isApprovedSource('research_institute')).toBe(true);
      expect(contentVerification.isApprovedSource('expert_farmer')).toBe(true);
      expect(contentVerification.isApprovedSource('ngo_verified')).toBe(true);
    });

    it('should reject invalid sources', () => {
      expect(contentVerification.isApprovedSource('random_blog')).toBe(false);
      expect(contentVerification.isApprovedSource('unknown_source')).toBe(false);
    });
  });

  describe('validateMetadata', () => {
    it('should validate complete metadata', () => {
      const lesson: LessonDetail = {
        id: '1',
        title: 'Complete Lesson',
        category: 'irrigation',
        difficulty: 'beginner',
        videoUrl: 'video.mp4',
        audioUrl: 'audio.mp3',
      } as LessonDetail;

      const result = contentVerification.validateMetadata(lesson);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing title', () => {
      const lesson: LessonDetail = {
        id: '1',
        title: 'Bad', // Too short
        category: 'irrigation',
        difficulty: 'beginner',
        videoUrl: 'video.mp4',
      } as LessonDetail;

      const result = contentVerification.validateMetadata(lesson);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be at least 5 characters');
    });

    it('should detect missing category', () => {
      const lesson: LessonDetail = {
        id: '1',
        title: 'Valid Title',
        category: '' as any,
        difficulty: 'beginner',
        videoUrl: 'video.mp4',
      } as LessonDetail;

      const result = contentVerification.validateMetadata(lesson);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Category is required');
    });

    it('should detect missing media URLs', () => {
      const lesson: LessonDetail = {
        id: '1',
        title: 'Valid Title',
        category: 'irrigation',
        difficulty: 'beginner',
        videoUrl: '',
        audioUrl: '',
      } as LessonDetail;

      const result = contentVerification.validateMetadata(lesson);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least video or audio URL is required');
    });
  });
});
