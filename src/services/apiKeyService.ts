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

function authHeaders(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function listApiKeys(
  baseUrl: string,
  accessToken: string,
): Promise<ApiKeyRecord[]> {
  const response = await axios.get<{ apikeys: ApiKeyRecord[]; next_cursor?: string | null; limit?: number }>(
    `${baseUrl}/apikeys:list`,
    authHeaders(accessToken),
  );
  return response.data.apikeys;
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
