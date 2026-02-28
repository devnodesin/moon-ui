import type { ApiError } from '@/types/api'

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function getStorageKey(connId: string, key: string): string {
  return `moon_${connId}_${key}`
}

function getAccessToken(connId: string): string | null {
  const rememberMe = localStorage.getItem(getStorageKey(connId, 'remember_me')) === 'true'
  const storage = rememberMe ? localStorage : sessionStorage
  return storage.getItem(getStorageKey(connId, 'access_token'))
}

function getRefreshToken(connId: string): string | null {
  const rememberMe = localStorage.getItem(getStorageKey(connId, 'remember_me')) === 'true'
  const storage = rememberMe ? localStorage : sessionStorage
  return storage.getItem(getStorageKey(connId, 'refresh_token'))
}

function getExpiresAt(connId: string): string | null {
  return localStorage.getItem(getStorageKey(connId, 'expires_at'))
}

function isTokenExpiringSoon(connId: string): boolean {
  const expiresAt = getExpiresAt(connId)
  if (!expiresAt) return false
  const expiryMs = new Date(expiresAt).getTime()
  return Date.now() >= expiryMs - 60_000
}

async function doRefresh(baseUrl: string, connId: string): Promise<string> {
  const refreshToken = getRefreshToken(connId)
  if (!refreshToken) throw { message: 'No refresh token', status: 401 } as ApiError

  const res = await fetch(`${baseUrl}/auth:refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    clearTokens(connId)
    throw { message: body.message ?? 'Token refresh failed', status: res.status } as ApiError
  }

  const data = await res.json()
  const tokens = data.data
  storeTokens(connId, tokens.access_token, tokens.refresh_token, tokens.expires_at)
  return tokens.access_token
}

export function storeTokens(
  connId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string,
  rememberMe?: boolean
): void {
  const storageKey = getStorageKey(connId, 'remember_me')
  const remember = rememberMe ?? localStorage.getItem(storageKey) === 'true'
  if (rememberMe !== undefined) {
    localStorage.setItem(storageKey, String(rememberMe))
  }
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(getStorageKey(connId, 'access_token'), accessToken)
  storage.setItem(getStorageKey(connId, 'refresh_token'), refreshToken)
  localStorage.setItem(getStorageKey(connId, 'expires_at'), expiresAt)
}

export function clearTokens(connId: string): void {
  const keys = ['access_token', 'refresh_token', 'expires_at', 'user', 'remember_me']
  keys.forEach((k) => {
    localStorage.removeItem(getStorageKey(connId, k))
    sessionStorage.removeItem(getStorageKey(connId, k))
  })
}

export function createHttpClient(baseUrl: string, connId: string) {
  let progressCount = 0

  function notifyProgress(delta: number): void {
    progressCount = Math.max(0, progressCount + delta)
    window.dispatchEvent(new CustomEvent('moon:progress', { detail: { active: progressCount > 0 } }))
  }

  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    params?: Record<string, string>,
    body?: unknown
  ): Promise<T> {
    // Proactively refresh if token expiring soon
    if (isTokenExpiringSoon(connId) && getRefreshToken(connId)) {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const newToken = await doRefresh(baseUrl, connId)
          refreshQueue.forEach((cb) => cb(newToken))
        } finally {
          refreshQueue = []
          isRefreshing = false
        }
      } else {
        await new Promise<string>((resolve) => refreshQueue.push(resolve))
      }
    }

    const url = new URL(`${baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = getAccessToken(connId)
    if (token) headers['Authorization'] = `Bearer ${token}`

    notifyProgress(1)

    let res: Response
    try {
      res = await fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      notifyProgress(-1)
      console.error('[HTTP] Network error:', err)
      throw {
        message: 'Unable to connect to the server. Check your connection.',
        status: 0,
      } as ApiError
    }

    notifyProgress(-1)

    // Handle 401 with token refresh
    if (res.status === 401) {
      const refreshToken = getRefreshToken(connId)
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true
          try {
            const newToken = await doRefresh(baseUrl, connId)
            refreshQueue.forEach((cb) => cb(newToken))
            // Retry with new token
            headers['Authorization'] = `Bearer ${newToken}`
            notifyProgress(1)
            try {
              res = await fetch(url.toString(), {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
              })
            } finally {
              notifyProgress(-1)
            }
          } catch {
            clearTokens(connId)
            window.dispatchEvent(new CustomEvent('moon:auth-expired'))
            throw { message: 'Session expired. Please log in again.', status: 401 } as ApiError
          } finally {
            refreshQueue = []
            isRefreshing = false
          }
        } else {
          const newToken = await new Promise<string>((resolve) => refreshQueue.push(resolve))
          headers['Authorization'] = `Bearer ${newToken}`
          notifyProgress(1)
          try {
            res = await fetch(url.toString(), {
              method,
              headers,
              body: body !== undefined ? JSON.stringify(body) : undefined,
            })
          } finally {
            notifyProgress(-1)
          }
        }
      }
    }

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}))
      const retryAfter = res.headers.get('Retry-After')
      const err: ApiError = {
        message: `${body.message ?? 'Rate limit exceeded'}${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
        status: 429,
      }
      console.error('[HTTP] Rate limited:', err)
      throw err
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err: ApiError = {
        message: body.message ?? (res.status >= 500 ? 'Server error. Please try again.' : res.statusText),
        status: res.status,
      }
      console.error('[HTTP] Error:', err)
      throw err
    }

    return res.json() as Promise<T>
  }

  return {
    get<T>(path: string, params?: Record<string, string>): Promise<T> {
      return request<T>('GET', path, params)
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>('POST', path, undefined, body)
    },
  }
}

export type HttpClient = ReturnType<typeof createHttpClient>
