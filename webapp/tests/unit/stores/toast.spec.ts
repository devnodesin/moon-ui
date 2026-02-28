import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('shows a toast', () => {
    const store = useToastStore()
    store.show('Hello', 'success')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].message).toBe('Hello')
    expect(store.toasts[0].type).toBe('success')
  })

  it('dismisses a toast', () => {
    const store = useToastStore()
    const id = store.show('Test', 'info')
    store.dismiss(id)
    expect(store.toasts).toHaveLength(0)
  })

  it('auto-dismisses success toast after 5s', () => {
    const store = useToastStore()
    store.show('Auto', 'success')
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(5001)
    expect(store.toasts).toHaveLength(0)
  })

  it('clears all toasts', () => {
    const store = useToastStore()
    store.show('A', 'info')
    store.show('B', 'error')
    store.clear()
    expect(store.toasts).toHaveLength(0)
  })

  it('caps toasts at 5', () => {
    const store = useToastStore()
    for (let i = 0; i < 7; i++) store.show(`Toast ${i}`, 'info', false)
    expect(store.toasts.length).toBeLessThanOrEqual(5)
  })
})
