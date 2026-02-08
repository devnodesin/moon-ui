import axios from 'axios';

export interface CollectionColumn {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface CollectionInfo {
  name: string;
  columns?: CollectionColumn[];
}

export interface RecordListParams {
  q?: string;
  sort?: string;
  limit?: number;
  after?: string;
  [key: string]: string | number | undefined;
}

export interface RecordListResponse {
  data: Record<string, unknown>[];
  next_cursor?: string;
  has_more?: boolean;
}

function authHeaders(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function listCollections(
  baseUrl: string,
  accessToken: string,
): Promise<CollectionInfo[]> {
  const response = await axios.get<{ collections: CollectionInfo[]; count?: number }>(
    `${baseUrl}/collections:list`,
    authHeaders(accessToken),
  );
  return response.data.collections;
}

export async function getCollection(
  baseUrl: string,
  accessToken: string,
  name: string,
): Promise<CollectionInfo> {
  const response = await axios.get<CollectionInfo>(
    `${baseUrl}/collections:get?name=${encodeURIComponent(name)}`,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function createCollection(
  baseUrl: string,
  accessToken: string,
  payload: { name: string; columns: CollectionColumn[] },
): Promise<void> {
  await axios.post(
    `${baseUrl}/collections:create`,
    payload,
    authHeaders(accessToken),
  );
}

export async function deleteCollection(
  baseUrl: string,
  accessToken: string,
  name: string,
): Promise<void> {
  await axios.post(
    `${baseUrl}/collections:destroy`,
    { name },
    authHeaders(accessToken),
  );
}

export async function getSchema(
  baseUrl: string,
  accessToken: string,
  collection: string,
): Promise<CollectionColumn[]> {
  const response = await axios.get<CollectionColumn[]>(
    `${baseUrl}/${encodeURIComponent(collection)}:schema`,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function listRecords(
  baseUrl: string,
  accessToken: string,
  collection: string,
  params?: RecordListParams,
): Promise<RecordListResponse> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const qs = query.toString();
  const url = `${baseUrl}/${encodeURIComponent(collection)}:list${qs ? `?${qs}` : ''}`;
  const response = await axios.get<RecordListResponse>(url, authHeaders(accessToken));
  return response.data;
}

export async function getRecord(
  baseUrl: string,
  accessToken: string,
  collection: string,
  id: string,
): Promise<Record<string, unknown>> {
  const response = await axios.get<Record<string, unknown>>(
    `${baseUrl}/${encodeURIComponent(collection)}:get?id=${encodeURIComponent(id)}`,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function createRecord(
  baseUrl: string,
  accessToken: string,
  collection: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await axios.post<Record<string, unknown>>(
    `${baseUrl}/${encodeURIComponent(collection)}:create`,
    { data },
    authHeaders(accessToken),
  );
  return response.data;
}

export async function updateRecord(
  baseUrl: string,
  accessToken: string,
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await axios.post<Record<string, unknown>>(
    `${baseUrl}/${encodeURIComponent(collection)}:update`,
    { id, data },
    authHeaders(accessToken),
  );
  return response.data;
}

export async function deleteRecord(
  baseUrl: string,
  accessToken: string,
  collection: string,
  id: string,
): Promise<void> {
  await axios.post(
    `${baseUrl}/${encodeURIComponent(collection)}:destroy`,
    { id },
    authHeaders(accessToken),
  );
}
