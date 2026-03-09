/**
 * DownloadManager
 * Manages downloading and storing training content for offline access
 */

import { DownloadProgress, ContentMetadata } from '../../types/training.types';
import { ContentManager } from './ContentManager';

export class DownloadManager {
  private contentManager: ContentManager;
  private activeDownloads: Map<string, DownloadProgress>;

  constructor(contentManager: ContentManager) {
    this.contentManager = contentManager;
    this.activeDownloads = new Map();
  }

  /**
   * Download lesson content for offline viewing
   */
  async downloadLesson(lessonId: string, videoUrl: string, audioUrl: string): Promise<void> {
    // Check if already downloaded
    const isAvailable = await this.contentManager.isAvailableOffline(lessonId);
    if (isAvailable) {
      return;
    }

    // Initialize download progress
    this.activeDownloads.set(lessonId, {
      lessonId,
      progress: 0,
      status: 'downloading',
    });

    try {
      // Download video and audio files
      // In a real implementation, this would use React Native's file system
      const localVideoPath = await this.downloadFile(videoUrl, lessonId, 'video');
      await this.downloadFile(audioUrl, lessonId, 'audio');

      // Calculate total file size
      const fileSize = 0; // Would be calculated from actual downloads

      // Store metadata
      const metadata: ContentMetadata = {
        lessonId,
        localPath: localVideoPath,
        downloadedAt: new Date(),
        fileSize,
        s3Key: videoUrl,
      };

      await this.contentManager.updateContentMetadata(metadata);

      // Update progress
      this.activeDownloads.set(lessonId, {
        lessonId,
        progress: 100,
        status: 'completed',
      });
    } catch (error) {
      this.activeDownloads.set(lessonId, {
        lessonId,
        progress: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Download failed',
      });
      throw error;
    }
  }

  /**
   * Download a single file
   */
  private async downloadFile(
    _url: string,
    lessonId: string,
    type: 'video' | 'audio'
  ): Promise<string> {
    // Placeholder for actual file download implementation
    // In production, would use react-native-fs or similar
    const localPath = `${lessonId}_${type}`;
    return localPath;
  }

  /**
   * Get download progress for a lesson
   */
  getDownloadProgress(lessonId: string): DownloadProgress | null {
    return this.activeDownloads.get(lessonId) || null;
  }

  /**
   * Cancel an active download
   */
  async cancelDownload(lessonId: string): Promise<void> {
    const progress = this.activeDownloads.get(lessonId);
    if (progress && progress.status === 'downloading') {
      this.activeDownloads.set(lessonId, {
        ...progress,
        status: 'failed',
        error: 'Download cancelled by user',
      });
    }
  }

  /**
   * Delete downloaded content to free up space
   */
  async deleteDownload(lessonId: string): Promise<void> {
    await this.contentManager.deleteLesson(lessonId);
    this.activeDownloads.delete(lessonId);
  }

  /**
   * Get all active downloads
   */
  getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.activeDownloads.values()).filter((d) => d.status === 'downloading');
  }

  /**
   * Check available storage space
   */
  async getAvailableStorage(): Promise<number> {
    // Placeholder - would use react-native-fs to check actual storage
    return 500 * 1024 * 1024; // 500 MB
  }

  /**
   * Calculate total size of downloaded content
   */
  async getTotalDownloadedSize(): Promise<number> {
    // Placeholder - would query actual file sizes
    return 0;
  }
}
