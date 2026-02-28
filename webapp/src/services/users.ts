import { createHttpClient } from './http'
import type { ApiListResponse, ApiGetResponse, MoonUser } from '@/types/api'

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
}

export interface UserCreateResponse {
  data: MoonUser
  message: string
}

export interface UserActionResponse {
  message: string
}

export function createUsersService(baseUrl: string, connId: string) {
  const http = createHttpClient(baseUrl, connId)

  return {
    async listUsers(params: Record<string, string> = {}): Promise<ApiListResponse<MoonUser>> {
      return http.get<ApiListResponse<MoonUser>>('/users:list', params)
    },

    async getUser(id: string): Promise<ApiGetResponse<MoonUser>> {
      return http.get<ApiGetResponse<MoonUser>>('/users:get', { id })
    },

    // Body wrapped in { data: {...} } per moon-llms.md
    async createUser(payload: CreateUserPayload): Promise<UserCreateResponse> {
      return http.post<UserCreateResponse>('/users:create', { data: payload })
    },

    // Body is direct fields (NOT wrapped) per moon-llms.md
    async updateUser(id: string, payload: UpdateUserPayload): Promise<UserActionResponse> {
      return http.post<UserActionResponse>(`/users:update?id=${id}`, payload)
    },

    async resetPassword(id: string, newPassword: string): Promise<UserActionResponse> {
      return http.post<UserActionResponse>(`/users:update?id=${id}`, {
        action: 'reset_password',
        new_password: newPassword,
      })
    },

    async revokeSessions(id: string): Promise<UserActionResponse> {
      return http.post<UserActionResponse>(`/users:update?id=${id}`, {
        action: 'revoke_sessions',
      })
    },

    // No body per moon-llms.md
    async deleteUser(id: string): Promise<UserActionResponse> {
      return http.post<UserActionResponse>(`/users:destroy?id=${id}`)
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
