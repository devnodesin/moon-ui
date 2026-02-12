export interface AppError {
  code: string;
  message: string;
  error?: string; // User-facing error message from backend API
  details?: unknown;
}

export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string, expiresAt: number): void;
  clearTokens(): void;
  getExpiresAt(): number | null;
}

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  tokenStorage: TokenStorage;
  onSessionExpired?: () => void;
}
