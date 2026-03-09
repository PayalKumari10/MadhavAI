/**
 * Training API Lambda Handlers
 * Handles lesson retrieval and progress tracking
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { S3 } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();
const s3 = new S3();

// Environment variables with defaults
declare const process: { env: Record<string, string | undefined> };
const LESSONS_TABLE = process.env.LESSONS_TABLE || 'farmer-platform-lessons';
const PROGRESS_TABLE = process.env.PROGRESS_TABLE || 'farmer-platform-learning-progress';
const CONTENT_BUCKET = process.env.CONTENT_BUCKET || 'farmer-platform-training-content';

/**
 * Get lessons by category and language
 */
export async function getLessons(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const category = event.queryStringParameters?.category;
    const language = event.queryStringParameters?.language || 'hi';

    if (!category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Category is required' }),
      };
    }

    const params = {
      TableName: LESSONS_TABLE,
      IndexName: 'CategoryLanguageIndex',
      KeyConditionExpression: 'category = :category AND language = :language',
      FilterExpression: 'verified = :verified',
      ExpressionAttributeValues: {
        ':category': category,
        ':language': language,
        ':verified': true,
      },
    };

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        lessons: result.Items || [],
        count: result.Count || 0,
      }),
    };
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch lessons' }),
    };
  }
}

/**
 * Get lesson detail by ID
 */
export async function getLesson(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const lessonId = event.pathParameters?.lessonId;
    const language = event.queryStringParameters?.language || 'hi';

    if (!lessonId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lesson ID is required' }),
      };
    }

    const params = {
      TableName: LESSONS_TABLE,
      Key: {
        id: lessonId,
        language: language,
      },
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Lesson not found' }),
      };
    }

    // Generate presigned URLs for video/audio if needed
    const lesson = result.Item;
    if (lesson.videoUrl && lesson.videoUrl.startsWith('s3://')) {
      lesson.videoUrl = await generatePresignedUrl(lesson.videoUrl);
    }
    if (lesson.audioUrl && lesson.audioUrl.startsWith('s3://')) {
      lesson.audioUrl = await generatePresignedUrl(lesson.audioUrl);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ lesson }),
    };
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch lesson' }),
    };
  }
}

/**
 * Mark lesson as complete
 */
export async function markLessonComplete(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    const userId = body.userId;
    const lessonId = body.lessonId;

    if (!userId || !lessonId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId and lessonId are required' }),
      };
    }

    const params = {
      TableName: PROGRESS_TABLE,
      Item: {
        userId,
        lessonId,
        completedAt: new Date().toISOString(),
      },
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to mark lesson complete' }),
    };
  }
}

/**
 * Get user's learning progress
 */
export async function getUserProgress(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const params = {
      TableName: PROGRESS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };

    const result = await dynamodb.query(params).promise();
    const completedLessons = result.Items?.map((item) => item.lessonId) || [];

    // Get total lessons count
    const totalParams = {
      TableName: LESSONS_TABLE,
      FilterExpression: 'verified = :verified',
      ExpressionAttributeValues: {
        ':verified': true,
      },
      Select: 'COUNT',
    };

    const totalResult = await dynamodb.scan(totalParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        userId,
        completedLessons,
        totalLessons: totalResult.Count || 0,
        completionPercentage: ((completedLessons.length / (totalResult.Count || 1)) * 100).toFixed(
          2
        ),
      }),
    };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch user progress' }),
    };
  }
}

/**
 * Search lessons by keyword
 */
export async function searchLessons(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const keyword = event.queryStringParameters?.keyword;
    const language = event.queryStringParameters?.language || 'hi';

    if (!keyword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Keyword is required' }),
      };
    }

    const params = {
      TableName: LESSONS_TABLE,
      FilterExpression:
        'contains(title, :keyword) AND language = :language AND verified = :verified',
      ExpressionAttributeValues: {
        ':keyword': keyword,
        ':language': language,
        ':verified': true,
      },
    };

    const result = await dynamodb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        lessons: result.Items || [],
        count: result.Count || 0,
      }),
    };
  } catch (error) {
    console.error('Error searching lessons:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to search lessons' }),
    };
  }
}

/**
 * Generate presigned URL for S3 content
 */
async function generatePresignedUrl(s3Path: string): Promise<string> {
  const key = s3Path.replace('s3://', '').replace(`${CONTENT_BUCKET}/`, '');

  const params = {
    Bucket: CONTENT_BUCKET,
    Key: key,
    Expires: 3600, // 1 hour
  };

  return s3.getSignedUrl('getObject', params);
}
