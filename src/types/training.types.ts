/**
 * Training Module Types
 * Defines interfaces for training content, lessons, and learning progress
 */

export interface Lesson {
  id: string;
  title: string;
  category: string;
  duration: number; // in seconds (180-300 for 3-5 minutes)
  thumbnailUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  verified: boolean; // expert-reviewed content only
  language: string;
}

export interface LessonDetail extends Lesson {
  videoUrl: string;
  audioUrl: string;
  transcript: string;
  keyPoints: string[];
  relatedLessons: string[];
  visualAids: string[]; // URLs to images/diagrams for low-literacy users
}

export interface LearningProgress {
  userId: string;
  completedLessons: string[];
  totalLessons: number;
  categories: { [category: string]: number }; // completed count per category
  lastAccessedAt: Date;
}

export interface LessonTranslation {
  language: string;
  title: string;
  transcript: string;
  keyPoints: string[];
  audioUrl: string; // voice narration in regional language
}

export interface ContentMetadata {
  lessonId: string;
  localPath?: string; // for offline storage
  downloadedAt?: Date;
  fileSize: number;
  s3Key?: string;
}

export interface DownloadProgress {
  lessonId: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

export const LESSON_CATEGORIES = [
  'pest_management',
  'irrigation',
  'organic_farming',
  'soil_health',
  'crop_rotation',
  'fertilizer_management',
  'seed_selection',
  'weather_adaptation',
  'market_strategies',
  'government_schemes',
] as const;

export type LessonCategory = typeof LESSON_CATEGORIES[number];
