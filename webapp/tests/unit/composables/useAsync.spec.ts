import { describe, it, expect } from 'vitest'
import { useAsync } from '@/composables/useAsync'

describe('useAsync', () => {
  it('starts with loading false and no data', () => {
    const { loading, data, error } = useAsync(async () => 42)
    expect(loading.value).toBe(false)
    expect(data.value).toBeNull()
    expect(error.value).toBeNull()
  })

  it('sets loading during execution and returns data', async () => {
    const { loading, data, execute } = useAsync(async () => 42)
    const promise = execute()
    expect(loading.value).toBe(true)
    await promise
    expect(loading.value).toBe(false)
    expect(data.value).toBe(42)
  })

  it('sets error on failure', async () => {
    const { error, execute } = useAsync(async () => {
      throw { message: 'Failed', status: 500 }
    })
    await execute()
    expect(error.value).toBe('Failed')
  })

  it('clears error on re-execute', async () => {
    let fail = true
    const { error, execute } = useAsync(async () => {
      if (fail) throw { message: 'Error', status: 500 }
      return 'ok'
    })
    await execute()
    expect(error.value).toBe('Error')
    fail = false
    await execute()
    expect(error.value).toBeNull()
  })
})
