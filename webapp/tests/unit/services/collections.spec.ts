import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCollectionsService } from '@/services/collections'

const BASE_URL = 'https://test.moon.dev'
const CONN_ID = 'test-conn'

const mockCollection = { name: 'products', count: 5, system: false }

const mockDetail = {
  name: 'products',
  columns: [
    { name: 'title', type: 'string', nullable: false, unique: true },
    { name: 'price', type: 'decimal', nullable: false, unique: false },
  ],
}

const mockSchema = {
  name: 'products',
  fields: [
    { name: 'id', type: 'id', nullable: true, unique: false, readonly: true },
    { name: 'title', type: 'string', nullable: false, unique: false, readonly: false },
    { name: 'price', type: 'decimal', nullable: false, unique: false, readonly: false },
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
        meta: { count: 1, current_page: 1, per_page: 15, total: 1, total_pages: 1 },
        links: { first: null, last: null, next: null, prev: null },
      })
      const res = await service.listCollections()
      expect(res.data).toHaveLength(1)
      expect(res.data[0].name).toBe('products')
      expect(res.data[0].count).toBe(5)
    })

    it('passes page pagination params', async () => {
      mockOk({ data: [], meta: { count: 0, current_page: 2, per_page: 15, total: 0, total_pages: 0 }, links: {} })
      await service.listCollections({ page: '2', per_page: '15' })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('page=2')
    })

    it('hits /collections:query endpoint', async () => {
      mockOk({ data: [], meta: { count: 0, current_page: 1, per_page: 15, total: 0, total_pages: 0 }, links: {} })
      await service.listCollections()
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:query')
    })

    it('throws on API error', async () => {
      mockFail(401, 'authentication required')
      await expect(service.listCollections()).rejects.toMatchObject({ status: 401 })
    })
  })

  describe('getCollection', () => {
    it('returns collection detail array with columns', async () => {
      mockOk({ data: [mockDetail], message: 'Collection retrieved successfully' })
      const res = await service.getCollection('products')
      expect(res.data[0].name).toBe('products')
      expect(res.data[0].columns).toHaveLength(2)
      expect(res.data[0].columns[0].name).toBe('title')
    })

    it('sends ?name= in URL to /collections:query', async () => {
      mockOk({ data: [mockDetail] })
      await service.getCollection('products')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/collections:query')
      expect(url).toContain('name=products')
    })

    it('throws on not found', async () => {
      mockFail(404, 'Collection not found')
      await expect(service.getCollection('missing')).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('getSchema', () => {
    it('returns schema with fields array for the collection', async () => {
      mockOk({ data: [mockSchema], message: 'Schema retrieved successfully' })
      const res = await service.getSchema('products')
      expect(res.data[0].name).toBe('products')
      expect(res.data[0].fields).toHaveLength(3)
      expect(res.data[0].fields[0].name).toBe('id')
      expect(res.data[0].fields[0].readonly).toBe(true)
    })

    it('hits /data/{name}:schema endpoint', async () => {
      mockOk({ data: [mockSchema] })
      await service.getSchema('products')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      expect(url).toContain('/data/products:schema')
    })

    it('throws on not found', async () => {
      mockFail(404, 'Collection not found')
      await expect(service.getSchema('missing')).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('createCollection', () => {
    it('returns created collection detail with message', async () => {
      mockOk({
        data: [mockDetail],
        message: 'Collection created successfully',
        meta: { success: 1, failed: 0 },
      }, 201)
      const res = await service.createCollection({
        name: 'products',
        columns: [{ name: 'title', type: 'string', nullable: false }],
      })
      expect(res.data[0].name).toBe('products')
      expect(res.message).toContain('created successfully')
    })

    it('sends op:create with data array to /collections:mutate', async () => {
      mockOk({ data: [mockDetail], message: 'created', meta: { success: 1, failed: 0 } }, 201)
      await service.createCollection({
        name: 'products',
        columns: [{ name: 'title', type: 'string', nullable: false }],
      })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/collections:mutate')
      expect(body.op).toBe('create')
      expect(body.data[0].name).toBe('products')
      expect(body.data[0].columns).toHaveLength(1)
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
    it('sends op:update with add_columns to /collections:mutate', async () => {
      mockOk({ data: [mockDetail], message: 'Collection updated successfully', meta: { success: 1, failed: 0 } })
      await service.updateCollection({
        name: 'products',
        add_columns: [{ name: 'stock', type: 'integer', nullable: false }],
      })
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/collections:mutate')
      expect(body.op).toBe('update')
      expect(body.data[0].name).toBe('products')
      expect(body.data[0].add_columns).toHaveLength(1)
      expect(body.data[0].add_columns[0].name).toBe('stock')
    })

    it('sends remove_columns payload', async () => {
      mockOk({ data: [mockDetail], message: 'updated', meta: { success: 1, failed: 0 } })
      await service.updateCollection({
        name: 'products',
        remove_columns: ['price'],
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data[0].remove_columns).toContain('price')
    })

    it('sends rename_columns payload', async () => {
      mockOk({ data: [mockDetail], message: 'updated', meta: { success: 1, failed: 0 } })
      await service.updateCollection({
        name: 'products',
        rename_columns: [{ old_name: 'title', new_name: 'name' }],
      })
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(body.data[0].rename_columns[0].old_name).toBe('title')
      expect(body.data[0].rename_columns[0].new_name).toBe('name')
    })

    it('throws on failure', async () => {
      mockFail(400, 'Column not found')
      await expect(
        service.updateCollection({ name: 'products', remove_columns: ['nonexistent'] }),
      ).rejects.toMatchObject({ message: 'Column not found' })
    })
  })

  describe('deleteCollection', () => {
    it('sends op:destroy to /collections:mutate', async () => {
      mockOk({ message: 'Collection destroyed successfully', meta: { success: 1, failed: 0 } })
      const res = await service.deleteCollection('products')
      expect(res.message).toContain('destroyed successfully')
      const url = vi.mocked(fetch).mock.calls[0][0] as string
      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
      expect(url).toContain('/collections:mutate')
      expect(body.op).toBe('destroy')
      expect(body.data[0].name).toBe('products')
    })

    it('throws on failure', async () => {
      mockFail(404, 'Collection not found')
      await expect(service.deleteCollection('missing')).rejects.toMatchObject({ status: 404 })
    })
  })
})
