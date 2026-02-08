/**
 * API Adapter for Moon API v1.99+
 * 
 * This adapter normalizes Moon API responses to match the app's expected data model.
 * Only supports current Moon API format (v1.99+).
 */

import type { CollectionColumn } from './collectionService';

export interface CollectionListApiResponse {
  collections: string[];
  count?: number;
  total?: number;
}

export interface SchemaApiResponse {
  collection: string;
  fields: CollectionColumn[];
}

/**
 * Normalizes the /collections:list response to CollectionInfo objects.
 * Expects string array format from Moon API v1.99+.
 */
export function normalizeCollectionListResponse(
  response: CollectionListApiResponse,
): Array<{ name: string; columns?: CollectionColumn[] }> {
  const { collections } = response;
  
  if (!Array.isArray(collections)) {
    console.warn('[API Adapter] Unexpected collections format (expected string array):', collections);
    return [];
  }

  if (collections.length === 0) {
    return [];
  }

  // Expect string array from Moon API v1.99+
  if (typeof collections[0] !== 'string') {
    console.error('[API Adapter] Invalid collections format: expected string[], got:', typeof collections[0]);
    return [];
  }

  return collections.map((name) => ({ name }));
}

/**
 * Normalizes the /{collection}:schema response to CollectionColumn array.
 * Expects wrapped format {collection, fields} from Moon API v1.99+.
 */
export function normalizeSchemaResponse(
  response: SchemaApiResponse,
): CollectionColumn[] {
  // Expect wrapped format from Moon API v1.99+
  if (!response || typeof response !== 'object') {
    console.error('[API Adapter] Invalid schema response: expected object, got:', typeof response);
    return [];
  }

  if (!('fields' in response) || !Array.isArray(response.fields)) {
    console.error('[API Adapter] Invalid schema response format: missing or invalid "fields" property');
    return [];
  }

  return response.fields;
}

/**
 * Build endpoint URL for a collection
 */
export function buildCollectionEndpoint(
  baseUrl: string,
  collection: string,
  action: string,
): string {
  if (!collection) {
    console.error('[API Adapter] Missing collection identifier');
    throw new Error('Collection identifier is required');
  }
  return `${baseUrl}/${encodeURIComponent(collection)}:${action}`;
}

/**
 * Runtime validation: warn if a collection object is missing expected fields
 */
export function validateCollectionObject(
  collection: { name: string; columns?: CollectionColumn[] },
): boolean {
  if (!collection.name) {
    console.warn('[API Adapter] Collection object missing "name" field:', collection);
    return false;
  }
  return true;
}
