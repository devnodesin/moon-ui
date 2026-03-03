<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { CollectionField } from '@/types/api'
import type { MoonRecord } from '@/services/records'
import EmptyState from './EmptyState.vue'

const props = withDefaults(
  defineProps<{
    columns: CollectionField[]
    rows: MoonRecord[]
    loading: boolean
    loadingType?: 'initial' | 'page' | 'filter' | 'sort'
    sortField?: string
    sortDir?: 'asc' | 'desc'
    showId?: boolean
    deletingId?: string | null
    selectedIds?: string[]
  }>(),
  {
    loadingType: 'initial',
    sortField: '',
    sortDir: 'asc',
    showId: false,
    deletingId: null,
    selectedIds: () => [],
  },
)

const emit = defineEmits<{
  sort: [field: string]
  rowClick: [id: string]
  view: [id: string]
  delete: [id: string]
  toggleRow: [id: string]
  toggleAll: []
}>()

const allSelected = computed(
  () => props.rows.length > 0 && props.rows.every((r) => props.selectedIds!.includes(r.id)),
)
const someSelected = computed(() => props.selectedIds!.length > 0 && !allSelected.value)

const selectAllRef = ref<HTMLInputElement | null>(null)
watchEffect(() => {
  if (selectAllRef.value) {
    selectAllRef.value.indeterminate = someSelected.value
  }
})

const SKELETON_COUNT = 5

const visibleColumns = computed(() =>
  props.columns.filter((col) => col.name !== 'id' || props.showId),
)

const showSkeleton = computed(
  () => props.loading && (props.loadingType === 'initial' || props.rows.length === 0),
)

const showOverlay = computed(
  () =>
    props.loading &&
    props.rows.length > 0 &&
    (props.loadingType === 'page' ||
      props.loadingType === 'filter' ||
      props.loadingType === 'sort'),
)

function isSortable(col: CollectionField): boolean {
  return col.type !== 'json'
}

function sortIcon(field: string): string {
  if (props.sortField !== field) return 'bi-arrow-down-up text-muted opacity-50'
  return props.sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'
}

function formatValue(value: unknown, type: CollectionField['type']): string {
  if (value === null || value === undefined || value === '') return '—'
  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'datetime':
      try {
        return new Date(value as string).toLocaleString()
      } catch {
        return String(value)
      }
    case 'json':
      return JSON.stringify(value)
    default:
      return String(value)
  }
}
</script>

<template>
  <div class="position-relative">
    <!-- Overlay shimmer for page / filter / sort reloads -->
    <div
      v-if="showOverlay"
      class="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center"
      style="z-index: 10"
    >
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading…</span>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th style="width: 40px" @click.stop>
              <input
                ref="selectAllRef"
                type="checkbox"
                class="form-check-input"
                :checked="allSelected"
                :disabled="showSkeleton || rows.length === 0"
                @change="emit('toggleAll')"
              />
            </th>
            <th
              v-for="col in visibleColumns"
              :key="col.name"
              :class="{ 'cursor-pointer user-select-none': isSortable(col) }"
              @click="isSortable(col) ? emit('sort', col.name) : undefined"
            >
              <span class="me-1 text-capitalize">{{ col.name.replace(/_/g, ' ') }}</span>
              <i v-if="isSortable(col)" class="bi small" :class="sortIcon(col.name)" />
            </th>
            <th style="width: 110px">Actions</th>
          </tr>
        </thead>

        <tbody>
          <!-- Skeleton rows for initial / empty loads -->
          <template v-if="showSkeleton">
            <tr v-for="n in SKELETON_COUNT" :key="n" aria-hidden="true">
              <td><span class="placeholder-glow d-block"><span class="placeholder col-12" /></span></td>
              <td v-for="col in visibleColumns" :key="col.name">
                <span class="placeholder-glow d-block">
                  <span class="placeholder" :class="n % 2 === 0 ? 'col-7' : 'col-10'" />
                </span>
              </td>
              <td>
                <span class="placeholder-glow d-block">
                  <span class="placeholder col-10" />
                </span>
              </td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else-if="rows.length > 0">
            <tr
              v-for="row in rows"
              :key="row.id"
              class="cursor-pointer"
              tabindex="0"
              @click="emit('rowClick', row.id)"
              @keydown.enter="emit('rowClick', row.id)"
            >
              <td @click.stop @keydown.stop>
                <input
                  type="checkbox"
                  class="form-check-input"
                  :checked="selectedIds!.includes(row.id)"
                  @change="emit('toggleRow', row.id)"
                />
              </td>
              <td v-for="col in visibleColumns" :key="col.name">
                <span v-if="col.type === 'id'" class="font-monospace small text-muted">
                  {{ String(row[col.name] ?? '—') }}
                </span>
                <span v-else>{{ formatValue(row[col.name], col.type) }}</span>
              </td>
              <td @click.stop @keydown.stop>
                <button
                  class="btn btn-sm btn-outline-secondary me-1"
                  title="View"
                  @click="emit('view', row.id)"
                >
                  <i class="bi bi-eye" />
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  title="Delete"
                  :disabled="deletingId === row.id"
                  @click="emit('delete', row.id)"
                >
                  <span
                    v-if="deletingId === row.id"
                    class="spinner-border spinner-border-sm"
                    role="status"
                  />
                  <i v-else class="bi bi-trash" />
                </button>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="visibleColumns.length + 2" class="p-0">
              <EmptyState icon="bi-inbox" title="No records found" message="Try adjusting your search or filters." />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
