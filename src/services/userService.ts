import axios from 'axios';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  can_write?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  role?: string;
  action?: 'reset_password' | 'revoke_sessions';
  new_password?: string;
}

function authHeaders(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export interface UserListParams {
  limit?: number;
  after?: string;
}

export interface UserListResponse {
  users: UserRecord[];
  next_cursor?: string;
  has_more?: boolean;
  total?: number;
  limit?: number;
}

export async function listUsers(
  baseUrl: string,
  accessToken: string,
  params?: UserListParams,
): Promise<UserListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.after) queryParams.append('after', params.after);
  
  const url = queryParams.toString() 
    ? `${baseUrl}/users:list?${queryParams}`
    : `${baseUrl}/users:list`;
    
  const response = await axios.get<UserListResponse>(url, authHeaders(accessToken));
  
  // Ensure has_more is calculated if not provided by backend
  const data = response.data;
  if (data.has_more === undefined && data.next_cursor) {
    data.has_more = !!data.next_cursor;
  }
  
  return data;
}

export async function getUser(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<UserRecord> {
  const response = await axios.get<{ user: UserRecord }>(
    `${baseUrl}/users:get?id=${encodeURIComponent(id)}`,
    authHeaders(accessToken),
  );
  return response.data.user;
}

export async function createUser(
  baseUrl: string,
  accessToken: string,
  data: CreateUserData,
): Promise<UserRecord> {
  const response = await axios.post<{ user: UserRecord; message?: string }>(
    `${baseUrl}/users:create`,
    data,
    authHeaders(accessToken),
  );
  return response.data.user;
}

export async function updateUser(
  baseUrl: string,
  accessToken: string,
  id: string,
  data: UpdateUserData,
): Promise<UserRecord> {
  const response = await axios.post<{ message: string; user: UserRecord }>(
    `${baseUrl}/users:update?id=${encodeURIComponent(id)}`,
    data,
    authHeaders(accessToken),
  );
  return response.data.user;
}

export async function revokeUserSessions(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<UserRecord> {
  const response = await axios.post<{ message: string; user: UserRecord }>(
    `${baseUrl}/users:update?id=${encodeURIComponent(id)}`,
    { action: 'revoke_sessions' },
    authHeaders(accessToken),
  );
  return response.data.user;
}

export async function deleteUser(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<void> {
  await axios.post(
    `${baseUrl}/users:destroy?id=${encodeURIComponent(id)}`,
    {},
    authHeaders(accessToken),
  );
}
