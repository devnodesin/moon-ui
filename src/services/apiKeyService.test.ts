import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as apiKeyService from './apiKeyService';

describe('apiKeyService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('listApiKeys', () => {
    it('should GET /apikeys:list with auth header', async () => {
      const keys = [{ id: '1', name: 'key1', description: 'desc', role: 'admin', can_write: true }];
      mock.onGet('https://api.example.com/apikeys:list').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        return [200, keys];
      });

      const result = await apiKeyService.listApiKeys('https://api.example.com', 'tok');
      expect(result).toEqual(keys);
    });

    it('should throw on failure', async () => {
      mock.onGet('https://api.example.com/apikeys:list').reply(500);
      await expect(apiKeyService.listApiKeys('https://api.example.com', 'tok')).rejects.toThrow();
    });
  });

  describe('getApiKey', () => {
    it('should GET /apikeys:get?id=1 with auth header', async () => {
      const key = { id: '1', name: 'key1', description: 'desc', role: 'admin', can_write: true };
      mock.onGet('https://api.example.com/apikeys:get?id=1').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        return [200, key];
      });

      const result = await apiKeyService.getApiKey('https://api.example.com', 'tok', '1');
      expect(result).toEqual(key);
    });
  });

  describe('createApiKey', () => {
    it('should POST to /apikeys:create and return key', async () => {
      const payload = { name: 'newkey', description: 'test', role: 'user', can_write: false };
      const created = { id: '2', ...payload, key: 'secret-key-123' };
      mock.onPost('https://api.example.com/apikeys:create').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        expect(JSON.parse(config.data)).toEqual(payload);
        return [200, created];
      });

      const result = await apiKeyService.createApiKey('https://api.example.com', 'tok', payload);
      expect(result).toEqual(created);
      expect(result.key).toBe('secret-key-123');
    });
  });

  describe('updateApiKey', () => {
    it('should POST to /apikeys:update?id=1 with data', async () => {
      const payload = { description: 'updated' };
      const updated = { id: '1', name: 'key1', description: 'updated', role: 'admin', can_write: true };
      mock.onPost('https://api.example.com/apikeys:update?id=1').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        expect(JSON.parse(config.data)).toEqual(payload);
        return [200, updated];
      });

      const result = await apiKeyService.updateApiKey('https://api.example.com', 'tok', '1', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteApiKey', () => {
    it('should POST to /apikeys:destroy?id=1', async () => {
      mock.onPost('https://api.example.com/apikeys:destroy?id=1').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        return [204];
      });

      await apiKeyService.deleteApiKey('https://api.example.com', 'tok', '1');
    });

    it('should throw on failure', async () => {
      mock.onPost('https://api.example.com/apikeys:destroy?id=1').reply(500);
      await expect(apiKeyService.deleteApiKey('https://api.example.com', 'tok', '1')).rejects.toThrow();
    });
  });
});
