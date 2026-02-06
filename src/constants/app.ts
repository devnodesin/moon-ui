/**
 * Application Constants
 */

// Route configuration
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  ADMIN_PREFIX: '/admin',
  APP_PREFIX: '/app',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  SAVED_CONNECTIONS: 'moon_saved_connections',
  SESSION_PREFIX: 'moon_session_',
  CURRENT_CONNECTION: 'moon_current_connection',
  THEME: 'moon_theme',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth:login',
    LOGOUT: '/auth:logout',
    REFRESH: '/auth:refresh',
    ME: '/auth:me',
  },
  HEALTH: '/health',
} as const;

// HTTP configuration
export const HTTP_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  URL_PATTERN: /^https?:\/\/.+/,
  HTTPS_URL_PATTERN: /^https:\/\/.+/,
} as const;
