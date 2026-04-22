import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiKeysService } from '@/services/apikeys'

const BASE_URL = 'https://test.moon.dev'
const CONN_ID = 'test-conn'

const mockApiKey = {
  id: '01KJ100',
  name: 'Integration Service',
  role: 'user' as const,
  can_write: false,
  collections: ['products', 'orders'],
  is_website: true,
  allowed_origins: ['https://moon.devnodes.in'],
  rate_limit: 5,
  captcha_required: true,
  enabled: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  last_used_at: null,
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
        meta: { count: 1, current_page: 1, per_page: 15, total: 1, total_pages: 1 },
        links: { first: null, last: null, next: null, prev: null },
      })
      const res = await service.listApiKeys()
      expect(res.data).toHaveLength(1)
      expect(res.data[0].name).toBe('Integration Service')
      // key is NOT included in list responses
      expect(res.data[0]).not.toHaveProperty('key')
    })

    it('hits /data/apikeys:query endpoint', async () => {
      mockOk({ data: [], meta: { count: 0, current_page: 1, per_page: 15, total: 0, total_pages: 0 }, links: {} })
      await service.listApiKeys()
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/data/apikeys:query')
    })

    it('throws on API error', async () => {
      mockFail(401, 'Unauthorized')
      await expect(service.listApiKeys()).rejects.toMatchObject({ status: 401 })
    })
  })

  describe('createApiKey', () => {
    it('returns the new key in data array (shown once only)', async () => {
      mockOk({
        data: [mockApiKeyWithSecret],
        message: 'Resource created successfully',
        meta: { success: 1, failed: 0 },
      })
      const res = await service.createApiKey({
        name: 'Integration Service',
        role: 'user',
        can_write: false,
        collections: ['products'],
        is_website: true,
        allowed_origins: ['https://moon.devnodes.in'],
        rate_limit: 5,
        captcha_required: true,
        enabled: true,
      })
      expect(res.data[0].key).toBe('moon_live_abc123')
      expect(res.message).toBe('Resource created successfully')
    })

    it('sends op:create with data array to /data/apikeys:mutate', async () => {
      mockOk({ data: [mockApiKeyWithSecret], message: 'Resource created successfully', meta: { success: 1, failed: 0 } })
      await service.createApiKey({
        name: 'Test',
        role: 'user',
        can_write: false,
        collections: ['products'],
        is_website: true,
        allowed_origins: ['https://moon.devnodes.in'],
        rate_limit: 5,
        captcha_required: true,
        enabled: true,
      })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/apikeys:mutate')
      expect(body.op).toBe('create')
      expect(body.data[0].name).toBe('Test')
      expect(body.data[0].collections).toEqual(['products'])
      expect(body.data[0].is_website).toBe(true)
      expect(body.data[0].allowed_origins).toEqual(['https://moon.devnodes.in'])
      expect(body.data[0].rate_limit).toBe(5)
      expect(body.data[0].captcha_required).toBe(true)
      expect(body.data[0].enabled).toBe(true)
    })

    it('throws on failure', async () => {
      mockFail(400, 'Name already taken')
      await expect(
        service.createApiKey({
          name: 'dup',
          role: 'user',
          can_write: false,
          collections: [],
          is_website: false,
          allowed_origins: null,
          rate_limit: 15,
          captcha_required: false,
          enabled: true,
        }),
      ).rejects.toMatchObject({ message: 'Name already taken' })
    })
  })

  describe('updateApiKey', () => {
    it('sends op:update with data array to /data/apikeys:mutate', async () => {
      mockOk({ data: [mockApiKey], message: 'Resource updated successfully', meta: { success: 1, failed: 0 } })
      await service.updateApiKey('01KJ100', {
        name: 'New Name',
        can_write: true,
        collections: ['products'],
        is_website: false,
        allowed_origins: null,
        rate_limit: 10,
        captcha_required: false,
        enabled: false,
      })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/apikeys:mutate')
      expect(body.op).toBe('update')
      expect(body.data[0].id).toBe('01KJ100')
      expect(body.data[0].name).toBe('New Name')
      expect(body.data[0].collections).toEqual(['products'])
      expect(body.data[0].is_website).toBe(false)
      expect(body.data[0].allowed_origins).toBeNull()
      expect(body.data[0].rate_limit).toBe(10)
      expect(body.data[0].captcha_required).toBe(false)
      expect(body.data[0].enabled).toBe(false)
    })
  })

  describe('rotateApiKey', () => {
    it('returns new key in data array', async () => {
      mockOk({
        data: [{ ...mockApiKey, key: 'moon_live_newkey456' }],
        message: 'Action completed successfully',
        meta: { success: 1, failed: 0 },
      })
      const res = await service.rotateApiKey('01KJ100')
      expect(res.data[0].key).toBe('moon_live_newkey456')
    })

    it('sends op:action with action:rotate to /data/apikeys:mutate', async () => {
      mockOk({ data: [mockApiKeyWithSecret], message: 'Action completed successfully', meta: { success: 1, failed: 0 } })
      await service.rotateApiKey('01KJ100')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/apikeys:mutate')
      expect(body.op).toBe('action')
      expect(body.action).toBe('rotate')
      expect(body.data[0].id).toBe('01KJ100')
    })
  })

  describe('deleteApiKey', () => {
    it('sends op:destroy to /data/apikeys:mutate', async () => {
      mockOk({ message: 'Resource destroyed successfully', meta: { success: 1, failed: 0 } })
      const res = await service.deleteApiKey('01KJ100')
      expect(res.message).toContain('destroyed')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/data/apikeys:mutate')
      expect(body.op).toBe('destroy')
      expect(body.data[0].id).toBe('01KJ100')
    })

    it('throws on failure', async () => {
      mockFail(404, 'Key not found')
      await expect(service.deleteApiKey('bad')).rejects.toMatchObject({ status: 404 })
    })
  })
})
