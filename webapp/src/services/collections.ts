import { createHttpClient } from './http'
import type {
  ApiListResponse,
  ApiGetResponse,
  CollectionSummary,
  CollectionColumn,
  CollectionDetail,
  CollectionActionResponse,
  CollectionDestroyResponse,
} from '@/types/api'

export interface CollectionCreatePayload {
  name: string
  columns: CollectionColumn[]
}

export interface CollectionUpdatePayload {
  name: string
  add_columns?: CollectionColumn[]
  rename_columns?: { old_name: string; new_name: string }[]
  modify_columns?: CollectionColumn[]
  remove_columns?: string[]
}

export function createCollectionsService(baseUrl: string, connId: string) {
  const http = createHttpClient(baseUrl, connId)

  return {
    async listCollections(
      params: Record<string, string> = {},
    ): Promise<ApiListResponse<CollectionSummary>> {
      return http.get<ApiListResponse<CollectionSummary>>('/collections:query', params)
    },

    async getCollection(name: string): Promise<ApiGetResponse<CollectionDetail>> {
      return http.get<ApiGetResponse<CollectionDetail>>('/collections:query', { name })
    },

    async createCollection(payload: CollectionCreatePayload): Promise<CollectionActionResponse> {
      return http.post<CollectionActionResponse>('/collections:mutate', {
        op: 'create',
        data: [payload],
      })
    },

    async updateCollection(payload: CollectionUpdatePayload): Promise<CollectionActionResponse> {
      return http.post<CollectionActionResponse>('/collections:mutate', {
        op: 'update',
        data: [payload],
      })
    },

    async deleteCollection(name: string): Promise<CollectionDestroyResponse> {
      return http.post<CollectionDestroyResponse>('/collections:mutate', {
        op: 'destroy',
        data: [{ name }],
      })
    },
  }
}

export type CollectionsService = ReturnType<typeof createCollectionsService>
