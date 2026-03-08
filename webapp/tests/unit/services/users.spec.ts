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
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    localStorage.clear()
    service = createUsersService(BASE_URL, CONN_ID)
  })

  describe('listUsers', () => {
    it('returns paginated user list', async () => {
      mockOk({
        data: [mockUser],
        meta: { count: 1, current_page: 1, per_page: 15, total: 1, total_pages: 1 },
        links: { first: null, last: null, next: null, prev: null },
      })
      const res = await service.listUsers()
      expect(res.data).toHaveLength(1)
      expect(res.data[0].username).toBe('moonuser')
      expect(res.meta.total).toBe(1)
    })

    it('hits /data/users:query endpoint', async () => {
      mockOk({ data: [], meta: { count: 0, current_page: 1, per_page: 15, total: 0, total_pages: 0 }, links: {} })
      await service.listUsers({ q: 'admin', per_page: '15' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/data/users:query')
      expect(url).toContain('q=admin')
    })

    it('passes page pagination params', async () => {
      mockOk({ data: [], meta: { count: 0, current_page: 2, per_page: 15, total: 0, total_pages: 0 }, links: {} })
      await service.listUsers({ page: '2', per_page: '15' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('page=2')
    })

    it('throws on API error', async () => {
      mockFail(500, 'Server error')
      await expect(service.listUsers()).rejects.toMatchObject({ status: 500 })
    })
  })

  describe('getUser', () => {
    it('returns user list with single user', async () => {
      mockOk({ data: [mockUser] })
      const res = await service.getUser('01KJ001')
      expect(res.data[0].id).toBe('01KJ001')
    })

    it('hits /data/users:query with id param', async () => {
      mockOk({ data: [mockUser] })
      await service.getUser('01KJ001')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/data/users:query')
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
    it('creates a user and returns response', async () => {
      mockOk({
        data: [mockUser],
        message: 'Resource created successfully',
        meta: { success: 1, failed: 0 },
      })
      const res = await service.createUser({
        username: 'moonuser',
        email: 'moon@example.com',
        password: 'Pass123#',
        role: 'user',
        can_write: true,
      })
      expect(res.data[0].id).toBe('01KJ001')
      expect(res.message).toBe('Resource created successfully')
    })

    it('sends op:create with data array to /data/users:mutate', async () => {
      mockOk({ data: [mockUser], message: 'Resource created successfully', meta: { success: 1, failed: 0 } })
      await service.createUser({
        username: 'u',
        email: 'u@e.com',
        password: 'p',
        role: 'user',
      })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/users:mutate')
      expect(body.op).toBe('create')
      expect(body.data[0].username).toBe('u')
    })

    it('throws on validation failure', async () => {
      mockFail(400, 'Username already taken')
      await expect(
        service.createUser({ username: 'dup', email: 'e@e.com', password: 'p', role: 'user' }),
      ).rejects.toMatchObject({ message: 'Username already taken' })
    })
  })

  describe('updateUser', () => {
    it('sends op:update with data array to /data/users:mutate', async () => {
      mockOk({ data: [mockUser], message: 'Resource updated successfully', meta: { success: 1, failed: 0 } })
      await service.updateUser('01KJ001', { email: 'new@example.com', role: 'admin' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/users:mutate')
      expect(body.op).toBe('update')
      expect(body.data[0].id).toBe('01KJ001')
      expect(body.data[0].email).toBe('new@example.com')
    })

    it('can send password in update payload', async () => {
      mockOk({ data: [mockUser], message: 'Resource updated successfully', meta: { success: 1, failed: 0 } })
      await service.updateUser('01KJ001', { password: 'NewPass123#' })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data[0].password).toBe('NewPass123#')
    })
  })

  describe('deleteUser', () => {
    it('sends op:destroy to /data/users:mutate', async () => {
      mockOk({ message: 'Resource destroyed successfully', meta: { success: 1, failed: 0 } })
      const res = await service.deleteUser('01KJ001')
      expect(res.message).toContain('destroyed')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/users:mutate')
      expect(body.op).toBe('destroy')
      expect(body.data[0].id).toBe('01KJ001')
    })

    it('throws on failure', async () => {
      mockFail(404, 'User not found')
      await expect(service.deleteUser('bad')).rejects.toMatchObject({ status: 404 })
    })
  })
})
