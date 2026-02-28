import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ApiError } from '@/types/api'

export interface UseAsyncReturn<T> {
  loading: Ref<boolean>
  error: Ref<string | null>
  data: Ref<T | null>
  execute: () => Promise<void>
}

export function useAsync<T>(fn: () => Promise<T>): UseAsyncReturn<T> {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const data = ref<T | null>(null) as Ref<T | null>

  async function execute(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      data.value = await fn()
    } catch (err) {
      const apiErr = err as ApiError
      error.value = apiErr.message ?? 'An unexpected error occurred'
      console.error('[useAsync] Error:', err)
    } finally {
      loading.value = false
    }
  }

  return { loading, error, data, execute }
}
