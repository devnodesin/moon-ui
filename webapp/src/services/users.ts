import { createHttpClient } from './http'
import type { ApiListResponse, ApiGetResponse, ApiMutateResponse, ApiDestroyResponse, MoonUser } from '@/types/api'

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role: 'admin' | 'user'
  can_write?: boolean
}

export interface UpdateUserPayload {
  email?: string
  role?: 'admin' | 'user'
  can_write?: boolean
  password?: string
}

export function createUsersService(baseUrl: string, connId: string) {
  const http = createHttpClient(baseUrl, connId)

  return {
    async listUsers(params: Record<string, string> = {}): Promise<ApiListResponse<MoonUser>> {
      return http.get<ApiListResponse<MoonUser>>('/data/users:query', params)
    },

    async getUser(id: string): Promise<ApiGetResponse<MoonUser>> {
      return http.get<ApiGetResponse<MoonUser>>('/data/users:query', { id })
    },

    async createUser(payload: CreateUserPayload): Promise<ApiMutateResponse<MoonUser>> {
      return http.post<ApiMutateResponse<MoonUser>>('/data/users:mutate', {
        op: 'create',
        data: [payload],
      })
    },

    async updateUser(
      id: string,
      payload: UpdateUserPayload,
    ): Promise<ApiMutateResponse<MoonUser>> {
      return http.post<ApiMutateResponse<MoonUser>>('/data/users:mutate', {
        op: 'update',
        data: [{ id, ...payload }],
      })
    },

    async deleteUser(id: string): Promise<ApiDestroyResponse> {
      return http.post<ApiDestroyResponse>('/data/users:mutate', {
        op: 'destroy',
        data: [{ id }],
      })
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
