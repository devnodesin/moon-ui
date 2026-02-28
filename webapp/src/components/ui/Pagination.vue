<script setup lang="ts">
import { computed } from 'vue'
import type { ApiListMeta } from '@/types/api'

const props = defineProps<{
  meta: ApiListMeta | null
  limit: number
  hasPrev: boolean
  hasNext: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  limitChange: [limit: number]
}>()

const PAGE_SIZES = [15, 30, 50, 100]

const rangeText = computed(() => {
  if (!props.meta) return ''
  const { count, total } = props.meta
  return `Showing ${count} of ${total} record${total !== 1 ? 's' : ''}`
})
</script>

<template>
  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-1">
    <span class="text-muted small">{{ rangeText }}</span>

    <div class="d-flex align-items-center gap-2">
      <select
        class="form-select form-select-sm"
        style="width: auto"
        :value="limit"
        @change="emit('limitChange', Number(($event.target as HTMLSelectElement).value))"
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
