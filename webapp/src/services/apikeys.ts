import { createHttpClient } from './http'
import type { ApiListResponse, ApiKey } from '@/types/api'

export interface CreateApiKeyPayload {
  name: string
  description: string
  role: 'admin' | 'user'
  can_write: boolean
}

export interface UpdateApiKeyPayload {
  name?: string
  description?: string
  can_write?: boolean
}

// key is only returned on create and rotate — not in list
export interface ApiKeyWithSecret extends ApiKey {
  key: string
}

export interface ApiKeyCreateResponse {
  data: ApiKeyWithSecret
  message: string
  warning?: string
}

export interface ApiKeyRotateResponse {
  data: ApiKeyWithSecret
  message: string
  warning?: string
}

export interface ApiKeyActionResponse {
  message: string
}

export function createApiKeysService(baseUrl: string, connId: string) {
  const http = createHttpClient(baseUrl, connId)

  return {
    async listApiKeys(params: Record<string, string> = {}): Promise<ApiListResponse<ApiKey>> {
      return http.get<ApiListResponse<ApiKey>>('/apikeys:list', params)
    },

    // Body wrapped in { data: {...} } per moon-llms.md
    async createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyCreateResponse> {
      return http.post<ApiKeyCreateResponse>('/apikeys:create', { data: payload })
    },

    // Body wrapped in { data: {...} } per moon-llms.md
    async updateApiKey(id: string, payload: UpdateApiKeyPayload): Promise<ApiKeyActionResponse> {
      return http.post<ApiKeyActionResponse>(`/apikeys:update?id=${id}`, { data: payload })
    },

    // Rotate returns new key value (shown once only)
    async rotateApiKey(id: string): Promise<ApiKeyRotateResponse> {
      return http.post<ApiKeyRotateResponse>(`/apikeys:update?id=${id}`, {
        data: { action: 'rotate' },
      })
    },

    // No body per moon-llms.md
    async deleteApiKey(id: string): Promise<ApiKeyActionResponse> {
      return http.post<ApiKeyActionResponse>(`/apikeys:destroy?id=${id}`)
    },
  }
}

export type ApiKeysService = ReturnType<typeof createApiKeysService>
