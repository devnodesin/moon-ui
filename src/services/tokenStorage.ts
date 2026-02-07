import type { TokenStorage } from '../types/http';

/**
 * In-memory token storage for temporary sessions
 * Tokens are lost on page reload
 */
export class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }

  getExpiresAt(): number | null {
    return this.expiresAt;
  }
}

/**
 * LocalStorage-based token storage for persistent sessions
 * Tokens persist across page reloads
 */
export class LocalStorageTokenStorage implements TokenStorage {
  private readonly prefix: string;

  constructor(connectionId: string = 'default') {
    this.prefix = `moon-token-${connectionId}`;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(`${this.prefix}-access`);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(`${this.prefix}-refresh`);
  }

  setTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    localStorage.setItem(`${this.prefix}-access`, accessToken);
    localStorage.setItem(`${this.prefix}-refresh`, refreshToken);
    localStorage.setItem(`${this.prefix}-expires`, expiresAt.toString());
  }

  clearTokens(): void {
    localStorage.removeItem(`${this.prefix}-access`);
    localStorage.removeItem(`${this.prefix}-refresh`);
    localStorage.removeItem(`${this.prefix}-expires`);
  }

  getExpiresAt(): number | null {
    const expires = localStorage.getItem(`${this.prefix}-expires`);
    return expires ? parseInt(expires, 10) : null;
  }
}
