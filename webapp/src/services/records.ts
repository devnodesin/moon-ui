import { createHttpClient } from './http'
import type {
  ApiListResponse,
  ApiGetResponse,
  ApiMutateResponse,
  ApiDestroyResponse,
  CollectionSchema,
} from '@/types/api'

export interface MoonRecord {
  id: string
  [key: string]: unknown
}

export function createRecordsService(baseUrl: string, connId: string) {
  const http = createHttpClient(baseUrl, connId)

  return {
    async listRecords(
      collection: string,
      params: Record<string, string> = {},
    ): Promise<ApiListResponse<MoonRecord>> {
      return http.get<ApiListResponse<MoonRecord>>(`/data/${collection}:query`, params)
    },

    async getRecord(collection: string, id: string): Promise<ApiGetResponse<MoonRecord>> {
      return http.get<ApiGetResponse<MoonRecord>>(`/data/${collection}:query`, { id })
    },

    async getSchema(collection: string): Promise<ApiGetResponse<CollectionSchema>> {
      return http.get<ApiGetResponse<CollectionSchema>>(`/data/${collection}:schema`)
    },

    async updateRecord(
      collection: string,
      patch: MoonRecord,
    ): Promise<ApiMutateResponse<MoonRecord>> {
      return http.post<ApiMutateResponse<MoonRecord>>(`/data/${collection}:mutate`, {
        op: 'update',
        data: [patch],
      })
    },

    async createRecord(
      collection: string,
      data: Omit<MoonRecord, 'id'>,
    ): Promise<ApiMutateResponse<MoonRecord>> {
      return http.post<ApiMutateResponse<MoonRecord>>(`/data/${collection}:mutate`, {
        op: 'create',
        data: [data],
      })
    },

    async deleteRecords(collection: string, ids: string[]): Promise<ApiDestroyResponse> {
      return http.post<ApiDestroyResponse>(`/data/${collection}:mutate`, {
        op: 'destroy',
        data: ids.map((id) => ({ id })),
      })
    },
  }
}

export type RecordsService = ReturnType<typeof createRecordsService>
