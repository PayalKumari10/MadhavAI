/**
 * ContentVerification
 * Ensures only expert-reviewed content is displayed to users
 */

import { LessonDetail } from '../../types/training.types';

export interface VerificationStatus {
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  reviewNotes?: string;
}

export class ContentVerification {
  /**
   * Verify that content meets quality standards
   */
  async verifyContent(lesson: LessonDetail): Promise<VerificationStatus> {
    const checks = [
      this.checkDuration(lesson),
      this.checkLanguageSupport(lesson),
      this.checkVisualAids(lesson),
      this.checkTranscript(lesson),
      this.checkKeyPoints(lesson),
    ];

    const allPassed = checks.every((check) => check);

    return {
      verified: allPassed && lesson.verified,
      verifiedAt: allPassed ? new Date() : undefined,
      reviewNotes: allPassed ? 'All quality checks passed' : 'Some quality checks failed',
    };
  }

  /**
   * Check if lesson duration is within 3-5 minutes (180-300 seconds)
   */
  private checkDuration(lesson: LessonDetail): boolean {
    return lesson.duration >= 180 && lesson.duration <= 300;
  }

  /**
   * Check if lesson has proper language support
   */
  private checkLanguageSupport(lesson: LessonDetail): boolean {
    return (
      lesson.language !== undefined &&
      lesson.language.length > 0 &&
      lesson.audioUrl !== undefined &&
      lesson.audioUrl.length > 0
    );
  }

  /**
   * Check if lesson has visual aids for low-literacy users
   */
  private checkVisualAids(lesson: LessonDetail): boolean {
    return !!(lesson.visualAids && lesson.visualAids.length > 0);
  }

  /**
   * Check if lesson has a transcript
   */
  private checkTranscript(lesson: LessonDetail): boolean {
    return !!(lesson.transcript && lesson.transcript.length > 0);
  }

  /**
   * Check if lesson has key points
   */
  private checkKeyPoints(lesson: LessonDetail): boolean {
    return !!(lesson.keyPoints && lesson.keyPoints.length >= 3);
  }

  /**
   * Mark content as verified by an expert
   */
  async markAsVerified(
    _lessonId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<VerificationStatus> {
    return {
      verified: true,
      verifiedBy,
      verifiedAt: new Date(),
      reviewNotes: notes,
    };
  }

  /**
   * Check if content is from approved sources
   */
  isApprovedSource(source: string): boolean {
    const approvedSources = [
      'agricultural_university',
      'government_extension',
      'research_institute',
      'expert_farmer',
      'ngo_verified',
    ];
    return approvedSources.includes(source);
  }

  /**
   * Validate content metadata
   */
  validateMetadata(lesson: LessonDetail): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!lesson.title || lesson.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    if (!lesson.category) {
      errors.push('Category is required');
    }

    if (!lesson.difficulty) {
      errors.push('Difficulty level is required');
    }

    if (!lesson.videoUrl && !lesson.audioUrl) {
      errors.push('At least video or audio URL is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
