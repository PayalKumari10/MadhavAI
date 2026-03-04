/**
 * Jest setup file
 * Configures testing environment and global test utilities
 */

// Mock AsyncStorage (virtual mock - package not installed)
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage: Record<string, string> = {};
  return {
    default: {
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
        return Promise.resolve();
      }),
      getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((key) => [key, mockStorage[key] || null]))
      ),
      multiSet: jest.fn((pairs: Array<[string, string]>) => {
        pairs.forEach(([key, value]) => {
          mockStorage[key] = value;
        });
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((key) => delete mockStorage[key]);
        return Promise.resolve();
      }),
    },
  };
}, { virtual: true });

// Mock react-native-encrypted-storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Global test timeout
jest.setTimeout(10000);

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
