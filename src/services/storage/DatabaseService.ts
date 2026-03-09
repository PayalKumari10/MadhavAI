/**
 * Database Service
 * Provides in-memory database operations for offline storage
 * Note: This is a simplified implementation for demo purposes
 * In production, use react-native-sqlite-storage or similar
 */

import { logger } from '../../utils/logger';

export class DatabaseService {
  private store: Map<string, any[]> = new Map();
  private readonly dbName: string;

  constructor(dbName: string = 'farmer_platform.db') {
    this.dbName = dbName;
    this.initializeTables();
  }

  /**
   * Initialize in-memory tables
   */
  private initializeTables(): void {
    this.store.set('crop_plans', []);
    this.store.set('recommendations', []);
    this.store.set('alerts', []);
    this.store.set('user_profiles', []);
    logger.info(`In-memory database ${this.dbName} initialized`);
  }

  /**
   * Open database connection (no-op for in-memory)
   */
  async open(): Promise<void> {
    logger.info(`Database ${this.dbName} opened successfully`);
  }

  /**
   * Close database connection (no-op for in-memory)
   */
  async close(): Promise<void> {
    logger.info('Database closed');
  }

  /**
   * Execute SQL query (simplified for demo)
   */
  async execute(sql: string, params: any[] = []): Promise<void> {
    logger.info('Execute SQL', { sql, params });
    // In a real implementation, parse and execute SQL
  }

  /**
   * Query database and return results
   * Simplified implementation that returns empty arrays
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    logger.info('Query SQL', { sql, params });

    // Simple table name extraction from SQL
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const data = this.store.get(tableName) || [];

      // Apply simple WHERE filtering if userId is in params
      if (params.length > 0 && sql.includes('userId')) {
        return data.filter((row: any) => row.userId === params[0]) as T[];
      }

      return data as T[];
    }

    return [];
  }

  /**
   * Execute multiple SQL statements in a transaction
   */
  async transaction(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
    logger.info('Transaction', { statements });
    for (const stmt of statements) {
      await this.execute(stmt.sql, stmt.params || []);
    }
  }

  /**
   * Helper method to insert data directly (for demo purposes)
   */
  async insert(tableName: string, data: any): Promise<void> {
    const table = this.store.get(tableName) || [];
    table.push(data);
    this.store.set(tableName, table);
  }

  /**
   * Helper method to get all data from a table (for demo purposes)
   */
  async getAll<T = any>(tableName: string): Promise<T[]> {
    return (this.store.get(tableName) || []) as T[];
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
