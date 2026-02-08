/**
 * API Adapter for Moon API compatibility
 * 
 * This adapter normalizes API responses to match the app's expected data model,
 * providing compatibility with API changes while maintaining backward compatibility.
 */

import type { CollectionColumn } from './collectionService';

export interface CollectionListApiResponse {
  collections: string[] | Array<{ name: string; columns?: CollectionColumn[] }>;
  count?: number;
  total?: number;
}

export interface SchemaApiResponse {
  collection?: string;
  fields?: CollectionColumn[];
}

/**
 * Normalizes the /collections:list response to always return CollectionInfo objects
 */
export function normalizeCollectionListResponse(
  response: CollectionListApiResponse,
): Array<{ name: string; columns?: CollectionColumn[] }> {
  const { collections } = response;
  
  if (!Array.isArray(collections)) {
    console.warn('[API Adapter] Unexpected collections format:', collections);
    return [];
  }

  // If collections is already an array of objects, return as-is
  if (collections.length > 0 && typeof collections[0] === 'object') {
    return collections as Array<{ name: string; columns?: CollectionColumn[] }>;
  }

  // If collections is an array of strings, convert to objects
  if (collections.length > 0 && typeof collections[0] === 'string') {
    return (collections as string[]).map((name) => ({ name }));
  }

  // Empty array is valid - return as-is
  return [];
}

/**
 * Normalizes the /{collection}:schema response to always return a CollectionColumn array
 */
export function normalizeSchemaResponse(
  response: SchemaApiResponse | CollectionColumn[],
): CollectionColumn[] {
  // If response is already an array, return as-is (old API format)
  if (Array.isArray(response)) {
    return response;
  }

  // If response has a 'fields' property, extract it (new API format)
  if (response && 'fields' in response && Array.isArray(response.fields)) {
    return response.fields;
  }

  console.warn('[API Adapter] Unexpected schema response format:', response);
  return [];
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
