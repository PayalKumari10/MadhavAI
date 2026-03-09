/**
 * Encrypted Storage Service
 * Provides AES-256 encrypted local storage for sensitive data
 * Requirements: 15.1 - Local data encryption
 */

import EncryptedStorageLib from 'react-native-encrypted-storage';
import { logger } from '../../utils/logger';

class EncryptedStorageService {
  /**
   * Store encrypted data
   * Property 53: Local Data Encryption - AES-256 encryption
   * @param key - Storage key
   * @param value - Data to store (will be JSON stringified)
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await EncryptedStorageLib.setItem(key, jsonValue);
      logger.debug(`Encrypted data stored for key: ${key}`);
    } catch (error) {
      logger.error(`Failed to store encrypted data for key: ${key}`, error);
      throw new Error('Failed to store encrypted data');
    }
  }

  /**
   * Retrieve encrypted data
   * @param key - Storage key
   * @returns Decrypted and parsed data, or null if not found
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await EncryptedStorageLib.getItem(key);

      if (jsonValue === null || jsonValue === undefined) {
        return null;
      }

      return JSON.parse(jsonValue) as T;
    } catch (error) {
      logger.error(`Failed to retrieve encrypted data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove encrypted data
   * @param key - Storage key
   */
  async removeItem(key: string): Promise<void> {
    try {
      await EncryptedStorageLib.removeItem(key);
      logger.debug(`Encrypted data removed for key: ${key}`);
    } catch (error) {
      logger.error(`Failed to remove encrypted data for key: ${key}`, error);
      throw new Error('Failed to remove encrypted data');
    }
  }

  /**
   * Clear all encrypted storage
   */
  async clear(): Promise<void> {
    try {
      await EncryptedStorageLib.clear();
      logger.info('All encrypted storage cleared');
    } catch (error) {
      logger.error('Failed to clear encrypted storage', error);
      throw new Error('Failed to clear encrypted storage');
    }
  }

  /**
   * Check if key exists
   * @param key - Storage key
   * @returns true if key exists, false otherwise
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await EncryptedStorageLib.getItem(key);
      return value !== null && value !== undefined;
    } catch (error) {
      logger.error(`Failed to check if key exists: ${key}`, error);
      return false;
    }
  }
}

export const encryptedStorage = new EncryptedStorageService();
