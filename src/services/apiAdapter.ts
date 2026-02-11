/**
 * API Adapter for Moon API
 * 
 * This adapter provides utility functions for Moon API responses.
 */

import type { CollectionColumn } from './collectionService';

export interface SchemaApiResponse {
  collection: string;
  fields: CollectionColumn[];
}

/**
 * Normalizes the /{collection}:schema response to CollectionColumn array.
 * Expects wrapped format {collection, fields} from Moon API.
 */
export function normalizeSchemaResponse(
  response: SchemaApiResponse,
): CollectionColumn[] {
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
 * Normalizes the /{collection}:get response to extract record data.
 * The API returns records wrapped in a {data: {...}} object.
 */
export function normalizeRecordGetResponse(
  response: { data?: Record<string, unknown> } | Record<string, unknown>,
): Record<string, unknown> {
  // Check if response has a 'data' wrapper
  if (response && typeof response === 'object' && 'data' in response && response.data) {
    return response.data as Record<string, unknown>;
  }
  
  // If no 'data' wrapper, return the response as-is
  return response as Record<string, unknown>;
}

/**
 * Runtime validation: warn if a collection object is missing expected fields
 */
export function validateCollectionObject(
  collection: { name: string; records?: number },
): boolean {
  if (!collection.name) {
    console.warn('[API Adapter] Collection object missing "name" field:', collection);
    return false;
  }
  return true;
}
