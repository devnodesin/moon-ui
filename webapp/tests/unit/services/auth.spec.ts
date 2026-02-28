import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authLogin, getHealth } from '@/services/auth'

describe('authLogin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
  })

  it('returns tokens on success', async () => {
    const mockTokens = {
      access_token: 'abc',
      refresh_token: 'def',
      expires_at: '2099-01-01T00:00:00Z',
      token_type: 'Bearer',
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        can_write: true,
      },
    }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockTokens }),
    } as Response)

    const result = await authLogin('https://test.com', { username: 'admin', password: 'pass' })
    expect(result.access_token).toBe('abc')
  })

  it('throws ApiError on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response)

    await expect(
      authLogin('https://test.com', { username: 'x', password: 'y' })
    ).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    })
  })
})

describe('getHealth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
  })

  it('returns health data on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { moon: '1.99', timestamp: '2026-01-01T00:00:00Z' } }),
    } as Response)

    const result = await getHealth('https://test.com')
    expect(result.moon).toBe('1.99')
  })
})
