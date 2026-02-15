import axios from 'axios';

export interface ApiKeyRecord {
  id: string;
  name: string;
  description: string;
  role: string;
  can_write: boolean;
  created_at?: string;
}

export interface CreateApiKeyData {
  name: string;
  description: string;
  role: string;
  can_write: boolean;
}

export interface CreateApiKeyResponse extends ApiKeyRecord {
  key: string;
}

export interface UpdateApiKeyData {
  name?: string;
  description?: string;
  action?: 'rotate';
}

export interface RotateApiKeyResponse {
  message: string;
  warning: string;
  apikey: ApiKeyRecord;
  key: string;
}

function authHeaders(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export interface ApiKeyListParams {
  limit?: number;
  after?: string;
}

export interface ApiKeyListResponse {
  apikeys: ApiKeyRecord[];
  next_cursor?: string;
  has_more?: boolean;
  total?: number;
  limit?: number;
}

export async function listApiKeys(
  baseUrl: string,
  accessToken: string,
  params?: ApiKeyListParams,
): Promise<ApiKeyListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.after) queryParams.append('after', params.after);
  
  const url = queryParams.toString() 
    ? `${baseUrl}/apikeys:list?${queryParams}`
    : `${baseUrl}/apikeys:list`;
    
  const response = await axios.get<ApiKeyListResponse>(url, authHeaders(accessToken));
  
  // Derive has_more from next_cursor if not explicitly set
  const data = response.data;
  if (data.has_more === undefined && data.next_cursor !== undefined) {
    data.has_more = data.next_cursor.length > 0;
  }
  
  return data;
}

export async function getApiKey(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<ApiKeyRecord> {
  const response = await axios.get<ApiKeyRecord>(
    `${baseUrl}/apikeys:get?id=${encodeURIComponent(id)}`,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function createApiKey(
  baseUrl: string,
  accessToken: string,
  data: CreateApiKeyData,
): Promise<CreateApiKeyResponse> {
  const response = await axios.post<CreateApiKeyResponse>(
    `${baseUrl}/apikeys:create`,
    data,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function updateApiKey(
  baseUrl: string,
  accessToken: string,
  id: string,
  data: UpdateApiKeyData,
): Promise<ApiKeyRecord> {
  const response = await axios.post<ApiKeyRecord>(
    `${baseUrl}/apikeys:update?id=${encodeURIComponent(id)}`,
    data,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function rotateApiKey(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<RotateApiKeyResponse> {
  const response = await axios.post<RotateApiKeyResponse>(
    `${baseUrl}/apikeys:update?id=${encodeURIComponent(id)}`,
    { action: 'rotate' },
    authHeaders(accessToken),
  );
  return response.data;
}

export async function deleteApiKey(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<void> {
  await axios.post(
    `${baseUrl}/apikeys:destroy?id=${encodeURIComponent(id)}`,
    {},
    authHeaders(accessToken),
  );
}
