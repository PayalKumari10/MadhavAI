module.exports = {
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve({
    executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0, item: () => ({}) } }])),
    transaction: jest.fn((callback) => callback({
      executeSql: jest.fn(() => Promise.resolve()),
    })),
    close: jest.fn(() => Promise.resolve()),
  })),
  default: {
    enablePromise: jest.fn(),
    openDatabase: jest.fn(() => Promise.resolve({
      executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0, item: () => ({}) } }])),
      transaction: jest.fn((callback) => callback({
        executeSql: jest.fn(() => Promise.resolve()),
      })),
      close: jest.fn(() => Promise.resolve()),
    })),
  },
};
