/**
 * ProgressTracker
 * Tracks user learning progress and manages completion status
 */

import { LearningProgress } from '../../types/training.types';
import { DatabaseService } from '../storage/DatabaseService';

export class ProgressTracker {
  private databaseService: DatabaseService;
  private readonly PROGRESS_TABLE = 'learning_progress';
  private readonly SUMMARY_TABLE = 'progress_summary';

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Mark a lesson as completed
   */
  async markLessonComplete(userId: string, lessonId: string): Promise<void> {
    const now = new Date().toISOString();

    // Insert completion record
    const insertQuery = `
      INSERT OR IGNORE INTO ${this.PROGRESS_TABLE}
      (userId, lessonId, completedAt)
      VALUES (?, ?, ?)
    `;
    await this.databaseService.execute(insertQuery, [userId, lessonId, now]);

    // Update summary
    await this.updateProgressSummary(userId);
  }

  /**
   * Check if a lesson is completed
   */
  async isLessonComplete(userId: string, lessonId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM ${this.PROGRESS_TABLE}
      WHERE userId = ? AND lessonId = ?
    `;
    const results = await this.databaseService.query(query, [userId, lessonId]);
    return results[0]?.count > 0;
  }

  /**
   * Get user's overall learning progress
   */
  async getUserProgress(userId: string): Promise<LearningProgress> {
    // Get completed lessons
    const completedQuery = `
      SELECT lessonId FROM ${this.PROGRESS_TABLE}
      WHERE userId = ?
    `;
    const completed = await this.databaseService.query(completedQuery, [userId]);
    const completedLessons = completed.map((row: any) => row.lessonId);

    // Get total lessons count
    const totalQuery = `
      SELECT COUNT(*) as count FROM training_content
      WHERE verified = 1
    `;
    const totalResult = await this.databaseService.query(totalQuery, []);
    const totalLessons = totalResult[0]?.count || 0;

    // Get category breakdown
    const categoryQuery = `
      SELECT c.category, COUNT(*) as count
      FROM ${this.PROGRESS_TABLE} p
      JOIN training_content c ON p.lessonId = c.id
      WHERE p.userId = ?
      GROUP BY c.category
    `;
    const categoryResults = await this.databaseService.query(categoryQuery, [userId]);
    const categories: { [key: string]: number } = {};
    categoryResults.forEach((row: any) => {
      categories[row.category] = row.count;
    });

    // Get last accessed time
    const summaryQuery = `
      SELECT lastAccessedAt FROM ${this.SUMMARY_TABLE}
      WHERE userId = ?
    `;
    const summaryResult = await this.databaseService.query(summaryQuery, [userId]);
    const lastAccessedAt = summaryResult[0]?.lastAccessedAt
      ? new Date(summaryResult[0].lastAccessedAt)
      : new Date();

    return {
      userId,
      completedLessons,
      totalLessons,
      categories,
      lastAccessedAt,
    };
  }

  /**
   * Get completed lessons for a specific category
   */
  async getCompletedLessonsByCategory(userId: string, category: string): Promise<string[]> {
    const query = `
      SELECT p.lessonId
      FROM ${this.PROGRESS_TABLE} p
      JOIN training_content c ON p.lessonId = c.id
      WHERE p.userId = ? AND c.category = ?
    `;
    const results = await this.databaseService.query(query, [userId, category]);
    return results.map((row: any) => row.lessonId);
  }

  /**
   * Get completion percentage for a category
   */
  async getCategoryProgress(userId: string, category: string): Promise<number> {
    const completedQuery = `
      SELECT COUNT(*) as count
      FROM ${this.PROGRESS_TABLE} p
      JOIN training_content c ON p.lessonId = c.id
      WHERE p.userId = ? AND c.category = ?
    `;
    const completedResult = await this.databaseService.query(completedQuery, [userId, category]);
    const completed = completedResult[0]?.count || 0;

    const totalQuery = `
      SELECT COUNT(*) as count
      FROM training_content
      WHERE category = ? AND verified = 1
    `;
    const totalResult = await this.databaseService.query(totalQuery, [category]);
    const total = totalResult[0]?.count || 1;

    return (completed / total) * 100;
  }

  /**
   * Update progress summary for efficient queries
   */
  private async updateProgressSummary(userId: string): Promise<void> {
    const progress = await this.getUserProgress(userId);

    const query = `
      INSERT OR REPLACE INTO ${this.SUMMARY_TABLE}
      (userId, totalCompleted, lastAccessedAt, categories)
      VALUES (?, ?, ?, ?)
    `;
    await this.databaseService.execute(query, [
      userId,
      progress.completedLessons.length,
      new Date().toISOString(),
      JSON.stringify(progress.categories),
    ]);
  }

  /**
   * Reset progress for a user (for testing or user request)
   */
  async resetProgress(userId: string): Promise<void> {
    await this.databaseService.execute(`DELETE FROM ${this.PROGRESS_TABLE} WHERE userId = ?`, [
      userId,
    ]);
    await this.databaseService.execute(`DELETE FROM ${this.SUMMARY_TABLE} WHERE userId = ?`, [
      userId,
    ]);
  }

  /**
   * Get recently completed lessons
   */
  async getRecentlyCompleted(
    userId: string,
    limit: number = 10
  ): Promise<Array<{ lessonId: string; completedAt: Date }>> {
    const query = `
      SELECT lessonId, completedAt
      FROM ${this.PROGRESS_TABLE}
      WHERE userId = ?
      ORDER BY completedAt DESC
      LIMIT ?
    `;
    const results = await this.databaseService.query(query, [userId, limit]);
    return results.map((row: any) => ({
      lessonId: row.lessonId,
      completedAt: new Date(row.completedAt),
    }));
  }
}
