/**
 * Global type declarations
 */

declare global {
  // Extend NodeJS global with crypto for React Native
  // eslint-disable-next-line no-var
  var crypto: {
    getRandomValues<T extends ArrayBufferView>(array: T): T;
  };
}

export {};
