/**
 * Session Manager
 * Handles user session management and token validation
 * Requirements: 1.2, 15.6
 */

import { SessionData, AuthToken } from '../../types/auth.types';
import { SESSION_TIMEOUT_DAYS } from '../../config/constants';
import { logger } from '../../utils/logger';

class SessionManager {
  private sessions: Map<string, SessionData> = new Map();

  /**
   * Generate a secure session token
   * @returns Random session token
   */
  private generateToken(): string {
    // Generate a random token (in production, use JWT or similar)
    const array = new Uint8Array(32);
    // Check if crypto API is available (works in both browser and React Native)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (
      typeof (globalThis as any).crypto !== 'undefined' &&
      (globalThis as any).crypto.getRandomValues
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).crypto.getRandomValues(array);
      return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Create a new session for authenticated user
   * @param userId - User ID
   * @param deviceId - Device identifier
   * @returns Auth token with session information
   */
  createSession(userId: string, deviceId: string): AuthToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_DAYS * 24 * 60 * 60 * 1000);
    const token = this.generateToken();
    const sessionId = `session_${userId}_${Date.now()}`;

    const sessionData: SessionData = {
      sessionId,
      userId,
      authToken: token,
      deviceId,
      expiresAt,
      createdAt: now,
      lastActivityAt: now,
    };

    this.sessions.set(token, sessionData);

    logger.info(`Session created for user ${userId}`);

    return {
      token,
      userId,
      expiresAt,
    };
  }

  /**
   * Validate session token and check expiration
   * Property 57: Session Timeout - Auto-logout after 30 days inactivity
   * @param token - Session token to validate
   * @returns Session data if valid, null otherwise
   */
  validateSession(token: string): SessionData | null {
    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    const now = new Date();

    // Check if session is expired
    if (now > session.expiresAt) {
      this.sessions.delete(token);
      logger.info(`Session expired for user ${session.userId}`);
      return null;
    }

    // Check for inactivity timeout (30 days)
    const inactivityMs = now.getTime() - session.lastActivityAt.getTime();
    const inactivityDays = inactivityMs / (24 * 60 * 60 * 1000);

    if (inactivityDays >= SESSION_TIMEOUT_DAYS) {
      this.sessions.delete(token);
      logger.info(`Session timed out due to inactivity for user ${session.userId}`);
      return null;
    }

    // Update last activity time
    session.lastActivityAt = now;
    this.sessions.set(token, session);

    return session;
  }

  /**
   * Refresh session token
   * @param oldToken - Current session token
   * @returns New auth token if successful, null otherwise
   */
  refreshSession(oldToken: string): AuthToken | null {
    const session = this.validateSession(oldToken);

    if (!session) {
      return null;
    }

    // Remove old session
    this.sessions.delete(oldToken);

    // Create new session
    const newToken = this.createSession(session.userId, session.deviceId);

    logger.info(`Session refreshed for user ${session.userId}`);

    return newToken;
  }

  /**
   * Invalidate session (logout)
   * @param token - Session token to invalidate
   */
  invalidateSession(token: string): void {
    const session = this.sessions.get(token);

    if (session) {
      this.sessions.delete(token);
      logger.info(`Session invalidated for user ${session.userId}`);
    }
  }

  /**
   * Get all active sessions for a user
   * @param userId - User ID
   * @returns Array of active sessions
   */
  getUserSessions(userId: string): SessionData[] {
    const userSessions: SessionData[] = [];

    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }

    return userSessions;
  }

  /**
   * Invalidate all sessions for a user
   * @param userId - User ID
   */
  invalidateAllUserSessions(userId: string): void {
    const tokensToDelete: string[] = [];

    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        tokensToDelete.push(token);
      }
    }

    tokensToDelete.forEach((token) => this.sessions.delete(token));

    logger.info(`All sessions invalidated for user ${userId}`);
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }
}

export const sessionManager = new SessionManager();
