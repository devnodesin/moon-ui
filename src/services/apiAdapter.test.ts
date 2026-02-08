import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeCollectionListResponse,
  normalizeSchemaResponse,
  buildCollectionEndpoint,
  validateCollectionObject,
} from './apiAdapter';
import type { CollectionColumn } from './collectionService';

describe('apiAdapter', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('normalizeCollectionListResponse', () => {
    it('should normalize string array to objects (new API format)', () => {
      const response = {
        collections: ['products', 'users', 'orders'],
        count: 3,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([
        { name: 'products' },
        { name: 'users' },
        { name: 'orders' },
      ]);
    });

    it('should pass through object array as-is (old API format)', () => {
      const columns: CollectionColumn[] = [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: false },
      ];

      const response = {
        collections: [
          { name: 'products', columns },
          { name: 'users', columns: [] },
        ],
        count: 2,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([
        { name: 'products', columns },
        { name: 'users', columns: [] },
      ]);
    });

    it('should handle empty array', () => {
      const response = {
        collections: [],
        count: 0,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([]);
    });

    it('should warn on invalid format and return empty array', () => {
      const response = {
        collections: null as unknown as string[],
        count: 0,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[API Adapter] Unexpected collections format:',
        null,
      );
    });
  });

  describe('normalizeSchemaResponse', () => {
    it('should extract fields from wrapped response (new API format)', () => {
      const fields: CollectionColumn[] = [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: false },
      ];

      const response = {
        collection: 'products',
        fields,
      };

      const result = normalizeSchemaResponse(response);

      expect(result).toEqual(fields);
    });

    it('should pass through array response as-is (old API format)', () => {
      const fields: CollectionColumn[] = [
        { name: 'id', type: 'string', nullable: false },
        { name: 'title', type: 'string', nullable: false },
      ];

      const result = normalizeSchemaResponse(fields);

      expect(result).toEqual(fields);
    });

    it('should warn on invalid format and return empty array', () => {
      const response = { invalid: 'data' };

      const result = normalizeSchemaResponse(response as never);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[API Adapter] Unexpected schema response format:',
        response,
      );
    });

    it('should handle empty fields array in wrapped response', () => {
      const response = {
        collection: 'products',
        fields: [],
      };

      const result = normalizeSchemaResponse(response);

      expect(result).toEqual([]);
    });
  });

  describe('buildCollectionEndpoint', () => {
    it('should build correct endpoint URL', () => {
      const url = buildCollectionEndpoint('https://api.example.com', 'products', 'schema');

      expect(url).toBe('https://api.example.com/products:schema');
    });

    it('should encode special characters in collection name', () => {
      const url = buildCollectionEndpoint('https://api.example.com', 'my collection', 'list');

      expect(url).toBe('https://api.example.com/my%20collection:list');
    });

    it('should throw error for missing collection identifier', () => {
      expect(() => {
        buildCollectionEndpoint('https://api.example.com', '', 'schema');
      }).toThrow('Collection identifier is required');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Adapter] Missing collection identifier',
      );
    });
  });

  describe('validateCollectionObject', () => {
    it('should return true for valid collection object', () => {
      const collection = {
        name: 'products',
        columns: [{ name: 'id', type: 'string', nullable: false }],
      };

      const result = validateCollectionObject(collection);

      expect(result).toBe(true);
    });

    it('should return true for collection without columns', () => {
      const collection = { name: 'products' };

      const result = validateCollectionObject(collection);

      expect(result).toBe(true);
    });

    it('should warn and return false for missing name', () => {
      const collection = { name: '', columns: [] };

      const result = validateCollectionObject(collection);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[API Adapter] Collection object missing "name" field:',
        collection,
      );
    });
  });
});
