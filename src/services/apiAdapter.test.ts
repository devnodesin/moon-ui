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
    it('should normalize string array to objects (Moon API v1.99+)', () => {
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

    it('should handle empty array', () => {
      const response = {
        collections: [],
        count: 0,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([]);
    });

    it('should warn on invalid format (non-array) and return empty array', () => {
      const response = {
        collections: null as unknown as string[],
        count: 0,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[API Adapter] Unexpected collections format (expected string array):',
        null,
      );
    });

    it('should error on invalid type (object array) and return empty array', () => {
      const response = {
        collections: [{ name: 'test' }] as unknown as string[],
        count: 1,
      };

      const result = normalizeCollectionListResponse(response);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Adapter] Invalid collections format: expected string[], got:',
        'object',
      );
    });
  });

  describe('normalizeSchemaResponse', () => {
    it('should extract fields from wrapped response (Moon API v1.99+)', () => {
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

    it('should handle empty fields array in wrapped response', () => {
      const response = {
        collection: 'products',
        fields: [],
      };

      const result = normalizeSchemaResponse(response);

      expect(result).toEqual([]);
    });

    it('should error on invalid response (not an object) and return empty array', () => {
      const response = 'invalid' as unknown as { collection: string; fields: CollectionColumn[] };

      const result = normalizeSchemaResponse(response);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Adapter] Invalid schema response: expected object, got:',
        'string',
      );
    });

    it('should error on missing fields property and return empty array', () => {
      const response = { collection: 'products' } as { collection: string; fields: CollectionColumn[] };

      const result = normalizeSchemaResponse(response);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Adapter] Invalid schema response format: missing or invalid "fields" property',
      );
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
