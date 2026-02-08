import axios from 'axios';
import type { AuthTokenResponse, User } from '../types/auth';

// Configure axios defaults for CORS
axios.defaults.withCredentials = false;

export async function login(
  baseUrl: string,
  username: string,
  password: string,
): Promise<AuthTokenResponse> {
  const response = await axios.post<AuthTokenResponse>(
    `${baseUrl}/auth:login`,
    { username, password },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
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
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

// Alias for convenience
export const refresh = refreshToken;

export async function logout(
  baseUrl: string,
  accessToken: string,
  refreshTokenValue: string,
): Promise<void> {
  await axios.post(
    `${baseUrl}/auth:logout`,
    { refresh_token: refreshTokenValue },
    { 
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      } 
    },
  );
}

export async function getCurrentUser(
  baseUrl: string,
  accessToken: string,
): Promise<User> {
  const response = await axios.get<User>(
    `${baseUrl}/auth:me`,
    { 
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      } 
    },
  );
  return response.data;
}
