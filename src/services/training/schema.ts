/**
 * Training Module Database Schema
 * DynamoDB and SQLite schema definitions
 */

export const TRAINING_TABLES = {
  // Local SQLite schema for offline storage
  sqlite: {
    training_content: `
      CREATE TABLE IF NOT EXISTS training_content (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        duration INTEGER NOT NULL,
        thumbnailUrl TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 1,
        language TEXT NOT NULL,
        videoUrl TEXT NOT NULL,
        audioUrl TEXT NOT NULL,
        transcript TEXT NOT NULL,
        keyPoints TEXT NOT NULL,
        relatedLessons TEXT NOT NULL,
        visualAids TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `,
    content_metadata: `
      CREATE TABLE IF NOT EXISTS content_metadata (
        lessonId TEXT PRIMARY KEY,
        localPath TEXT,
        downloadedAt TEXT,
        fileSize INTEGER NOT NULL,
        s3Key TEXT,
        FOREIGN KEY (lessonId) REFERENCES training_content(id)
      )
    `,
    learning_progress: `
      CREATE TABLE IF NOT EXISTS learning_progress (
        userId TEXT NOT NULL,
        lessonId TEXT NOT NULL,
        completedAt TEXT NOT NULL,
        PRIMARY KEY (userId, lessonId),
        FOREIGN KEY (lessonId) REFERENCES training_content(id)
      )
    `,
    progress_summary: `
      CREATE TABLE IF NOT EXISTS progress_summary (
        userId TEXT PRIMARY KEY,
        totalCompleted INTEGER DEFAULT 0,
        lastAccessedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        categories TEXT DEFAULT '{}'
      )
    `,
  },

  // DynamoDB schema definitions
  dynamodb: {
    lessons: {
      TableName: 'farmer-platform-lessons',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'language', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'language', AttributeType: 'S' },
        { AttributeName: 'category', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CategoryLanguageIndex',
          KeySchema: [
            { AttributeName: 'category', KeyType: 'HASH' },
            { AttributeName: 'language', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    },
    progress: {
      TableName: 'farmer-platform-learning-progress',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'lessonId', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'lessonId', AttributeType: 'S' },
      ],
    },
  },
};

// S3 bucket structure for training content
export const S3_STRUCTURE = {
  bucket: 'farmer-platform-training-content',
  folders: {
    videos: 'videos/{language}/{category}/{lessonId}.mp4',
    audio: 'audio/{language}/{category}/{lessonId}.mp3',
    thumbnails: 'thumbnails/{lessonId}.jpg',
    visualAids: 'visual-aids/{lessonId}/{index}.jpg',
  },
};

/**
 * Initialize local database tables
 */
export async function initializeTrainingTables(db: any): Promise<void> {
  await db.execute(TRAINING_TABLES.sqlite.training_content);
  await db.execute(TRAINING_TABLES.sqlite.content_metadata);
  await db.execute(TRAINING_TABLES.sqlite.learning_progress);
  await db.execute(TRAINING_TABLES.sqlite.progress_summary);

  // Create indexes for better query performance
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_category_language 
    ON training_content(category, language)
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_content_verified 
    ON training_content(verified)
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_progress_user 
    ON learning_progress(userId)
  `);
}
