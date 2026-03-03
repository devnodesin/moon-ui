<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import FieldInput from '@/components/forms/FieldInput.vue'
import FormErrors from '@/components/forms/FormErrors.vue'
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
const createableFields = computed<CollectionField[]>(() =>
  columns.value.filter((f) => f.type !== 'id' && !f.readonly),
)

// Records state
const rows = ref<MoonRecord[]>([])
const meta = ref<ApiListMeta | null>(null)
const loadingType = ref<'initial' | 'page' | 'filter' | 'sort'>('initial')
const loading = ref(false)
const loadError = ref<string | null>(null)

// Pagination — cursor-based, always ?after= for both directions
const limit = ref(15)
const afterCursor = ref<string | null>(null)
const prevCursor = ref<string | null>(null)
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

// Batch selection
const selectedIds = ref<string[]>([])
const allSelected = computed(
  () => rows.value.length > 0 && rows.value.every((r) => selectedIds.value.includes(r.id)),
)

function handleToggleRow(id: string): void {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value = [...selectedIds.value, id]
  else selectedIds.value = selectedIds.value.filter((x) => x !== id)
}

function handleToggleAll(): void {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = rows.value.map((r) => r.id)
}

const batchDeleting = ref(false)

async function handleBatchDelete(): Promise<void> {
  if (selectedIds.value.length === 0) return
  const count = selectedIds.value.length
  const ok = await confirm(
    `Delete ${count} selected record${count > 1 ? 's' : ''}? This cannot be undone.`,
    { variant: 'danger', confirmLabel: 'Delete' },
  )
  if (!ok) return

  batchDeleting.value = true
  const ids = [...selectedIds.value]
  try {
    const res = await service.value!.deleteRecords(props.collection, ids)
    toastStore.show(res.message, 'success')
    selectedIds.value = []
    await loadRecords('initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Batch delete failed'
    toastStore.show(msg, 'error')
    console.error('[RecordsView] batch delete error:', err)
  } finally {
    batchDeleting.value = false
  }
}

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
  selectedIds.value = []
  try {
    const res = await service.value.listRecords(props.collection, buildParams())
    rows.value = res.data
    meta.value = res.meta
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

function goNext(): void {
  if (meta.value?.next) {
    afterCursor.value = meta.value.next
    loadRecords('page')
  }
}

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

function goBack(): void {
  router.push({ name: 'collections' })
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

// ─── Add Record Modal ─────────────────────────────────────────────────────────
const showAddModal = ref(false)
const addDraft = ref<Record<string, unknown>>({})
const addErrors = ref<Record<string, string>>({})
const addFormError = ref<string | null>(null)
const addLoading = ref(false)

function defaultValueForField(field: CollectionField): unknown {
  if (field.nullable) return ''
  switch (field.type) {
    case 'boolean': return false
    case 'integer': return ''
    case 'decimal': return ''
    default: return ''
  }
}

function openAddModal(): void {
  const draft: Record<string, unknown> = {}
  for (const f of createableFields.value) {
    draft[f.name] = defaultValueForField(f)
  }
  addDraft.value = draft
  addErrors.value = {}
  addFormError.value = null
  showAddModal.value = true
}

function onAddFieldChange(fieldName: string, value: unknown): void {
  addDraft.value = { ...addDraft.value, [fieldName]: value }
  if (addErrors.value[fieldName]) {
    const { [fieldName]: _, ...rest } = addErrors.value
    addErrors.value = rest
  }
}

function validateAdd(): boolean {
  const errors: Record<string, string> = {}
  for (const field of createableFields.value) {
    const val = addDraft.value[field.name]
    const isEmpty = val === null || val === undefined || val === ''
    if (!field.nullable && isEmpty) {
      errors[field.name] = 'This field is required'
    } else if (!isEmpty) {
      switch (field.type) {
        case 'integer':
          if (!Number.isInteger(Number(val))) errors[field.name] = 'Must be a whole number'
          break
        case 'decimal':
          if (!/^-?\d+(\.\d{1,10})?$/.test(String(val))) errors[field.name] = 'Must be a valid decimal (e.g. 9.99)'
          break
        case 'datetime':
          if (isNaN(Date.parse(String(val)))) errors[field.name] = 'Must be a valid date/time'
          break
        case 'json':
          try { JSON.parse(String(val)) } catch { errors[field.name] = 'Must be valid JSON' }
          break
      }
    }
  }
  addErrors.value = errors
  return Object.keys(errors).length === 0
}

function sanitizeAdd(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of createableFields.value) {
    const val = addDraft.value[field.name]
    if (val === null || val === undefined || val === '') {
      out[field.name] = null
      continue
    }
    switch (field.type) {
      case 'integer': out[field.name] = parseInt(String(val), 10); break
      case 'decimal': out[field.name] = String(val).trim(); break
      case 'boolean': out[field.name] = Boolean(val); break
      case 'json':
        try { out[field.name] = JSON.parse(String(val)) } catch { out[field.name] = String(val) }
        break
      default: out[field.name] = String(val).trim()
    }
  }
  return out
}

async function submitAdd(): Promise<void> {
  if (!validateAdd()) return
  addLoading.value = true
  addFormError.value = null
  try {
    const payload = sanitizeAdd()
    const res = await service.value!.createRecord(props.collection, payload)
    toastStore.show(res.message, 'success')
    showAddModal.value = false
    await loadRecords('initial')
  } catch (err) {
    addFormError.value = (err as { message?: string }).message ?? 'Failed to create record'
    console.error('[RecordsView] create error:', err)
  } finally {
    addLoading.value = false
  }
}

onMounted(async () => {
  await loadSchema()
  await loadRecords('initial')
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-3">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left" /> Collections
          </button>
          <div class="h-100 d-flex align-items-center">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item active fs-4" aria-current="page">/{{ collection }}</li>
              </ol>
            </nav>
          </div>
        </div>
        <div class="d-flex gap-2 align-items-center">
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
          <button
            v-if="selectedIds.length > 0"
            class="btn btn-sm btn-danger"
            :disabled="batchDeleting"
            @click="handleBatchDelete"
          >
            <span v-if="batchDeleting" class="spinner-border spinner-border-sm me-1" role="status" />
            <i v-else class="bi bi-trash me-1" />
            Delete Selected ({{ selectedIds.length }})
          </button>
          <button class="btn btn-sm btn-outline-secondary" :disabled="loading" @click="loadRecords('filter')">
            <i class="bi bi-arrow-clockwise" />
          </button>
          <button
            class="btn btn-sm btn-primary"
            :disabled="!schema || !!schemaError"
            @click="openAddModal"
          >
            <i class="bi bi-plus-lg me-1" />Add Record
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
          :selected-ids="selectedIds"
          @sort="handleSort"
          @row-click="handleRowClick"
          @view="handleView"
          @delete="handleDelete"
          @toggle-row="handleToggleRow"
          @toggle-all="handleToggleAll"
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

    <!-- ─── Add Record Modal ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showAddModal"
        class="modal show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
        @click.self="showAddModal = false"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-plus-circle me-2 text-primary" />Add Record
                <span class="font-monospace small text-muted ms-1">{{ collection }}</span>
              </h5>
              <button type="button" class="btn-close" @click="showAddModal = false" />
            </div>
            <div class="modal-body">
              <div v-if="addFormError" class="alert alert-danger py-2 mb-3">{{ addFormError }}</div>
              <FormErrors :errors="addErrors" />

              <div v-if="createableFields.length === 0" class="text-muted small">
                No editable fields in this collection.
              </div>

              <div
                v-for="field in createableFields"
                :key="field.name"
                class="row mb-3 align-items-start"
              >
                <div class="col-4">
                  <label :for="`add-${field.name}`" class="form-label fw-semibold small text-capitalize mb-0 pt-1">
                    {{ field.name.replace(/_/g, ' ') }}
                    <span v-if="!field.nullable" class="text-danger">*</span>
                  </label>
                  <div class="text-muted" style="font-size: 0.7rem">{{ field.type }}</div>
                </div>
                <div class="col-8">
                  <FieldInput
                    :id="`add-${field.name}`"
                    :field="field"
                    :model-value="addDraft[field.name]"
                    :disabled="addLoading"
                    :error="addErrors[field.name]"
                    @update:model-value="onAddFieldChange(field.name, $event)"
                  />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" :disabled="addLoading" @click="showAddModal = false">
                Cancel
              </button>
              <button class="btn btn-primary" :disabled="addLoading" @click="submitAdd">
                <span v-if="addLoading" class="spinner-border spinner-border-sm me-1" role="status" />
                <i v-else class="bi bi-check2 me-1" />
                Create Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>
