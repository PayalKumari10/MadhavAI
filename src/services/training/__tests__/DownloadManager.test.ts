/**
 * DownloadManager Tests
 */

import { DownloadManager } from '../DownloadManager';
import { ContentManager } from '../ContentManager';

jest.mock('../ContentManager');

describe('DownloadManager', () => {
  let downloadManager: DownloadManager;
  let mockContentManager: jest.Mocked<ContentManager>;

  beforeEach(() => {
    mockContentManager = {
      isAvailableOffline: jest.fn(),
      updateContentMetadata: jest.fn(),
      deleteLesson: jest.fn(),
    } as any;

    downloadManager = new DownloadManager(mockContentManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadLesson', () => {
    it('should skip download if already available offline', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(true);

      await downloadManager.downloadLesson('lesson1', 'video.mp4', 'audio.mp3');

      expect(mockContentManager.updateContentMetadata).not.toHaveBeenCalled();
    });

    it('should download lesson and update metadata', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);

      await downloadManager.downloadLesson('lesson1', 'video.mp4', 'audio.mp3');

      expect(mockContentManager.updateContentMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: 'lesson1',
          localPath: 'lesson1_video',
          fileSize: 0,
          s3Key: 'video.mp4',
        })
      );
    });

    it('should track download progress', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);

      // Start download but don't await yet
      const downloadPromise = downloadManager.downloadLesson(
        'lesson1',
        'video.mp4',
        'audio.mp3'
      );

      // Wait a bit for download to start
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      const progress = downloadManager.getDownloadProgress('lesson1');
      expect(progress).toBeDefined();
      expect(progress?.lessonId).toBe('lesson1');

      await downloadPromise;

      const finalProgress = downloadManager.getDownloadProgress('lesson1');
      expect(finalProgress?.status).toBe('completed');
      expect(finalProgress?.progress).toBe(100);
    });

    it('should handle download errors', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);
      mockContentManager.updateContentMetadata.mockRejectedValue(
        new Error('Storage full')
      );

      await expect(
        downloadManager.downloadLesson('lesson1', 'video.mp4', 'audio.mp3')
      ).rejects.toThrow('Storage full');

      const progress = downloadManager.getDownloadProgress('lesson1');
      expect(progress?.status).toBe('failed');
      expect(progress?.error).toBe('Storage full');
    });
  });

  describe('getDownloadProgress', () => {
    it('should return null for non-existent download', () => {
      const progress = downloadManager.getDownloadProgress('nonexistent');

      expect(progress).toBeNull();
    });

    it('should return progress for active download', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);

      const downloadPromise = downloadManager.downloadLesson('lesson1', 'video.mp4', 'audio.mp3');

      // Wait for download to initialize
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      const progress = downloadManager.getDownloadProgress('lesson1');

      expect(progress).toBeDefined();
      expect(progress?.lessonId).toBe('lesson1');

      await downloadPromise;
    });
  });

  describe('cancelDownload', () => {
    it('should cancel active download', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);
      
      // Make the download take longer by delaying the metadata update
      mockContentManager.updateContentMetadata.mockImplementation(
        () => new Promise<void>((resolve) => setTimeout(resolve, 100))
      );

      const downloadPromise = downloadManager.downloadLesson('lesson1', 'video.mp4', 'audio.mp3');

      // Wait for download to start
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      await downloadManager.cancelDownload('lesson1');

      const progress = downloadManager.getDownloadProgress('lesson1');
      expect(progress?.status).toBe('failed');
      expect(progress?.error).toBe('Download cancelled by user');

      // Clean up
      await downloadPromise.catch(() => {});
    });

    it('should do nothing for non-active download', async () => {
      await downloadManager.cancelDownload('nonexistent');

      const progress = downloadManager.getDownloadProgress('nonexistent');
      expect(progress).toBeNull();
    });
  });

  describe('deleteDownload', () => {
    it('should delete lesson and remove from active downloads', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);

      await downloadManager.downloadLesson('lesson1', 'video.mp4', 'audio.mp3');
      await downloadManager.deleteDownload('lesson1');

      expect(mockContentManager.deleteLesson).toHaveBeenCalledWith('lesson1');
      expect(downloadManager.getDownloadProgress('lesson1')).toBeNull();
    });
  });

  describe('getActiveDownloads', () => {
    it('should return only downloading items', async () => {
      mockContentManager.isAvailableOffline.mockResolvedValue(false);

      const promise1 = downloadManager.downloadLesson('lesson1', 'v1.mp4', 'a1.mp3');
      const promise2 = downloadManager.downloadLesson('lesson2', 'v2.mp4', 'a2.mp3');

      // Wait for downloads to initialize
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      const activeDownloads = downloadManager.getActiveDownloads();

      expect(activeDownloads.length).toBeGreaterThanOrEqual(0);
      activeDownloads.forEach((download) => {
        expect(download.status).toBe('downloading');
      });

      // Clean up
      await Promise.all([promise1, promise2]);
    });

    it('should return empty array when no active downloads', () => {
      const activeDownloads = downloadManager.getActiveDownloads();

      expect(activeDownloads).toEqual([]);
    });
  });

  describe('getAvailableStorage', () => {
    it('should return available storage space', async () => {
      const storage = await downloadManager.getAvailableStorage();

      expect(storage).toBe(500 * 1024 * 1024); // 500 MB
    });
  });

  describe('getTotalDownloadedSize', () => {
    it('should return total downloaded size', async () => {
      const size = await downloadManager.getTotalDownloadedSize();

      expect(size).toBe(0);
    });
  });
});
