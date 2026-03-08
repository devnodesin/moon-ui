import { createHttpClient } from './http'
import type { ApiListResponse, ApiGetResponse, ApiMutateResponse, ApiDestroyResponse, ApiKey } from '@/types/api'

export interface CreateApiKeyPayload {
  name: string
  role: 'admin' | 'user'
  can_write: boolean
}

export interface UpdateApiKeyPayload {
  name?: string
  can_write?: boolean
}

// key is only returned on create and rotate — not in list
export interface ApiKeyWithSecret extends ApiKey {
  key: string
}

export function createApiKeysService(baseUrl: string, connId: string) {
  const http = createHttpClient(baseUrl, connId)

  return {
    async listApiKeys(params: Record<string, string> = {}): Promise<ApiListResponse<ApiKey>> {
      return http.get<ApiListResponse<ApiKey>>('/data/apikeys:query', params)
    },

    async getApiKey(id: string): Promise<ApiGetResponse<ApiKey>> {
      return http.get<ApiGetResponse<ApiKey>>('/data/apikeys:query', { id })
    },

    async createApiKey(payload: CreateApiKeyPayload): Promise<ApiMutateResponse<ApiKeyWithSecret>> {
      return http.post<ApiMutateResponse<ApiKeyWithSecret>>('/data/apikeys:mutate', {
        op: 'create',
        data: [payload],
      })
    },

    async updateApiKey(
      id: string,
      payload: UpdateApiKeyPayload,
    ): Promise<ApiMutateResponse<ApiKey>> {
      return http.post<ApiMutateResponse<ApiKey>>('/data/apikeys:mutate', {
        op: 'update',
        data: [{ id, ...payload }],
      })
    },

    // Rotate returns new key value (shown once only)
    async rotateApiKey(id: string): Promise<ApiMutateResponse<ApiKeyWithSecret>> {
      return http.post<ApiMutateResponse<ApiKeyWithSecret>>('/data/apikeys:mutate', {
        op: 'action',
        action: 'rotate',
        data: [{ id }],
      })
    },

    async deleteApiKey(id: string): Promise<ApiDestroyResponse> {
      return http.post<ApiDestroyResponse>('/data/apikeys:mutate', {
        op: 'destroy',
        data: [{ id }],
      })
    },
  }
}

export type ApiKeysService = ReturnType<typeof createApiKeysService>
