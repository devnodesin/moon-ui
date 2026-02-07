import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTokenStorage, LocalStorageTokenStorage } from './tokenStorage';

describe('MemoryTokenStorage', () => {
  let storage: MemoryTokenStorage;

  beforeEach(() => {
    storage = new MemoryTokenStorage();
  });

  it('should return null for tokens initially', () => {
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getExpiresAt()).toBeNull();
  });

  it('should store and retrieve tokens', () => {
    const accessToken = 'access-123';
    const refreshToken = 'refresh-456';
    const expiresAt = Date.now() + 3600000;

    storage.setTokens(accessToken, refreshToken, expiresAt);

    expect(storage.getAccessToken()).toBe(accessToken);
    expect(storage.getRefreshToken()).toBe(refreshToken);
    expect(storage.getExpiresAt()).toBe(expiresAt);
  });

  it('should clear tokens', () => {
    storage.setTokens('access', 'refresh', Date.now());
    storage.clearTokens();

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getExpiresAt()).toBeNull();
  });
});

describe('LocalStorageTokenStorage', () => {
  let storage: LocalStorageTokenStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageTokenStorage('test-connection');
  });

  it('should return null for tokens initially', () => {
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getExpiresAt()).toBeNull();
  });

  it('should store and retrieve tokens from localStorage', () => {
    const accessToken = 'access-123';
    const refreshToken = 'refresh-456';
    const expiresAt = Date.now() + 3600000;

    storage.setTokens(accessToken, refreshToken, expiresAt);

    expect(storage.getAccessToken()).toBe(accessToken);
    expect(storage.getRefreshToken()).toBe(refreshToken);
    expect(storage.getExpiresAt()).toBe(expiresAt);

    // Verify it's actually in localStorage
    expect(localStorage.getItem('moon-token-test-connection-access')).toBe(accessToken);
  });

  it('should clear tokens from localStorage', () => {
    storage.setTokens('access', 'refresh', Date.now());
    storage.clearTokens();

    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getExpiresAt()).toBeNull();

    // Verify it's actually removed from localStorage
    expect(localStorage.getItem('moon-token-test-connection-access')).toBeNull();
  });

  it('should use connection-specific keys', () => {
    const storage1 = new LocalStorageTokenStorage('conn1');
    const storage2 = new LocalStorageTokenStorage('conn2');

    storage1.setTokens('access1', 'refresh1', 1000);
    storage2.setTokens('access2', 'refresh2', 2000);

    expect(storage1.getAccessToken()).toBe('access1');
    expect(storage2.getAccessToken()).toBe('access2');
  });
});
