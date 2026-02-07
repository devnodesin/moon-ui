import axios from 'axios';
import type { AuthTokenResponse, User } from '../types/auth';

export async function login(
  baseUrl: string,
  username: string,
  password: string,
): Promise<AuthTokenResponse> {
  const response = await axios.post<AuthTokenResponse>(
    `${baseUrl}/auth:login`,
    { username, password },
  );
  return response.data;
}

export async function refreshToken(
  baseUrl: string,
  refreshTokenValue: string,
): Promise<AuthTokenResponse> {
  const response = await axios.post<AuthTokenResponse>(
    `${baseUrl}/auth:refresh`,
    { refresh_token: refreshTokenValue },
  );
  return response.data;
}

export async function logout(
  baseUrl: string,
  accessToken: string,
  refreshTokenValue: string,
): Promise<void> {
  await axios.post(
    `${baseUrl}/auth:logout`,
    { refresh_token: refreshTokenValue },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function getCurrentUser(
  baseUrl: string,
  accessToken: string,
): Promise<User> {
  const response = await axios.get<User>(
    `${baseUrl}/auth:me`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return response.data;
}
