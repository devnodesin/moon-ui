import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as userService from './userService';

describe('userService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('listUsers', () => {
    it('should GET /users:list with auth header', async () => {
      const users = [{ id: '1', username: 'admin', email: 'admin@test.com', role: 'admin' }];
      mock.onGet('https://api.example.com/users:list').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        return [200, users];
      });

      const result = await userService.listUsers('https://api.example.com', 'tok');
      expect(result).toEqual(users);
    });

    it('should throw on failure', async () => {
      mock.onGet('https://api.example.com/users:list').reply(500);
      await expect(userService.listUsers('https://api.example.com', 'tok')).rejects.toThrow();
    });
  });

  describe('getUser', () => {
    it('should GET /users:get?id=1 with auth header', async () => {
      const user = { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin' };
      mock.onGet('https://api.example.com/users:get?id=1').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        return [200, user];
      });

      const result = await userService.getUser('https://api.example.com', 'tok', '1');
      expect(result).toEqual(user);
    });
  });

  describe('createUser', () => {
    it('should POST to /users:create with data', async () => {
      const payload = { username: 'newuser', email: 'new@test.com', password: 'pass', role: 'user' };
      const created = { id: '2', ...payload };
      mock.onPost('https://api.example.com/users:create').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        expect(JSON.parse(config.data)).toEqual(payload);
        return [200, created];
      });

      const result = await userService.createUser('https://api.example.com', 'tok', payload);
      expect(result).toEqual(created);
    });
  });

  describe('updateUser', () => {
    it('should POST to /users:update?id=1 with data', async () => {
      const payload = { email: 'updated@test.com', role: 'admin' };
      const updated = { id: '1', username: 'admin', ...payload };
      mock.onPost('https://api.example.com/users:update?id=1').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        expect(JSON.parse(config.data)).toEqual(payload);
        return [200, updated];
      });

      const result = await userService.updateUser('https://api.example.com', 'tok', '1', payload);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteUser', () => {
    it('should POST to /users:destroy?id=1', async () => {
      mock.onPost('https://api.example.com/users:destroy?id=1').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer tok');
        return [204];
      });

      await userService.deleteUser('https://api.example.com', 'tok', '1');
    });

    it('should throw on failure', async () => {
      mock.onPost('https://api.example.com/users:destroy?id=1').reply(500);
      await expect(userService.deleteUser('https://api.example.com', 'tok', '1')).rejects.toThrow();
    });
  });
});
