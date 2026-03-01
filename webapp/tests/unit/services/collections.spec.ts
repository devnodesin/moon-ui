import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCollectionsService } from '@/services/collections'

const BASE_URL = 'https://test.moon.dev'
const CONN_ID = 'test-conn'

const mockCollection = { name: 'products', records: 5 }

const mockDetail = {
  name: 'products',
  columns: [
    { name: 'title', type: 'string', nullable: false, unique: true },
    { name: 'price', type: 'decimal', nullable: false, unique: false },
  ],
}

function mockOk(body: unknown, status = 200) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    status,
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

describe('createCollectionsService', () => {
  let service: ReturnType<typeof createCollectionsService>

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    localStorage.clear()
    service = createCollectionsService(BASE_URL, CONN_ID)
  })

  describe('listCollections', () => {
    it('returns paginated list of collections', async () => {
      mockOk({
        data: [mockCollection],
        meta: { count: 1, limit: 15, next: null, prev: null },
      })
      const res = await service.listCollections()
      expect(res.data).toHaveLength(1)
      expect(res.data[0].name).toBe('products')
      expect(res.data[0].records).toBe(5)
    })

    it('passes ?after= for cursor pagination', async () => {
      mockOk({ data: [], meta: { count: 0, limit: 15, next: null, prev: null } })
      await service.listCollections({ after: 'cur123' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('after=cur123')
    })

    it('passes ?limit= param', async () => {
      mockOk({ data: [], meta: { count: 0, limit: 30, next: null, prev: null } })
      await service.listCollections({ limit: '30' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('limit=30')
    })

    it('hits /collections:list endpoint', async () => {
      mockOk({ data: [], meta: { count: 0, limit: 15, next: null, prev: null } })
      await service.listCollections()
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:list')
    })

    it('throws on API error', async () => {
      mockFail(401, 'authentication required')
      await expect(service.listCollections()).rejects.toMatchObject({ status: 401 })
    })
  })

  describe('getCollection', () => {
    it('returns collection detail with columns', async () => {
      mockOk({ data: mockDetail })
      const res = await service.getCollection('products')
      expect(res.data.name).toBe('products')
      expect(res.data.columns).toHaveLength(2)
      expect(res.data.columns[0].name).toBe('title')
    })

    it('sends ?name= in URL', async () => {
      mockOk({ data: mockDetail })
      await service.getCollection('products')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:get')
      expect(url).toContain('name=products')
    })

    it('throws on not found', async () => {
      mockFail(404, 'Collection not found')
      await expect(service.getCollection('missing')).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('createCollection', () => {
    it('returns created collection detail with message', async () => {
      mockOk({ data: mockDetail, message: "Collection 'products' created successfully" }, 201)
      const res = await service.createCollection({
        name: 'products',
        columns: [{ name: 'title', type: 'string', nullable: false }],
      })
      expect(res.data.name).toBe('products')
      expect(res.message).toContain('created successfully')
    })

    it('wraps payload in { data: {...} }', async () => {
      mockOk({ data: mockDetail, message: 'created' }, 201)
      await service.createCollection({
        name: 'products',
        columns: [{ name: 'title', type: 'string', nullable: false }],
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body).toHaveProperty('data')
      expect(body.data.name).toBe('products')
      expect(body.data.columns).toHaveLength(1)
    })

    it('hits /collections:create endpoint', async () => {
      mockOk({ data: mockDetail, message: 'created' }, 201)
      await service.createCollection({
        name: 'products',
        columns: [{ name: 'title', type: 'string', nullable: false }],
      })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:create')
    })

    it('throws on failure', async () => {
      mockFail(409, 'Collection already exists')
      await expect(
        service.createCollection({
          name: 'products',
          columns: [{ name: 'title', type: 'string', nullable: false }],
        }),
      ).rejects.toMatchObject({ message: 'Collection already exists' })
    })
  })

  describe('updateCollection', () => {
    it('sends add_columns payload', async () => {
      mockOk({ data: mockDetail, message: "Collection 'products' updated successfully" })
      await service.updateCollection({
        name: 'products',
        add_columns: [{ name: 'stock', type: 'integer', nullable: false }],
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data.name).toBe('products')
      expect(body.data.add_columns).toHaveLength(1)
      expect(body.data.add_columns[0].name).toBe('stock')
    })

    it('sends remove_columns payload', async () => {
      mockOk({ data: mockDetail, message: 'updated' })
      await service.updateCollection({
        name: 'products',
        remove_columns: ['price'],
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data.remove_columns).toContain('price')
    })

    it('sends rename_columns payload', async () => {
      mockOk({ data: mockDetail, message: 'updated' })
      await service.updateCollection({
        name: 'products',
        rename_columns: [{ old_name: 'title', new_name: 'name' }],
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data.rename_columns[0].old_name).toBe('title')
      expect(body.data.rename_columns[0].new_name).toBe('name')
    })

    it('hits /collections:update endpoint', async () => {
      mockOk({ data: mockDetail, message: 'updated' })
      await service.updateCollection({ name: 'products', remove_columns: ['price'] })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:update')
    })

    it('throws on failure', async () => {
      mockFail(400, 'Column not found')
      await expect(
        service.updateCollection({ name: 'products', remove_columns: ['nonexistent'] }),
      ).rejects.toMatchObject({ message: 'Column not found' })
    })
  })

  describe('deleteCollection', () => {
    it('calls correct endpoint with ?name=', async () => {
      mockOk({ message: "Collection 'products' deleted successfully" })
      const res = await service.deleteCollection('products')
      expect(res.message).toContain('deleted successfully')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:destroy')
      expect(url).toContain('name=products')
    })

    it('URL-encodes the collection name', async () => {
      mockOk({ message: 'deleted' })
      await service.deleteCollection('my collection')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('name=my%20collection')
    })

    it('throws on failure', async () => {
      mockFail(404, 'Collection not found')
      await expect(service.deleteCollection('missing')).rejects.toMatchObject({ status: 404 })
    })
  })
})
