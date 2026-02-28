<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useConfirm } from '@/composables/useConfirm'
import { createRecordsService } from '@/services/records'
import type { CollectionField, CollectionSchema, ApiListMeta } from '@/types/api'
import type { MoonRecord } from '@/services/records'

const props = defineProps<{ collection: string }>()
const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const { confirm } = useConfirm()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value
    ? createRecordsService(activeConn.value.baseUrl, activeConn.value.id)
    : null,
)

// Schema
const schema = ref<CollectionSchema | null>(null)
const schemaError = ref<string | null>(null)

const columns = computed<CollectionField[]>(() => schema.value?.fields ?? [])

// Records state
const rows = ref<MoonRecord[]>([])
const meta = ref<ApiListMeta | null>(null)
const loadingType = ref<'initial' | 'page' | 'filter' | 'sort'>('initial')
const loading = ref(false)
const loadError = ref<string | null>(null)

// Pagination — cursor-based, always ?after= for both directions
const limit = ref(15)
const afterCursor = ref<string | null>(null)   // current page cursor sent as ?after=
const prevCursor = ref<string | null>(null)     // meta.prev of current page (for going back)
const hasNext = ref(false)
const hasPrev = ref(false)

// Search / filter / sort
const searchQuery = ref('')
const activeSearch = ref('')
const filterParams = ref<Record<string, string>>({})
const sortField = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

// Column visibility
const showId = ref(localStorage.getItem('moon_table_showId') === 'true')

watch(showId, (v) => localStorage.setItem('moon_table_showId', String(v)))

// Delete
const deletingId = ref<string | null>(null)

// Build query params for the API call
function buildParams(): Record<string, string> {
  const p: Record<string, string> = { limit: String(limit.value) }

  if (afterCursor.value) p['after'] = afterCursor.value
  if (activeSearch.value) p['q'] = activeSearch.value
  if (sortField.value) p['sort'] = sortDir.value === 'desc' ? `-${sortField.value}` : sortField.value

  Object.assign(p, filterParams.value)
  return p
}

async function loadSchema(): Promise<void> {
  if (!service.value) return
  try {
    const res = await service.value.getSchema(props.collection)
    schema.value = res.data
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load schema'
    schemaError.value = msg
    toastStore.show(msg, 'error')
    console.error('[RecordsView] schema error:', err)
  }
}

async function loadRecords(type: typeof loadingType.value = 'initial'): Promise<void> {
  if (!service.value) return
  loadingType.value = type
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.listRecords(props.collection, buildParams())
    rows.value = res.data
    meta.value = res.meta
    // Both next and prev use ?after= — store cursors from meta
    hasNext.value = !!res.meta.next
    hasPrev.value = !!res.meta.prev
    prevCursor.value = res.meta.prev
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load records'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[RecordsView] load error:', err)
  } finally {
    loading.value = false
  }
}

// Sort: toggle direction if same field, else reset to asc
function handleSort(field: string): void {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
  resetPagination()
  loadRecords('sort')
}

// Search triggered by button / Enter
function handleSearch(): void {
  activeSearch.value = searchQuery.value
  resetPagination()
  loadRecords('filter')
}

// FilterBar emits a param map; re-fetch from first page
function handleFilter(params: Record<string, string>): void {
  filterParams.value = params
  resetPagination()
  loadRecords('filter')
}

function resetPagination(): void {
  afterCursor.value = null
  prevCursor.value = null
  hasNext.value = false
  hasPrev.value = false
}

// Pagination: pass meta.next as ?after= for next page
function goNext(): void {
  if (meta.value?.next) {
    afterCursor.value = meta.value.next
    loadRecords('page')
  }
}

// Pagination: pass meta.prev as ?after= for previous page
function goPrev(): void {
  if (prevCursor.value) {
    afterCursor.value = prevCursor.value
    loadRecords('page')
  }
}

function handleLimitChange(newLimit: number): void {
  limit.value = newLimit
  resetPagination()
  loadRecords('page')
}

// Row navigation
function handleRowClick(id: string): void {
  router.push({ name: 'record-view', params: { collection: props.collection, id } })
}

function handleView(id: string): void {
  router.push({ name: 'record-view', params: { collection: props.collection, id } })
}

// Delete
async function handleDelete(id: string): Promise<void> {
  const ok = await confirm('Delete this record? This cannot be undone.', { variant: 'danger', confirmLabel: 'Delete' })
  if (!ok) return

  deletingId.value = id
  try {
    const res = await service.value!.deleteRecords(props.collection, [id])
    toastStore.show(res.message, 'success')
    await loadRecords(loading.value ? 'filter' : 'initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Delete failed'
    toastStore.show(msg, 'error')
    console.error('[RecordsView] delete error:', err)
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  await loadSchema()
  await loadRecords('initial')
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h3 fw-bold mb-0">
            <i class="bi bi-table me-2 text-primary" />
            {{ collection }}
          </h1>
          <p class="text-muted small mb-0">Records</p>
        </div>
        <div class="d-flex gap-2">
          <div class="form-check form-switch mb-0 d-flex align-items-center gap-2">
            <input
              id="show-id-toggle"
              v-model="showId"
              class="form-check-input"
              type="checkbox"
              role="switch"
            />
            <label class="form-check-label small text-muted" for="show-id-toggle">Show ID</label>
          </div>
          <button class="btn btn-sm btn-outline-secondary" :disabled="loading" @click="loadRecords('filter')">
            <i class="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>

      <!-- Schema error -->
      <div v-if="schemaError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />
        {{ schemaError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadSchema">Retry</button>
      </div>

      <div v-else class="card border-0 shadow-sm">
        <div class="card-body pb-0">
          <!-- Search row -->
          <div class="row g-2 mb-3">
            <div class="col-12 col-md-6 col-lg-5">
              <SearchBar
                v-model="searchQuery"
                placeholder="Search all text fields…"
                :loading="loading && loadingType === 'filter'"
                @search="handleSearch"
              />
            </div>
          </div>

          <!-- Filter bar -->
          <FilterBar v-if="columns.length > 0" :columns="columns" @apply="handleFilter" />
        </div>

        <!-- Load error -->
        <div v-if="loadError && !loading" class="px-4 py-3">
          <div class="alert alert-danger mb-0">
            <i class="bi bi-exclamation-triangle me-2" />
            {{ loadError }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="loadRecords('initial')">
              Retry
            </button>
          </div>
        </div>

        <!-- Table -->
        <DataTable
          v-else
          :columns="columns"
          :rows="rows"
          :loading="loading"
          :loading-type="loadingType"
          :sort-field="sortField"
          :sort-dir="sortDir"
          :show-id="showId"
          :deleting-id="deletingId"
          @sort="handleSort"
          @row-click="handleRowClick"
          @view="handleView"
          @delete="handleDelete"
        />

        <!-- Pagination -->
        <div class="card-footer bg-transparent border-top-0">
          <Pagination
            :meta="meta"
            :limit="limit"
            :has-prev="hasPrev"
            :has-next="hasNext"
            @prev="goPrev"
            @next="goNext"
            @limit-change="handleLimitChange"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>
