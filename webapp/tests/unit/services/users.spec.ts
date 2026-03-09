import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUsersService } from '@/services/users'

const BASE_URL = 'https://test.moon.dev'
const CONN_ID = 'test-conn'

const mockUser = {
  id: '01KJ001',
  username: 'moonuser',
  email: 'moon@example.com',
  role: 'user' as const,
  can_write: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function mockOk(body: unknown) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => body,
  } as Response)
}

function mockFail(status: number, message: string) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    status,
    headers: new Headers(),
    json: async () => ({ message }),
  } as Response)
}

describe('createUsersService', () => {
  let service: ReturnType<typeof createUsersService>

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
    // Suppress progress events
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    localStorage.clear()
    service = createUsersService(BASE_URL, CONN_ID)
  })

  describe('listUsers', () => {
    it('returns paginated user list', async () => {
      mockOk({
        data: [mockUser],
        meta: { count: 1, limit: 15, next: null, prev: null, total: 1 },
      })
      const res = await service.listUsers()
      expect(res.data).toHaveLength(1)
      expect(res.data[0].username).toBe('moonuser')
      expect(res.meta.total).toBe(1)
    })

    it('passes ?q= search param', async () => {
      mockOk({ data: [], meta: { count: 0, limit: 15, next: null, prev: null, total: 0 } })
      await service.listUsers({ q: 'admin', limit: '15' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('q=admin')
    })

    it('passes ?after= for cursor pagination', async () => {
      mockOk({ data: [], meta: { count: 0, limit: 15, next: null, prev: null, total: 0 } })
      await service.listUsers({ after: 'cursor123' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('after=cursor123')
    })

    it('throws on API error', async () => {
      mockFail(500, 'Server error')
      await expect(service.listUsers()).rejects.toMatchObject({ status: 500 })
    })
  })

  describe('getUser', () => {
    it('returns a single user', async () => {
      mockOk({ data: mockUser })
      const res = await service.getUser('01KJ001')
      expect(res.data.id).toBe('01KJ001')
    })

    it('passes id as query param', async () => {
      mockOk({ data: mockUser })
      await service.getUser('01KJ001')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('id=01KJ001')
    })

    it('throws on 404', async () => {
      mockFail(404, 'User not found')
      await expect(service.getUser('bad-id')).rejects.toMatchObject({
        message: 'User not found',
        status: 404,
      })
    })
  })

  describe('createUser', () => {
    it('creates a user and returns created user data', async () => {
      mockOk({ data: mockUser, message: 'User created successfully' })
      const res = await service.createUser({
        username: 'moonuser',
        email: 'moon@example.com',
        password: 'Pass123#',
        role: 'user',
        can_write: true,
      })
      expect(res.data.id).toBe('01KJ001')
      expect(res.message).toBe('User created successfully')
    })

    it('wraps payload in { data: {...} }', async () => {
      mockOk({ data: mockUser, message: 'User created successfully' })
      await service.createUser({
        username: 'u',
        email: 'u@e.com',
        password: 'p',
        role: 'user',
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body).toHaveProperty('data')
      expect(body.data.username).toBe('u')
    })

    it('throws on validation failure', async () => {
      mockFail(400, 'Username already taken')
      await expect(
        service.createUser({ username: 'dup', email: 'e@e.com', password: 'p', role: 'user' })
      ).rejects.toMatchObject({ message: 'Username already taken' })
    })
  })

  describe('updateUser', () => {
    it('sends direct fields (not wrapped)', async () => {
      mockOk({ message: '1 record(s) updated successfully' })
      await service.updateUser('01KJ001', { email: 'new@example.com', role: 'admin' })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      // Must NOT be wrapped in { data: {...} }
      expect(body).not.toHaveProperty('data')
      expect(body.email).toBe('new@example.com')
      expect(body.role).toBe('admin')
    })

    it('sends ?id= in URL', async () => {
      mockOk({ message: 'updated' })
      await service.updateUser('01KJ001', { email: 'x@y.com' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('id=01KJ001')
    })
  })

  describe('resetPassword', () => {
    it('sends reset_password action to /data/users:mutate with password payload', async () => {
      mockOk({ message: 'Password reset successfully' })
      const res = await service.resetPassword('01KJ001', 'NewPass123#')
      expect(res.message).toBe('Password reset successfully')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/users:mutate')
      expect(body.op).toBe('action')
      expect(body.action).toBe('reset_password')
      expect(body.data).toEqual([{ id: '01KJ001', password: 'NewPass123#' }])
    })
  })

  describe('revokeSessions', () => {
    it('sends revoke_sessions action', async () => {
      mockOk({ message: 'Sessions revoked' })
      const res = await service.revokeSessions('01KJ001')
      expect(res.message).toBe('Sessions revoked')
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.action).toBe('revoke_sessions')
    })
  })

  describe('deleteUser', () => {
    it('sends DELETE request to correct endpoint', async () => {
      mockOk({ message: '1 record(s) deleted successfully' })
      const res = await service.deleteUser('01KJ001')
      expect(res.message).toContain('deleted')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/users:destroy')
      expect(url).toContain('id=01KJ001')
    })

    it('sends no body', async () => {
      mockOk({ message: 'deleted' })
      await service.deleteUser('01KJ001')
      const body = vi.mocked(fetch).mock.calls[0][1]?.body
      expect(body).toBeUndefined()
    })

    it('throws on failure', async () => {
      mockFail(404, 'User not found')
      await expect(service.deleteUser('bad')).rejects.toMatchObject({ status: 404 })
    })
  })
})
