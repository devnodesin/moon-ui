import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiKeysService } from '@/services/apikeys'

const BASE_URL = 'https://test.moon.dev'
const CONN_ID = 'test-conn'

const mockApiKey = {
  id: '01KJ100',
  name: 'Integration Service',
  description: 'Key for integration',
  role: 'user' as const,
  can_write: false,
  created_at: '2026-01-01T00:00:00Z',
}

const mockApiKeyWithSecret = { ...mockApiKey, key: 'moon_live_abc123' }

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

describe('createApiKeysService', () => {
  let service: ReturnType<typeof createApiKeysService>

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    localStorage.clear()
    service = createApiKeysService(BASE_URL, CONN_ID)
  })

  describe('listApiKeys', () => {
    it('returns paginated list of API keys', async () => {
      mockOk({
        data: [mockApiKey],
        meta: { count: 1, limit: 15, next: null, prev: null, total: 1 },
      })
      const res = await service.listApiKeys()
      expect(res.data).toHaveLength(1)
      expect(res.data[0].name).toBe('Integration Service')
      // key is NOT included in list responses
      expect(res.data[0]).not.toHaveProperty('key')
    })

    it('passes ?after= for cursor pagination', async () => {
      mockOk({ data: [], meta: { count: 0, limit: 15, next: null, prev: null, total: 0 } })
      await service.listApiKeys({ after: 'cur123' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('after=cur123')
    })

    it('throws on API error', async () => {
      mockFail(401, 'Unauthorized')
      await expect(service.listApiKeys()).rejects.toMatchObject({ status: 401 })
    })
  })

  describe('createApiKey', () => {
    it('returns the new key (shown once only)', async () => {
      mockOk({
        data: mockApiKeyWithSecret,
        message: 'API key created successfully',
        warning: 'Store this key securely. It will not be shown again.',
      })
      const res = await service.createApiKey({
        name: 'Integration Service',
        description: 'Key for integration',
        role: 'user',
        can_write: false,
      })
      expect(res.data.key).toBe('moon_live_abc123')
      expect(res.message).toBe('API key created successfully')
      expect(res.warning).toBeTruthy()
    })

    it('wraps payload in { data: {...} }', async () => {
      mockOk({ data: mockApiKeyWithSecret, message: 'created' })
      await service.createApiKey({
        name: 'Test',
        description: '',
        role: 'user',
        can_write: false,
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body).toHaveProperty('data')
      expect(body.data.name).toBe('Test')
    })

    it('throws on failure', async () => {
      mockFail(400, 'Name already taken')
      await expect(
        service.createApiKey({ name: 'dup', description: '', role: 'user', can_write: false }),
      ).rejects.toMatchObject({ message: 'Name already taken' })
    })
  })

  describe('updateApiKey', () => {
    it('wraps payload in { data: {...} }', async () => {
      mockOk({ message: 'updated' })
      await service.updateApiKey('01KJ100', { name: 'New Name', can_write: true })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body).toHaveProperty('data')
      expect(body.data.name).toBe('New Name')
      expect(body.data.can_write).toBe(true)
    })

    it('sends ?id= in URL', async () => {
      mockOk({ message: 'updated' })
      await service.updateApiKey('01KJ100', { name: 'X' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('id=01KJ100')
    })
  })

  describe('rotateApiKey', () => {
    it('returns new key in data array', async () => {
      mockOk({
        data: [{ ...mockApiKey, key: 'moon_live_newkey456' }],
        message: '1 record(s) updated successfully',
        meta: { total: 1, succeeded: 1, failed: 0 },
      })
      const res = await service.rotateApiKey('01KJ100')
      expect(res.data[0].key).toBe('moon_live_newkey456')
    })

    it('sends { data: { action: "rotate" } }', async () => {
      mockOk({ data: [mockApiKeyWithSecret], message: 'rotated', meta: {} })
      await service.rotateApiKey('01KJ100')
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data.action).toBe('rotate')
    })
  })

  describe('deleteApiKey', () => {
    it('calls correct endpoint with ?id=', async () => {
      mockOk({ message: '1 record(s) deleted successfully' })
      const res = await service.deleteApiKey('01KJ100')
      expect(res.message).toContain('deleted')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/apikeys:destroy')
      expect(url).toContain('id=01KJ100')
    })

    it('sends no body', async () => {
      mockOk({ message: 'deleted' })
      await service.deleteApiKey('01KJ100')
      const body = vi.mocked(fetch).mock.calls[0][1]?.body
      expect(body).toBeUndefined()
    })

    it('throws on failure', async () => {
      mockFail(404, 'Key not found')
      await expect(service.deleteApiKey('bad')).rejects.toMatchObject({ status: 404 })
    })
  })
})
