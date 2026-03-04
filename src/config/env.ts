/**
 * Environment configuration
 * Manages environment-specific settings for development, staging, and production
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENABLE_LOGGING: boolean;
  STORAGE_LIMIT_MB: number;
  SYNC_INTERVAL_MS: number;
  MAX_RETRY_ATTEMPTS: number;
}

const ENV: Environment = (__DEV__ ? 'development' : 'production') as Environment;

const configs: Record<Environment, EnvConfig> = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    API_TIMEOUT: 30000,
    ENABLE_LOGGING: true,
    STORAGE_LIMIT_MB: 500,
    SYNC_INTERVAL_MS: 60000, // 1 minute for dev
    MAX_RETRY_ATTEMPTS: 3,
  },
  staging: {
    API_BASE_URL: 'https://staging-api.madhavai.com/api',
    API_TIMEOUT: 30000,
    ENABLE_LOGGING: true,
    STORAGE_LIMIT_MB: 500,
    SYNC_INTERVAL_MS: 300000, // 5 minutes
    MAX_RETRY_ATTEMPTS: 5,
  },
  production: {
    API_BASE_URL: 'https://api.madhavai.com/api',
    API_TIMEOUT: 30000,
    ENABLE_LOGGING: false,
    STORAGE_LIMIT_MB: 500,
    SYNC_INTERVAL_MS: 360000, // 6 minutes
    MAX_RETRY_ATTEMPTS: 5,
  },
};

export const config: EnvConfig = configs[ENV];
export const environment: Environment = ENV;
