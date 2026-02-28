import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface UsePaginationReturn {
  after: Ref<string | null>
  limit: Ref<number>
  hasPrev: Ref<boolean>
  hasNext: Ref<boolean>
  prevCursor: Ref<string | null>
  goNext: (cursor: string | null) => void
  goPrev: () => void
  reset: () => void
  setNext: (cursor: string | null) => void
  setPrev: (cursor: string | null) => void
}

export function usePagination(defaultLimit = 15): UsePaginationReturn {
  const after = ref<string | null>(null)
  const limit = ref(defaultLimit)
  const history = ref<(string | null)[]>([])
  const nextCursor = ref<string | null>(null)
  const prevCursor = ref<string | null>(null)

  const hasPrev = computed(() => history.value.length > 0)
  const hasNext = computed(() => !!nextCursor.value)

  function goNext(cursor: string | null): void {
    history.value = [...history.value, after.value]
    after.value = cursor
  }

  function goPrev(): void {
    after.value = history.value[history.value.length - 1] ?? null
    history.value = history.value.slice(0, -1)
  }

  function reset(): void {
    after.value = null
    history.value = []
    nextCursor.value = null
    prevCursor.value = null
  }

  function setNext(cursor: string | null): void {
    nextCursor.value = cursor
  }

  function setPrev(cursor: string | null): void {
    prevCursor.value = cursor
  }

  return { after, limit, hasPrev, hasNext, prevCursor, goNext, goPrev, reset, setNext, setPrev }
}
