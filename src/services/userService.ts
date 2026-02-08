import axios from 'axios';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at?: string;
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
  password?: string;
}

function authHeaders(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function listUsers(
  baseUrl: string,
  accessToken: string,
): Promise<UserRecord[]> {
  const response = await axios.get<{ users: UserRecord[]; next_cursor?: string | null; limit?: number }>(
    `${baseUrl}/users:list`,
    authHeaders(accessToken),
  );
  return response.data.users;
}

export async function getUser(
  baseUrl: string,
  accessToken: string,
  id: string,
): Promise<UserRecord> {
  const response = await axios.get<UserRecord>(
    `${baseUrl}/users:get?id=${encodeURIComponent(id)}`,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function createUser(
  baseUrl: string,
  accessToken: string,
  data: CreateUserData,
): Promise<UserRecord> {
  const response = await axios.post<UserRecord>(
    `${baseUrl}/users:create`,
    data,
    authHeaders(accessToken),
  );
  return response.data;
}

export async function updateUser(
  baseUrl: string,
  accessToken: string,
  id: string,
  data: UpdateUserData,
): Promise<UserRecord> {
  const response = await axios.post<UserRecord>(
    `${baseUrl}/users:update?id=${encodeURIComponent(id)}`,
    data,
    authHeaders(accessToken),
  );
  return response.data;
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
