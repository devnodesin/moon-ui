import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as collectionService from './collectionService';

const BASE_URL = 'https://api.example.com';
const TOKEN = 'test-token';

describe('collectionService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('listCollections', () => {
    it('should GET /collections:list with auth header and return collection objects', async () => {
      const collections = [
        { name: 'posts', records: 10 },
        { name: 'users', records: 5 }
      ];
      mock.onGet(`${BASE_URL}/collections:list`).reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${TOKEN}`);
        return [200, { collections, count: collections.length }];
      });

      const result = await collectionService.listCollections(BASE_URL, TOKEN);
      expect(result).toEqual(collections);
    });

    it('should throw on error', async () => {
      mock.onGet(`${BASE_URL}/collections:list`).reply(500);
      await expect(collectionService.listCollections(BASE_URL, TOKEN)).rejects.toThrow();
    });
  });

  describe('getCollection', () => {
    it('should GET /collections:get with name param and unwrap collection object', async () => {
      const data = { name: 'posts', columns: [] };
      mock.onGet(`${BASE_URL}/collections:get?name=posts`).reply(200, { collection: data });

      const result = await collectionService.getCollection(BASE_URL, TOKEN, 'posts');
      expect(result).toEqual(data);
    });
  });

  describe('createCollection', () => {
    it('should POST /collections:create with payload', async () => {
      mock.onPost(`${BASE_URL}/collections:create`).reply((config) => {
        const body = JSON.parse(config.data);
        expect(body.name).toBe('users');
        expect(body.columns).toEqual([]);
        return [201];
      });

      await collectionService.createCollection(BASE_URL, TOKEN, { name: 'users', columns: [] });
    });
  });

  describe('deleteCollection', () => {
    it('should POST /collections:destroy with name', async () => {
      mock.onPost(`${BASE_URL}/collections:destroy`).reply((config) => {
        const body = JSON.parse(config.data);
        expect(body.name).toBe('posts');
        return [200];
      });

      await collectionService.deleteCollection(BASE_URL, TOKEN, 'posts');
    });
  });

  describe('getSchema', () => {
    it('should GET /{collection}:schema and handle wrapped response', async () => {
      const fields = [{ name: 'id', type: 'string' }, { name: 'title', type: 'string' }];
      mock.onGet(`${BASE_URL}/posts:schema`).reply(200, { collection: 'posts', fields });

      const result = await collectionService.getSchema(BASE_URL, TOKEN, 'posts');
      expect(result).toEqual(fields);
    });

    it('should throw error if collection name is empty', async () => {
      await expect(collectionService.getSchema(BASE_URL, TOKEN, '')).rejects.toThrow();
    });
  });

  describe('listRecords', () => {
    it('should GET /{collection}:list', async () => {
      const response = { data: [{ id: '1', title: 'Hello' }], has_more: false };
      mock.onGet(new RegExp(`${BASE_URL}/posts:list`)).reply(200, response);

      const result = await collectionService.listRecords(BASE_URL, TOKEN, 'posts');
      expect(result).toEqual(response);
    });

    it('should include query params', async () => {
      mock.onGet(new RegExp(`${BASE_URL}/posts:list`)).reply((config) => {
        expect(config.url).toContain('q=hello');
        expect(config.url).toContain('limit=10');
        return [200, { data: [], has_more: false }];
      });

      await collectionService.listRecords(BASE_URL, TOKEN, 'posts', { q: 'hello', limit: 10 });
    });

    it('should derive has_more from next_cursor when has_more is not provided', async () => {
      const response = { 
        data: [{ id: '1', title: 'Hello' }], 
        next_cursor: '01KHGCVYD0NF8KPP3DPR1ZTN41',
        limit: 20,
        total: 25
      };
      mock.onGet(new RegExp(`${BASE_URL}/posts:list`)).reply(200, response);

      const result = await collectionService.listRecords(BASE_URL, TOKEN, 'posts');
      expect(result.has_more).toBe(true);
      expect(result.next_cursor).toBe('01KHGCVYD0NF8KPP3DPR1ZTN41');
    });

    it('should keep has_more false when next_cursor is empty', async () => {
      const response = { 
        data: [{ id: '1', title: 'Hello' }], 
        next_cursor: '',
        limit: 20
      };
      mock.onGet(new RegExp(`${BASE_URL}/posts:list`)).reply(200, response);

      const result = await collectionService.listRecords(BASE_URL, TOKEN, 'posts');
      expect(result.has_more).toBe(false);
    });

    it('should not override explicit has_more value', async () => {
      const response = { 
        data: [{ id: '1', title: 'Hello' }], 
        has_more: false,
        next_cursor: 'some-cursor'
      };
      mock.onGet(new RegExp(`${BASE_URL}/posts:list`)).reply(200, response);

      const result = await collectionService.listRecords(BASE_URL, TOKEN, 'posts');
      expect(result.has_more).toBe(false);
    });
  });

  describe('getRecord', () => {
    it('should GET /{collection}:get with id', async () => {
      const record = { id: '1', title: 'Hello' };
      mock.onGet(`${BASE_URL}/posts:get?id=1`).reply(200, record);

      const result = await collectionService.getRecord(BASE_URL, TOKEN, 'posts', '1');
      expect(result).toEqual(record);
    });
  });

  describe('createRecord', () => {
    it('should POST /{collection}:create with data wrapper', async () => {
      mock.onPost(`${BASE_URL}/posts:create`).reply((config) => {
        const body = JSON.parse(config.data);
        expect(body.data).toEqual({ title: 'New Post' });
        return [201, { id: '2', title: 'New Post' }];
      });

      const result = await collectionService.createRecord(BASE_URL, TOKEN, 'posts', { title: 'New Post' });
      expect(result).toEqual({ id: '2', title: 'New Post' });
    });

    it('should filter out id field when creating record', async () => {
      mock.onPost(`${BASE_URL}/posts:create`).reply((config) => {
        const body = JSON.parse(config.data);
        // Ensure 'id' is NOT sent in the request
        expect(body.data).toEqual({ title: 'New Post', content: 'Hello' });
        expect(body.data.id).toBeUndefined();
        return [201, { id: '2', title: 'New Post', content: 'Hello' }];
      });

      const result = await collectionService.createRecord(BASE_URL, TOKEN, 'posts', { 
        id: '', 
        title: 'New Post',
        content: 'Hello'
      });
      expect(result).toEqual({ id: '2', title: 'New Post', content: 'Hello' });
    });
  });

  describe('updateRecord', () => {
    it('should POST /{collection}:update with id and data', async () => {
      mock.onPost(`${BASE_URL}/posts:update`).reply((config) => {
        const body = JSON.parse(config.data);
        expect(body.id).toBe('1');
        expect(body.data).toEqual({ title: 'Updated' });
        return [200, { id: '1', title: 'Updated' }];
      });

      const result = await collectionService.updateRecord(BASE_URL, TOKEN, 'posts', '1', { title: 'Updated' });
      expect(result).toEqual({ id: '1', title: 'Updated' });
    });
  });

  describe('deleteRecord', () => {
    it('should POST /{collection}:destroy with id', async () => {
      mock.onPost(`${BASE_URL}/posts:destroy`).reply((config) => {
        const body = JSON.parse(config.data);
        expect(body.id).toBe('1');
        return [200];
      });

      await collectionService.deleteRecord(BASE_URL, TOKEN, 'posts', '1');
    });
  });
});
