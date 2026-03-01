export interface ApiError {
  message: string
  status: number
  requestId?: string
}

export interface ApiListMeta {
  count: number
  limit: number
  next: string | null
  prev: string | null
  total?: number
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiListMeta
}

export interface ApiGetResponse<T> {
  data: T
}

export interface ApiMutateResponse<T> {
  data: T[]
  message: string
  meta: {
    total: number
    succeeded: number
    failed: number
  }
}

export interface ApiDestroyResponse {
  data: string[]
  message: string
  meta: {
    total: number
    succeeded: number
    failed: number
  }
}

export interface AuthUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  can_write: boolean
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
  records: number
}

// Column definition used in the collections management API (/collections:create, :get, :update)
export interface CollectionColumn {
  name: string
  type: 'string' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'json'
  nullable: boolean
  unique?: boolean
  default?: string
}

// Full collection definition returned by /collections:get
export interface CollectionDetail {
  name: string
  columns: CollectionColumn[]
}

// Response from /collections:create and /collections:update
export interface CollectionActionResponse {
  data: CollectionDetail
  message: string
}

// Response from /collections:destroy
export interface CollectionDestroyResponse {
  message: string
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
  collection: string
  fields: CollectionField[]
  total: number
}

export interface MoonUser {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  can_write: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface ApiKey {
  id: string
  key?: string
  name: string
  description: string
  role: 'admin' | 'user'
  can_write: boolean
  created_at: string
}
