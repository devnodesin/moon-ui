import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { HttpClient } from './httpClient';
import { MemoryTokenStorage } from './tokenStorage';
import type { TokenStorage } from '../types/http';

describe('HttpClient', () => {
  let mock: MockAdapter;
  let tokenStorage: TokenStorage;
  let onSessionExpired: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    tokenStorage = new MemoryTokenStorage();
    onSessionExpired = vi.fn();
  });

  afterEach(() => {
    mock.reset();
  });

  it('should make a GET request', async () => {
    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    mock.onGet('https://api.example.com/test').reply(200, { data: 'success' });

    const response = await client.get('/test');
    expect(response.data).toEqual({ data: 'success' });
  });

  it('should make a POST request', async () => {
    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    mock.onPost('https://api.example.com/test', { name: 'test' }).reply(201, { id: 1 });

    const response = await client.post('/test', { name: 'test' });
    expect(response.data).toEqual({ id: 1 });
  });

  it('should attach Authorization header when token exists', async () => {
    tokenStorage.setTokens('access-token-123', 'refresh-token', Date.now() + 3600000);

    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    mock.onGet('https://api.example.com/protected').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer access-token-123');
      return [200, { data: 'protected' }];
    });

    await client.get('/protected');
  });

  it('should normalize API errors to AppError format', async () => {
    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    mock.onGet('https://api.example.com/error').reply(400, {
      message: 'Bad request',
      code: 'INVALID_REQUEST',
    });

    try {
      await client.get('/error');
      expect.fail('Should have thrown an error');
    } catch (error) {
      const appError = error as { code: string; message: string };
      expect(appError.code).toBe('400'); // Status code as string
      expect(appError.message).toBe('Bad request');
    }
  });

  it('should extract error field from backend API response', async () => {
    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    mock.onPost('https://api.example.com/users').reply(400, {
      code: 400,
      error: 'invalid email format',
      error_code: 'INVALID_EMAIL_FORMAT',
    });

    try {
      await client.post('/users', { email: 'not-an-email' });
      expect.fail('Should have thrown an error');
    } catch (error) {
      const appError = error as { code: string; message: string; error?: string };
      expect(appError.code).toBe('400'); // Status code as string
      expect(appError.error).toBe('invalid email format');
    }
  });

  it('should refresh token on 401 and retry request', async () => {
    tokenStorage.setTokens('expired-token', 'refresh-token-456', Date.now() - 1000);

    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    // First request with expired token returns 401
    mock
      .onGet('https://api.example.com/protected')
      .replyOnce(401)
      // Refresh token endpoint
      .onPost('https://api.example.com/auth:refresh')
      .replyOnce(200, {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      })
      // Retry original request with new token
      .onGet('https://api.example.com/protected')
      .replyOnce((config) => {
        expect(config.headers?.Authorization).toBe('Bearer new-access-token');
        return [200, { data: 'success' }];
      });

    const response = await client.get('/protected');
    expect(response.data).toEqual({ data: 'success' });

    // Verify new tokens are stored
    expect(tokenStorage.getAccessToken()).toBe('new-access-token');
  });

  it('should call onSessionExpired when refresh fails', async () => {
    tokenStorage.setTokens('expired-token', 'invalid-refresh', Date.now() - 1000);

    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
      onSessionExpired: onSessionExpired as () => void,
    });

    mock
      .onGet('https://api.example.com/protected')
      .replyOnce(401)
      .onPost('https://api.example.com/auth:refresh')
      .replyOnce(401);

    try {
      await client.get('/protected');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(onSessionExpired).toHaveBeenCalled();
    }
  });

  it('should retry on network errors with exponential backoff', async () => {
    const client = new HttpClient({
      baseUrl: 'https://api.example.com',
      tokenStorage,
    });

    let attempts = 0;
    mock.onGet('https://api.example.com/flaky').reply(() => {
      attempts++;
      if (attempts < 3) {
        return [500, { message: 'Server error' }];
      }
      return [200, { data: 'success' }];
    });

    const response = await client.get('/flaky');
    expect(response.data).toEqual({ data: 'success' });
    expect(attempts).toBe(3);
  });
});
