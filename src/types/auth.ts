/**
 * Connection and Authentication Types
 */

export interface ConnectionSession {
  connectionId: string;
  name: string;
  baseUrl: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (milliseconds)
  lastUsed: number; // Unix timestamp (milliseconds)
}

export interface SavedConnection {
  connectionId: string;
  name: string;
  baseUrl: string;
  username: string;
  password?: string; // Optional, for convenience only
  lastUsed?: number;
}

export interface LoginCredentials {
  baseUrl: string;
  username: string;
  password: string;
  rememberConnection: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Seconds
  token_type: string;
  user?: {
    username: string;
    email?: string;
    role?: string;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}
