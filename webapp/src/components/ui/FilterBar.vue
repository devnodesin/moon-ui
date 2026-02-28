<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CollectionField } from '@/types/api'

interface FilterEntry {
  field: string
  op: string
  value: string
}

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'like', label: 'like' },
  { value: 'in', label: 'in' },
]

const props = defineProps<{
  columns: CollectionField[]
}>()

const emit = defineEmits<{
  apply: [params: Record<string, string>]
}>()

const filterableColumns = computed(() =>
  props.columns.filter((col) => col.type !== 'id' && col.type !== 'json'),
)

const entries = ref<FilterEntry[]>([])

function defaultField(): string {
  return filterableColumns.value[0]?.name ?? ''
}

function addEntry(): void {
  entries.value = [...entries.value, { field: defaultField(), op: 'eq', value: '' }]
}

function removeEntry(index: number): void {
  entries.value = entries.value.filter((_, i) => i !== index)
}

function buildParams(): Record<string, string> {
  const params: Record<string, string> = {}
  for (const e of entries.value) {
    if (e.field && e.value !== '') {
      params[`${e.field}[${e.op}]`] = e.value
    }
  }
  return params
}

function apply(): void {
  emit('apply', buildParams())
}

function reset(): void {
  entries.value = []
  emit('apply', {})
}
</script>

<template>
  <div class="card border-0 bg-light mb-3">
    <div class="card-body py-2 px-3">
      <div v-if="entries.length === 0" class="d-flex align-items-center gap-2 py-1">
        <span class="text-muted small">No filters applied.</span>
        <button class="btn btn-sm btn-outline-secondary" @click="addEntry">
          <i class="bi bi-plus me-1" />Add filter
        </button>
      </div>

      <div v-else>
        <div
          v-for="(entry, index) in entries"
          :key="index"
          class="d-flex flex-wrap align-items-center gap-2 mb-2"
        >
          <select v-model="entry.field" class="form-select form-select-sm" style="width: auto">
            <option v-for="col in filterableColumns" :key="col.name" :value="col.name">
              {{ col.name.replace(/_/g, ' ') }}
            </option>
          </select>

          <select v-model="entry.op" class="form-select form-select-sm" style="width: 70px">
            <option v-for="op in OPERATORS" :key="op.value" :value="op.value">
              {{ op.label }}
            </option>
          </select>

          <input
            v-model="entry.value"
            type="text"
            class="form-control form-control-sm"
            placeholder="Value"
            style="width: 180px"
            @keydown.enter="apply"
          />

          <button
            class="btn btn-sm btn-outline-danger"
            title="Remove filter"
            @click="removeEntry(index)"
          >
            <i class="bi bi-x" />
          </button>
        </div>

        <div class="d-flex gap-2 mt-1">
          <button class="btn btn-sm btn-outline-secondary" @click="addEntry">
            <i class="bi bi-plus me-1" />Add
          </button>
          <button class="btn btn-sm btn-primary" @click="apply">
            <i class="bi bi-funnel me-1" />Apply
          </button>
          <button class="btn btn-sm btn-link text-muted" @click="reset">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>
