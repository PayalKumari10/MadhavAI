/**
 * ContentManager
 * Manages training content including lessons, downloads, and offline storage
 */

import {
  Lesson,
  LessonDetail,
  ContentMetadata,
  LessonCategory,
} from '../../types/training.types';
import { DatabaseService } from '../storage/DatabaseService';

export class ContentManager {
  private databaseService: DatabaseService;
  private readonly CONTENT_TABLE = 'training_content';
  private readonly METADATA_TABLE = 'content_metadata';

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Get all lessons for a specific category and language
   */
  async getLessons(
    category: LessonCategory,
    language: string
  ): Promise<Lesson[]> {
    const query = `
      SELECT * FROM ${this.CONTENT_TABLE}
      WHERE category = ? AND language = ? AND verified = 1
      ORDER BY difficulty, title
    `;
    return this.databaseService.query(query, [category, language]);
  }

  /**
   * Get detailed lesson information
   */
  async getLesson(
    lessonId: string,
    language: string
  ): Promise<LessonDetail | null> {
    const query = `
      SELECT * FROM ${this.CONTENT_TABLE}
      WHERE id = ? AND language = ?
    `;
    const results = await this.databaseService.query(query, [
      lessonId,
      language,
    ]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Store lesson content locally for offline access
   */
  async storeLesson(lesson: LessonDetail): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO ${this.CONTENT_TABLE}
      (id, title, category, duration, thumbnailUrl, difficulty, verified, language,
       videoUrl, audioUrl, transcript, keyPoints, relatedLessons, visualAids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.databaseService.execute(query, [
      lesson.id,
      lesson.title,
      lesson.category,
      lesson.duration,
      lesson.thumbnailUrl,
      lesson.difficulty,
      lesson.verified ? 1 : 0,
      lesson.language,
      lesson.videoUrl,
      lesson.audioUrl,
      lesson.transcript,
      JSON.stringify(lesson.keyPoints),
      JSON.stringify(lesson.relatedLessons),
      JSON.stringify(lesson.visualAids),
    ]);
  }

  /**
   * Get content metadata for offline storage management
   */
  async getContentMetadata(lessonId: string): Promise<ContentMetadata | null> {
    const query = `SELECT * FROM ${this.METADATA_TABLE} WHERE lessonId = ?`;
    const results = await this.databaseService.query(query, [lessonId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update content metadata after download
   */
  async updateContentMetadata(metadata: ContentMetadata): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO ${this.METADATA_TABLE}
      (lessonId, localPath, downloadedAt, fileSize, s3Key)
      VALUES (?, ?, ?, ?, ?)
    `;
    await this.databaseService.execute(query, [
      metadata.lessonId,
      metadata.localPath,
      metadata.downloadedAt?.toISOString(),
      metadata.fileSize,
      metadata.s3Key,
    ]);
  }

  /**
   * Check if lesson is available offline
   */
  async isAvailableOffline(lessonId: string): Promise<boolean> {
    const metadata = await this.getContentMetadata(lessonId);
    return metadata !== null && metadata.localPath !== undefined;
  }

  /**
   * Get all lessons by topic for organization
   */
  async getLessonsByTopic(
    topic: LessonCategory,
    language: string
  ): Promise<Lesson[]> {
    return this.getLessons(topic, language);
  }

  /**
   * Search lessons by keyword
   */
  async searchLessons(
    keyword: string,
    language: string
  ): Promise<Lesson[]> {
    const query = `
      SELECT * FROM ${this.CONTENT_TABLE}
      WHERE (title LIKE ? OR transcript LIKE ?) 
      AND language = ? AND verified = 1
      ORDER BY title
    `;
    const searchTerm = `%${keyword}%`;
    return this.databaseService.query(query, [
      searchTerm,
      searchTerm,
      language,
    ]);
  }

  /**
   * Get related lessons based on category
   */
  async getRelatedLessons(
    lessonId: string,
    language: string,
    limit: number = 5
  ): Promise<Lesson[]> {
    const lesson = await this.getLesson(lessonId, language);
    if (!lesson) return [];

    const query = `
      SELECT * FROM ${this.CONTENT_TABLE}
      WHERE category = ? AND language = ? AND id != ? AND verified = 1
      ORDER BY RANDOM()
      LIMIT ?
    `;
    return this.databaseService.query(query, [
      lesson.category,
      language,
      lessonId,
      limit,
    ]);
  }

  /**
   * Delete lesson content to free up storage
   */
  async deleteLesson(lessonId: string): Promise<void> {
    await this.databaseService.execute(
      `DELETE FROM ${this.CONTENT_TABLE} WHERE id = ?`,
      [lessonId]
    );
    await this.databaseService.execute(
      `DELETE FROM ${this.METADATA_TABLE} WHERE lessonId = ?`,
      [lessonId]
    );
  }
}
