import type { HttpClient } from '@/services/http'
import type { AuthTokens, AuthUser, ApiGetResponse } from '@/types/api'

export async function authLogin(
  baseUrl: string,
  credentials: { username: string; password: string },
): Promise<AuthTokens> {
  // Direct fetch for login (no auth header needed, no connId yet)
  const url = baseUrl.replace(/\/+$/, '')
  const res = await fetch(`${url}/auth:session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      op: 'login',
      data: credentials,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw {
      message: body.message ?? 'Login failed',
      status: res.status,
    }
  }

  const data = await res.json()
  // New API: data is an array, take first element
  return (data.data as AuthTokens[])[0]
}

export async function authLogout(client: HttpClient, refreshToken: string): Promise<void> {
  await client.post('/auth:session', { op: 'logout', data: { refresh_token: refreshToken } })
}

export async function authRefresh(baseUrl: string, refreshToken: string): Promise<AuthTokens> {
  const url = baseUrl.replace(/\/+$/, '')
  const res = await fetch(`${url}/auth:session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'refresh', data: { refresh_token: refreshToken } }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { message: body.message ?? 'Token refresh failed', status: res.status }
  }

  const data = await res.json()
  // New API: data is an array, take first element
  return (data.data as AuthTokens[])[0]
}

export async function authMe(client: HttpClient): Promise<AuthUser> {
  const res = await client.get<ApiGetResponse<AuthUser>>('/auth:me')
  // New API: data is an array, take first element
  return res.data[0]
}

export async function getHealth(baseUrl: string): Promise<{ moon: string; timestamp: string }> {
  const url = baseUrl.replace(/\/+$/, '')
  const res = await fetch(`${url}/health`)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { message: body.message ?? 'Health check failed', status: res.status }
  }

  const data = await res.json()
  return data.data
}
