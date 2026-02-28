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
      return http.get<ApiListResponse<MoonRecord>>(`/${collection}:list`, params)
    },

    async getRecord(collection: string, id: string): Promise<ApiGetResponse<MoonRecord>> {
      return http.get<ApiGetResponse<MoonRecord>>(`/${collection}:get`, { id })
    },

    async getSchema(collection: string): Promise<ApiGetResponse<CollectionSchema>> {
      return http.get<ApiGetResponse<CollectionSchema>>(`/${collection}:schema`)
    },

    async updateRecord(
      collection: string,
      patch: MoonRecord,
    ): Promise<ApiMutateResponse<MoonRecord>> {
      return http.post<ApiMutateResponse<MoonRecord>>(`/${collection}:update`, { data: [patch] })
    },

    async deleteRecords(collection: string, ids: string[]): Promise<ApiDestroyResponse> {
      return http.post<ApiDestroyResponse>(`/${collection}:destroy`, { data: ids })
    },
  }
}

export type RecordsService = ReturnType<typeof createRecordsService>
