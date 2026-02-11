import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as authService from './authService';

describe('AuthService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('login', () => {
    it('should POST to /auth:login and return tokens', async () => {
      const tokenResponse = {
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        expires_in: 3600,
      };

      mock.onPost('https://api.example.com/auth:login', {
        username: 'admin',
        password: 'secret',
      }).reply(200, tokenResponse);

      const result = await authService.login('https://api.example.com', 'admin', 'secret');
      expect(result).toEqual(tokenResponse);
    });

    it('should throw on invalid credentials', async () => {
      mock.onPost('https://api.example.com/auth:login').reply(401, {
        message: 'Invalid credentials',
      });

      await expect(
        authService.login('https://api.example.com', 'admin', 'wrong'),
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should POST to /auth:refresh and return new tokens', async () => {
      const tokenResponse = {
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      };

      mock.onPost('https://api.example.com/auth:refresh', {
        refresh_token: 'old-refresh',
      }).reply(200, tokenResponse);

      const result = await authService.refreshToken('https://api.example.com', 'old-refresh');
      expect(result).toEqual(tokenResponse);
    });
  });

  describe('logout', () => {
    it('should POST to /auth:logout with refresh token', async () => {
      mock.onPost('https://api.example.com/auth:logout').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer access-token');
        expect(JSON.parse(config.data)).toEqual({ refresh_token: 'refresh-token' });
        return [204];
      });

      await authService.logout('https://api.example.com', 'access-token', 'refresh-token');
    });
  });

  describe('getCurrentUser', () => {
    it('should GET /auth:me with access token', async () => {
      const user = { username: 'admin', email: 'admin@test.com', role: 'admin' };

      mock.onGet('https://api.example.com/auth:me').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer access-token');
        return [200, { user }];
      });

      const result = await authService.getCurrentUser('https://api.example.com', 'access-token');
      expect(result).toEqual(user);
    });
  });
});
