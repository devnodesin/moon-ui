import { describe, it, expect } from 'vitest'
import { usePagination } from '@/composables/usePagination'

describe('usePagination', () => {
  it('starts on first page', () => {
    const { page, hasPrev, hasNext } = usePagination()
    expect(page.value).toBe(1)
    expect(hasPrev.value).toBe(false)
    expect(hasNext.value).toBe(false)
  })

  it('goes to next page', () => {
    const { page, hasPrev, hasNext, setMeta, goNext } = usePagination()
    setMeta({ current_page: 1, total_pages: 3 })
    goNext()
    expect(page.value).toBe(2)
    expect(hasPrev.value).toBe(true)
    expect(hasNext.value).toBe(true)
  })

  it('goes back to previous page', () => {
    const { page, goPrev, setMeta, goNext } = usePagination()
    setMeta({ current_page: 1, total_pages: 3 })
    goNext()
    goNext()
    goPrev()
    expect(page.value).toBe(2)
  })

  it('resets to first page', () => {
    const { page, hasPrev, setMeta, goNext, reset } = usePagination()
    setMeta({ current_page: 1, total_pages: 3 })
    goNext()
    reset()
    expect(page.value).toBe(1)
    expect(hasPrev.value).toBe(false)
  })

  it('does not go beyond last page', () => {
    const { page, hasNext, setMeta, goNext } = usePagination()
    setMeta({ current_page: 3, total_pages: 3 })
    goNext()
    expect(hasNext.value).toBe(false)
    expect(page.value).toBe(3)
  })

  it('does not go below page 1', () => {
    const { page, hasPrev, goPrev } = usePagination()
    goPrev()
    expect(page.value).toBe(1)
    expect(hasPrev.value).toBe(false)
  })

  it('setMeta updates page and totalPages', () => {
    const { page, totalPages, setMeta } = usePagination()
    setMeta({ current_page: 2, total_pages: 5 })
    expect(page.value).toBe(2)
    expect(totalPages.value).toBe(5)
  })
})
