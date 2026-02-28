import { describe, it, expect } from 'vitest'
import { usePagination } from '@/composables/usePagination'

describe('usePagination', () => {
  it('starts on first page', () => {
    const { after, hasPrev, hasNext } = usePagination()
    expect(after.value).toBeNull()
    expect(hasPrev.value).toBe(false)
    expect(hasNext.value).toBe(false)
  })

  it('goes to next page', () => {
    const { after, hasPrev, goNext, setNext } = usePagination()
    setNext('cursor1')
    goNext('cursor1')
    expect(after.value).toBe('cursor1')
    expect(hasPrev.value).toBe(true)
  })

  it('goes back to previous page', () => {
    const { after, goPrev, goNext } = usePagination()
    goNext('cursor1')
    goNext('cursor2')
    goPrev()
    expect(after.value).toBe('cursor1')
  })

  it('resets to first page', () => {
    const { after, hasPrev, goNext, setNext, reset } = usePagination()
    setNext('cursor1')
    goNext('cursor1')
    reset()
    expect(after.value).toBeNull()
    expect(hasPrev.value).toBe(false)
  })
})
