<script setup lang="ts">
import { computed } from 'vue'
import type { ApiListMeta } from '@/types/api'

const props = defineProps<{
  meta: ApiListMeta | null
  perPage: number
  hasPrev: boolean
  hasNext: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  perPageChange: [perPage: number]
}>()

const PAGE_SIZES = [15, 30, 50, 100]

const rangeText = computed(() => {
  if (!props.meta) return ''
  const { total, current_page, per_page } = props.meta
  const start = (current_page - 1) * per_page + 1
  const end = Math.min(current_page * per_page, total)
  if (total === 0) return 'No records'
  return `Showing ${start}–${end} of ${total} record${total !== 1 ? 's' : ''}`
})

const pageText = computed(() => {
  if (!props.meta) return ''
  return `Page ${props.meta.current_page} of ${props.meta.total_pages}`
})
</script>

<template>
  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-1">
    <div class="d-flex flex-row gap-2">
      <span v-if="meta && meta.total_pages > 1" class="text-muted small">{{ pageText }}</span>
      <span class="text-muted small">( {{ rangeText }} )</span>
    </div>

    <div class="d-flex align-items-center gap-2">
      <select
        class="form-select form-select-sm"
        style="width: auto"
        :value="perPage"
        @change="emit('perPageChange', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }} / page</option>
      </select>

      <button
        class="btn btn-sm btn-outline-secondary"
        :disabled="!hasPrev"
        @click="emit('prev')"
      >
        <i class="bi bi-chevron-left" /> Prev
      </button>

      <button
        class="btn btn-sm btn-outline-secondary"
        :disabled="!hasNext"
        @click="emit('next')"
      >
        Next <i class="bi bi-chevron-right" />
      </button>
    </div>
  </div>
</template>
