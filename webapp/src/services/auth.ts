import type { HttpClient } from '@/services/http'
import type { AuthLoginRequest, AuthTokens, AuthUser, ApiGetResponse } from '@/types/api'

export async function authLogin(
  baseUrl: string,
  credentials: AuthLoginRequest
): Promise<AuthTokens> {
  // Direct fetch for login (no auth header needed, no connId yet)
  const res = await fetch(`${baseUrl}/auth:login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw {
      message: body.message ?? 'Login failed',
      status: res.status,
    }
  }

  const data = await res.json()
  return data.data as AuthTokens
}

export async function authLogout(client: HttpClient, refreshToken: string): Promise<void> {
  await client.post('/auth:logout', { refresh_token: refreshToken })
}

export async function authRefresh(baseUrl: string, refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${baseUrl}/auth:refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { message: body.message ?? 'Token refresh failed', status: res.status }
  }

  const data = await res.json()
  return data.data as AuthTokens
}

export async function authMe(client: HttpClient): Promise<AuthUser> {
  const res = await client.get<ApiGetResponse<AuthUser>>('/auth:me')
  return res.data
}

export async function getHealth(baseUrl: string): Promise<{ moon: string; timestamp: string }> {
  const res = await fetch(`${baseUrl}/health`)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { message: body.message ?? 'Health check failed', status: res.status }
  }

  const data = await res.json()
  return data.data
}
