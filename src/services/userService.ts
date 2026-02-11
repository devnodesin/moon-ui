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
