export interface ApiError {
  message: string
  status: number
  requestId?: string
}

export interface ApiListMeta {
  count: number
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ApiListLinks {
  first: string | null
  last: string | null
  next: string | null
  prev: string | null
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiListMeta
  links: ApiListLinks
}

export interface ApiGetResponse<T> {
  data: T[]
  message?: string
}

export interface ApiMutateResponse<T> {
  data: T[]
  message: string
  meta: {
    success: number
    failed: number
  }
}

export interface ApiDestroyResponse {
  message: string
  meta: {
    success: number
    failed: number
  }
}

export interface AuthUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  can_write: boolean
  created_at?: string
  updated_at?: string
  last_login_at?: string | null
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_at: string
  token_type: string
  user: AuthUser
}

export interface AuthLoginRequest {
  username: string
  password: string
}

export interface AuthRefreshRequest {
  refresh_token: string
}

export interface HealthData {
  moon: string
  timestamp: string
}

export interface CollectionSummary {
  name: string
  count: number
}

// Column definition used in the collections management API
export interface CollectionColumn {
  name: string
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'json'
  nullable: boolean
  unique?: boolean
  default?: string
}

// Full collection definition returned by /collections:mutate (create/update)
export interface CollectionDetail {
  name: string
  columns: CollectionColumn[]
}

// Response from /collections:mutate (create/update)
export interface CollectionActionResponse {
  data: CollectionDetail[]
  message: string
  meta?: { success: number; failed: number }
}

// Response from /collections:mutate (destroy)
export interface CollectionDestroyResponse {
  message: string
  data?: { name: string }[]
  meta?: { success: number; failed: number }
}

export interface CollectionField {
  name: string
  type: 'id' | 'string' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'json'
  nullable: boolean
  unique?: boolean
  readonly?: boolean
  default?: unknown
}

export interface CollectionSchema {
  name: string
  fields: CollectionField[]
}

export interface MoonUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  can_write: boolean
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

export interface ApiKey {
  id: string
  key?: string
  name: string
  role: 'admin' | 'user'
  can_write: boolean
  created_at: string
  updated_at?: string
  last_used_at?: string | null
}
