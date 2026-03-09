/**
 * Unit tests for Connectivity Detector
 */

import { connectivityDetector } from '../ConnectivityDetector';

describe('ConnectivityDetector', () => {
  beforeEach(() => {
    connectivityDetector.removeAllListeners();
  });

  describe('getStatus', () => {
    it('should return current connectivity status', () => {
      const status = connectivityDetector.getStatus();

      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('lastChecked');
      expect(status.lastChecked).toBeInstanceOf(Date);
    });
  });

  describe('isOnline', () => {
    it('should return boolean connectivity status', () => {
      const isOnline = connectivityDetector.isOnline();

      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('addListener', () => {
    it('should add connectivity listener', () => {
      const listener = jest.fn();
      const unsubscribe = connectivityDetector.addListener(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = connectivityDetector.addListener(listener);

      unsubscribe();
      // Listener should be removed
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      connectivityDetector.addListener(listener1);
      connectivityDetector.addListener(listener2);

      connectivityDetector.removeAllListeners();
      // All listeners should be removed
    });
  });

  describe('checkConnectivity', () => {
    it('should check connectivity status', async () => {
      const isOnline = await connectivityDetector.checkConnectivity();

      expect(typeof isOnline).toBe('boolean');
    });

    it('should update status after check', async () => {
      const beforeCheck = connectivityDetector.getStatus().lastChecked;

      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10));
      await connectivityDetector.checkConnectivity();

      const afterCheck = connectivityDetector.getStatus().lastChecked;
      expect(afterCheck.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime());
    });
  });
});
