/**
 * Database Service
 * Provides SQLite database operations for offline storage
 */

// @ts-ignore - SQLite module may not have types
import SQLite from 'react-native-sqlite-storage';
import { logger } from '../../utils/logger';

SQLite.enablePromise(true);

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName: string;

  constructor(dbName: string = 'farmer_platform.db') {
    this.dbName = dbName;
  }

  /**
   * Open database connection
   */
  async open(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        location: 'default',
      });
      logger.info(`Database ${this.dbName} opened successfully`);
    } catch (error) {
      logger.error('Failed to open database', error);
      throw new Error('Failed to open database');
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('Database closed');
    }
  }

  /**
   * Execute SQL query
   */
  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    try {
      await this.db.executeSql(sql, params);
    } catch (error) {
      logger.error('Failed to execute SQL', { sql, error });
      throw error;
    }
  }

  /**
   * Query database and return results
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    try {
      const [results] = await this.db.executeSql(sql, params);
      const rows: T[] = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        rows.push(results.rows.item(i));
      }
      
      return rows;
    } catch (error) {
      logger.error('Failed to query database', { sql, error });
      throw error;
    }
  }

  /**
   * Execute multiple SQL statements in a transaction
   */
  async transaction(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    try {
      await this.db.transaction(async (tx: any) => {
        for (const stmt of statements) {
          await tx.executeSql(stmt.sql, stmt.params || []);
        }
      });
    } catch (error) {
      logger.error('Transaction failed', error);
      throw error;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
