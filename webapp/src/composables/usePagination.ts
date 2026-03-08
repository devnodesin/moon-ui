import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface UsePaginationReturn {
  page: Ref<number>
  perPage: Ref<number>
  hasPrev: Ref<boolean>
  hasNext: Ref<boolean>
  totalPages: Ref<number>
  goNext: () => void
  goPrev: () => void
  reset: () => void
  setMeta: (meta: { current_page: number; total_pages: number }) => void
}

export function usePagination(defaultPerPage = 15): UsePaginationReturn {
  const page = ref(1)
  const perPage = ref(defaultPerPage)
  const totalPages = ref(0)

  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  function goNext(): void {
    if (page.value < totalPages.value) {
      page.value++
    }
  }

  function goPrev(): void {
    if (page.value > 1) {
      page.value--
    }
  }

  function reset(): void {
    page.value = 1
    totalPages.value = 0
  }

  function setMeta(meta: { current_page: number; total_pages: number }): void {
    page.value = meta.current_page
    totalPages.value = meta.total_pages
  }

  return { page, perPage, hasPrev, hasNext, totalPages, goNext, goPrev, reset, setMeta }
}
