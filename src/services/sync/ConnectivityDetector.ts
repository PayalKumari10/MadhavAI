/**
 * Connectivity Detector
 * Detects network connectivity changes
 * Requirements: 11.4
 */

import { ConnectivityStatus } from '../../types/sync.types';
import { logger } from '../../utils/logger';

type ConnectivityListener = (isOnline: boolean) => void;

// Type declarations for browser APIs
declare const window: {
  addEventListener: (event: string, handler: () => void) => void;
} | undefined;

declare const navigator: {
  onLine: boolean;
} | undefined;

class ConnectivityDetector {
  private listeners: ConnectivityListener[] = [];
  private currentStatus: ConnectivityStatus = {
    isOnline: true,
    lastChecked: new Date(),
  };

  constructor() {
    this.initializeListeners();
  }

  /**
   * Initialize network event listeners
   */
  private initializeListeners(): void {
    // In a real React Native app, this would use NetInfo
    // For now, we'll use a simple implementation
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => this.handleConnectivityChange(true));
      window.addEventListener('offline', () => this.handleConnectivityChange(false));
    }
  }

  /**
   * Handle connectivity change
   */
  private handleConnectivityChange(isOnline: boolean): void {
    const wasOnline = this.currentStatus.isOnline;
    this.currentStatus = {
      isOnline,
      lastChecked: new Date(),
    };

    logger.info(`Connectivity changed: ${wasOnline ? 'online' : 'offline'} -> ${isOnline ? 'online' : 'offline'}`);

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        logger.error('Error in connectivity listener', error);
      }
    });
  }

  /**
   * Get current connectivity status
   */
  getStatus(): ConnectivityStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Add connectivity change listener
   */
  addListener(listener: ConnectivityListener): () => void {
    this.listeners.push(listener);
    logger.debug('Connectivity listener added');

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      logger.debug('Connectivity listener removed');
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
    logger.debug('All connectivity listeners removed');
  }

  /**
   * Manually check connectivity
   * In a real app, this would ping a server or use NetInfo
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // In a real implementation, this would check actual network connectivity
      // For now, we'll use navigator.onLine if available
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine !== undefined 
        ? navigator.onLine 
        : true;
      
      this.currentStatus = {
        isOnline,
        lastChecked: new Date(),
      };

      return isOnline;
    } catch (error) {
      logger.error('Error checking connectivity', error);
      return false;
    }
  }
}

export const connectivityDetector = new ConnectivityDetector();
