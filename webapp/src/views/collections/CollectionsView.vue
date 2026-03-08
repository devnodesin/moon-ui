<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useConfirm } from '@/composables/useConfirm'
import { createCollectionsService } from '@/services/collections'
import type {
  CollectionSummary,
  ApiListMeta,
  CollectionColumn,
  CollectionDetail,
} from '@/types/api'
import type { CollectionCreatePayload, CollectionUpdatePayload } from '@/services/collections'

const COLUMN_TYPES = ['string', 'integer', 'decimal', 'boolean', 'datetime', 'json'] as const
const SKELETON_COUNT = 5
const SNAKE_CASE_RE = /^[a-z][a-z0-9_]*$/

function toSnakeCase(val: string): string {
  return val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+/, '').replace(/_+/g, '_')
}

const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const { confirm } = useConfirm()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value
    ? createCollectionsService(activeConn.value.baseUrl, activeConn.value.id)
    : null,
)

// ─── List state ──────────────────────────────────────────────────────────────
const rows = ref<CollectionSummary[]>([])
const meta = ref<ApiListMeta | null>(null)
const loading = ref(false)
const loadingType = ref<'initial' | 'page'>('initial')
const loadError = ref<string | null>(null)

// Pagination
const perPage = ref(15)
const currentPage = ref(1)
const totalPages = ref(0)
const hasNext = computed(() => currentPage.value < totalPages.value)
const hasPrev = computed(() => currentPage.value > 1)

// Row action tracking
const actionName = ref<string | null>(null)

function buildParams(): Record<string, string> {
  return { per_page: String(perPage.value), page: String(currentPage.value) }
}

async function loadCollections(type: typeof loadingType.value = 'initial'): Promise<void> {
  if (!service.value) return
  loadingType.value = type
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.listCollections(buildParams())
    rows.value = res.data ?? []
    meta.value = res.meta
    currentPage.value = res.meta.current_page
    totalPages.value = res.meta.total_pages
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load collections'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[CollectionsView] load error:', err)
  } finally {
    loading.value = false
  }
}

function goNext(): void {
  if (hasNext.value) {
    currentPage.value++
    loadCollections('page')
  }
}

function goPrev(): void {
  if (hasPrev.value) {
    currentPage.value--
    loadCollections('page')
  }
}

function handlePerPageChange(newPerPage: number): void {
  perPage.value = newPerPage
  currentPage.value = 1
  loadCollections('page')
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function viewRecords(name: string): void {
  router.push({ name: 'records', params: { collection: name } })
}

async function deleteCollection(col: CollectionSummary): Promise<void> {
  const ok = await confirm(
    `Delete collection "${col.name}" and all its ${col.count} record(s)? This cannot be undone.`,
    { variant: 'danger', confirmLabel: 'Delete Collection' },
  )
  if (!ok) return
  actionName.value = col.name
  try {
    const res = await service.value!.deleteCollection(col.name)
    toastStore.show(res.message, 'success')
    await loadCollections('initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Delete failed'
    toastStore.show(msg, 'error')
    console.error('[CollectionsView] delete error:', err)
  } finally {
    actionName.value = null
  }
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
const showCreateModal = ref(false)
const createName = ref('')
const createColumns = ref<CollectionColumn[]>([])
const createNewCol = ref<CollectionColumn>({ name: '', type: 'string', nullable: true })
const createLoading = ref(false)
const createError = ref<string | null>(null)
const createValidationErrors = ref<Record<string, string>>({})

function openCreateModal(): void {
  createName.value = ''
  createColumns.value = []
  createNewCol.value = { name: '', type: 'string', nullable: true }
  createError.value = null
  createValidationErrors.value = {}
  showCreateModal.value = true
}

function addCreateColumn(): void {
  const trimmed = createNewCol.value.name.trim()
  if (!trimmed) return
  createColumns.value.push({ ...createNewCol.value, name: trimmed })
  createNewCol.value = { name: '', type: 'string', nullable: true }
}

function removeCreateColumn(index: number): void {
  createColumns.value.splice(index, 1)
}

function validateCreate(): boolean {
  const errors: Record<string, string> = {}
  const name = createName.value.trim()
  if (!name) {
    errors['name'] = 'Collection name is required'
  } else if (!SNAKE_CASE_RE.test(name)) {
    errors['name'] = 'Must be lowercase snake_case (letters, digits, underscores; start with a letter)'
  }
  if (createColumns.value.length === 0) errors['columns'] = 'At least one column is required'
  createValidationErrors.value = errors
  return Object.keys(errors).length === 0
}

async function submitCreate(): Promise<void> {
  if (!validateCreate()) return
  createLoading.value = true
  createError.value = null
  try {
    const payload: CollectionCreatePayload = {
      name: createName.value.trim(),
      columns: createColumns.value,
    }
    const res = await service.value!.createCollection(payload)
    toastStore.show(res.message, 'success')
    showCreateModal.value = false
    await loadCollections('initial')
  } catch (err) {
    createError.value =
      (err as { message?: string }).message ?? 'Failed to create collection'
    console.error('[CollectionsView] create error:', err)
  } finally {
    createLoading.value = false
  }
}

// ─── Schema Modal ─────────────────────────────────────────────────────────────
const showSchemaModal = ref(false)
const schemaTarget = ref('')
const schemaData = ref<CollectionDetail | null>(null)
const schemaLoading = ref(false)
const schemaError = ref<string | null>(null)
const schemaEditMode = ref(false)
const schemaNewCol = ref<CollectionColumn>({ name: '', type: 'string', nullable: true })
const schemaSaving = ref(false)
const schemaAddedCols = ref<CollectionColumn[]>([])
const schemaRemovedNames = ref<string[]>([])

async function openSchemaModal(name: string): Promise<void> {
  schemaTarget.value = name
  schemaData.value = null
  schemaError.value = null
  schemaEditMode.value = false
  schemaAddedCols.value = []
  schemaRemovedNames.value = []
  schemaNewCol.value = { name: '', type: 'string', nullable: true }
  showSchemaModal.value = true
  schemaLoading.value = true
  try {
    const res = await service.value!.getCollection(name)
    // New API: data is an array, take first element
    schemaData.value = res.data[0]
  } catch (err) {
    schemaError.value = (err as { message?: string }).message ?? 'Failed to load schema'
    console.error('[CollectionsView] schema load error:', err)
  } finally {
    schemaLoading.value = false
  }
}

function enterSchemaEdit(): void {
  schemaEditMode.value = true
  schemaAddedCols.value = []
  schemaRemovedNames.value = []
  schemaNewCol.value = { name: '', type: 'string', nullable: true }
}

function cancelSchemaEdit(): void {
  schemaEditMode.value = false
  schemaAddedCols.value = []
  schemaRemovedNames.value = []
}

function isRemovedColumn(colName: string): boolean {
  return schemaRemovedNames.value.includes(colName)
}

function markRemoveColumn(colName: string): void {
  if (!isRemovedColumn(colName)) schemaRemovedNames.value.push(colName)
}

function undoRemoveColumn(colName: string): void {
  schemaRemovedNames.value = schemaRemovedNames.value.filter((n) => n !== colName)
}

function addSchemaColumn(): void {
  const trimmed = schemaNewCol.value.name.trim()
  if (!trimmed) return
  schemaAddedCols.value.push({ ...schemaNewCol.value, name: trimmed })
  schemaNewCol.value = { name: '', type: 'string', nullable: true }
}

function removeAddedColumn(index: number): void {
  schemaAddedCols.value.splice(index, 1)
}

async function saveSchema(): Promise<void> {
  const hasAdded = schemaAddedCols.value.length > 0
  const hasRemoved = schemaRemovedNames.value.length > 0
  if (!hasAdded && !hasRemoved) {
    schemaEditMode.value = false
    return
  }
  schemaSaving.value = true
  try {
    const payload: CollectionUpdatePayload = { name: schemaTarget.value }
    if (hasAdded) payload.add_columns = schemaAddedCols.value
    if (hasRemoved) payload.remove_columns = schemaRemovedNames.value
    const res = await service.value!.updateCollection(payload)
    toastStore.show(res.message, 'success')
    // New API: data is an array, take first element
    schemaData.value = res.data[0]
    schemaEditMode.value = false
    schemaAddedCols.value = []
    schemaRemovedNames.value = []
    await loadCollections('initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to update schema'
    toastStore.show(msg, 'error')
    console.error('[CollectionsView] schema save error:', err)
  } finally {
    schemaSaving.value = false
  }
}

onMounted(() => loadCollections('initial'))
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div class="h-100 d-flex align-items-center">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item active fs-4" aria-current="page"><i class="bi bi-collection me-2 text-primary" />Collections</li>
            </ol>
          </nav>
        </div>
        <button class="btn btn-sm btn-primary" @click="openCreateModal">
          <i class="bi bi-plus-lg me-1" />Add Collection
        </button>
      </div>

      <div class="card border-0 shadow-sm">
        <!-- Load error -->
        <div v-if="loadError && !loading" class="card-body">
          <div class="alert alert-danger mb-0">
            <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
            <button
              class="btn btn-sm btn-outline-danger ms-2"
              @click="loadCollections('initial')"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Table -->
        <div v-else class="position-relative">
          <!-- Overlay for page reload -->
          <div
            v-if="loading && rows.length > 0 && loadingType !== 'initial'"
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
                  <th>Name</th>
                  <th>Records</th>
                  <th style="width: 140px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- Skeleton -->
                <template v-if="loading && (loadingType === 'initial' || rows.length === 0)">
                  <tr v-for="n in SKELETON_COUNT" :key="n" aria-hidden="true">
                    <td>
                      <span class="placeholder-glow d-block">
                        <span class="placeholder" :class="n % 2 === 0 ? 'col-5' : 'col-7'" />
                      </span>
                    </td>
                    <td>
                      <span class="placeholder-glow d-block">
                        <span class="placeholder col-3" />
                      </span>
                    </td>
                    <td>
                      <span class="placeholder-glow d-block">
                        <span class="placeholder col-10" />
                      </span>
                    </td>
                  </tr>
                </template>

                <!-- Data -->
                <template v-else-if="rows.length > 0">
                  <tr v-for="col in rows" :key="col.name">
                    <td class="fw-semibold">{{ col.name }}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-secondary">{{ col.count }}</span>
                        <button
                          class="btn btn-sm btn-outline-primary"
                          :disabled="actionName === col.name"
                          @click="viewRecords(col.name)"
                        >
                          <i class="bi bi-list-ul me-1" />View Records
                        </button>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          title="View / Edit Schema"
                          :disabled="actionName === col.name"
                          @click="openSchemaModal(col.name)"
                        >
                          <i class="bi bi-layout-text-sidebar-reverse" />
                        </button>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          title="Delete Collection"
                          :disabled="actionName === col.name"
                          @click="deleteCollection(col)"
                        >
                          <span
                            v-if="actionName === col.name"
                            class="spinner-border spinner-border-sm"
                            role="status"
                          />
                          <i v-else class="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- Empty -->
                <tr v-else>
                  <td colspan="3" class="p-0">
                    <EmptyState
                      icon="bi-table"
                      title="No collections found"
                      message="Create a collection to get started."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="card-footer bg-transparent border-top-0">
          <Pagination
            :meta="meta"
            :per-page="perPage"
            :has-prev="hasPrev"
            :has-next="hasNext"
            @prev="goPrev"
            @next="goNext"
            @per-page-change="handlePerPageChange"
          />
        </div>
      </div>
    </div>

    <!-- ─── Create Collection Modal ─────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="modal show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
        @click.self="showCreateModal = false"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-table me-2 text-primary" />Create Collection
              </h5>
              <button type="button" class="btn-close" @click="showCreateModal = false" />
            </div>
            <div class="modal-body">
              <!-- Error -->
              <div v-if="createError" class="alert alert-danger py-2 mb-3">{{ createError }}</div>

              <!-- Name -->
              <div class="mb-4">
                <label class="form-label fw-semibold">
                  Collection Name <span class="text-danger">*</span>
                </label>
                <input
                  :value="createName"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': createValidationErrors['name'] }"
                  placeholder="e.g. product_catalog"
                  :disabled="createLoading"
                  @input="createName = toSnakeCase(($event.target as HTMLInputElement).value)"
                />
                <div v-if="createValidationErrors['name']" class="invalid-feedback">
                  {{ createValidationErrors['name'] }}
                </div>
                <div v-else class="form-text">Lowercase letters, digits, and underscores only (snake_case).</div>
              </div>

              <!-- Columns -->
              <div>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <label class="form-label fw-semibold mb-0">
                    Columns <span class="text-danger">*</span>
                  </label>
                </div>
                <div
                  v-if="createValidationErrors['columns']"
                  class="text-danger small mb-2"
                >
                  {{ createValidationErrors['columns'] }}
                </div>

                <!-- Columns table -->
                <div v-if="createColumns.length > 0" class="table-responsive mb-3">
                  <table class="table table-sm table-bordered align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Unique</th>
                        <th style="width: 48px" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(col, i) in createColumns" :key="i">
                        <td class="font-monospace small">{{ col.name }}</td>
                        <td>
                          <span class="badge bg-secondary">{{ col.type }}</span>
                        </td>
                        <td>
                          <i
                            class="bi"
                            :class="col.nullable ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                          />
                        </td>
                        <td>
                          <i
                            class="bi"
                            :class="col.unique ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                          />
                        </td>
                        <td>
                          <button
                            class="btn btn-sm btn-outline-danger"
                            title="Remove column"
                            @click="removeCreateColumn(i)"
                          >
                            <i class="bi bi-x" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Add column form -->
                <div class="border rounded p-3 bg-light">
                  <div class="fw-semibold small text-muted mb-2">Add Column</div>
                  <div class="row g-2 align-items-end">
                    <div class="col-sm-4">
                      <label class="form-label form-label-sm mb-1">Name</label>
                      <input
                        v-model="createNewCol.name"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="column_name"
                        @keydown.enter="addCreateColumn"
                      />
                    </div>
                    <div class="col-sm-3">
                      <label class="form-label form-label-sm mb-1">Type</label>
                      <select v-model="createNewCol.type" class="form-select form-select-sm">
                        <option v-for="t in COLUMN_TYPES" :key="t" :value="t">{{ t }}</option>
                      </select>
                    </div>
                    <div class="col-sm-2 d-flex align-items-center gap-3 pt-3">
                      <div class="form-check mb-0">
                        <input
                          id="create-nullable"
                          v-model="createNewCol.nullable"
                          type="checkbox"
                          class="form-check-input"
                        />
                        <label class="form-check-label small" for="create-nullable">Nullable</label>
                      </div>
                    </div>
                    <div class="col-sm-2 d-flex align-items-center gap-3 pt-3">
                      <div class="form-check mb-0">
                        <input
                          id="create-unique"
                          v-model="createNewCol.unique"
                          type="checkbox"
                          class="form-check-input"
                        />
                        <label class="form-check-label small" for="create-unique">Unique</label>
                      </div>
                    </div>
                    <div class="col-sm-1">
                      <button
                        class="btn btn-sm btn-primary w-100"
                        title="Add column"
                        @click="addCreateColumn"
                      >
                        <i class="bi bi-plus" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                class="btn btn-secondary"
                :disabled="createLoading"
                @click="showCreateModal = false"
              >
                Cancel
              </button>
              <button class="btn btn-primary" :disabled="createLoading" @click="submitCreate">
                <span
                  v-if="createLoading"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                <i v-else class="bi bi-check2 me-1" />
                Create Collection
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Schema Modal ────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showSchemaModal"
        class="modal show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.5)"
        @click.self="!schemaEditMode && (showSchemaModal = false)"
      >
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-layout-text-sidebar-reverse me-2 text-primary" />
                Schema — <span class="font-monospace">{{ schemaTarget }}</span>
              </h5>
              <button
                v-if="!schemaEditMode"
                type="button"
                class="btn-close"
                @click="showSchemaModal = false"
              />
            </div>
            <div class="modal-body">
              <!-- Loading -->
              <template v-if="schemaLoading">
                <div v-for="n in 3" :key="n" class="mb-2 placeholder-glow">
                  <span class="placeholder col-12 d-block" style="height: 38px" />
                </div>
              </template>

              <!-- Error -->
              <div v-else-if="schemaError" class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2" />{{ schemaError }}
                <button
                  class="btn btn-sm btn-outline-danger ms-2"
                  @click="openSchemaModal(schemaTarget)"
                >
                  Retry
                </button>
              </div>

              <!-- Schema data -->
              <template v-else-if="schemaData">
                <!-- Existing columns -->
                <div class="table-responsive mb-3">
                  <table class="table table-sm table-bordered align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Unique</th>
                        <th>Default</th>
                        <th v-if="schemaEditMode" style="width: 80px">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="col in schemaData.columns"
                        :key="col.name"
                        :class="{ 'table-danger opacity-50': isRemovedColumn(col.name) }"
                      >
                        <td class="font-monospace small">{{ col.name }}</td>
                        <td>
                          <span class="badge bg-secondary">{{ col.type }}</span>
                        </td>
                        <td>
                          <i
                            class="bi"
                            :class="col.nullable ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                          />
                        </td>
                        <td>
                          <i
                            class="bi"
                            :class="col.unique ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                          />
                        </td>
                        <td class="text-muted small font-monospace">
                          {{ col.default ?? '—' }}
                        </td>
                        <td v-if="schemaEditMode">
                          <button
                            v-if="!isRemovedColumn(col.name)"
                            class="btn btn-sm btn-outline-danger"
                            title="Mark for removal"
                            @click="markRemoveColumn(col.name)"
                          >
                            <i class="bi bi-trash" />
                          </button>
                          <button
                            v-else
                            class="btn btn-sm btn-outline-secondary"
                            title="Undo removal"
                            @click="undoRemoveColumn(col.name)"
                          >
                            <i class="bi bi-arrow-counterclockwise" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Add column form (edit mode only) -->
                <template v-if="schemaEditMode">
                  <!-- Newly added columns -->
                  <div v-if="schemaAddedCols.length > 0" class="mb-3">
                    <div class="fw-semibold small text-success mb-2">
                      <i class="bi bi-plus-circle me-1" />Columns to Add
                    </div>
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Nullable</th>
                            <th>Unique</th>
                            <th style="width: 48px" />
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(col, i) in schemaAddedCols"
                            :key="i"
                            class="table-success"
                          >
                            <td class="font-monospace small">{{ col.name }}</td>
                            <td>
                              <span class="badge bg-secondary">{{ col.type }}</span>
                            </td>
                            <td>
                              <i
                                class="bi"
                                :class="col.nullable ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                              />
                            </td>
                            <td>
                              <i
                                class="bi"
                                :class="col.unique ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                              />
                            </td>
                            <td>
                              <button
                                class="btn btn-sm btn-outline-danger"
                                @click="removeAddedColumn(i)"
                              >
                                <i class="bi bi-x" />
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Add column row -->
                  <div class="border rounded p-3 bg-light">
                    <div class="fw-semibold small text-muted mb-2">Add Column</div>
                    <div class="row g-2 align-items-end">
                      <div class="col-sm-4">
                        <label class="form-label form-label-sm mb-1">Name</label>
                        <input
                          v-model="schemaNewCol.name"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="column_name"
                          @keydown.enter="addSchemaColumn"
                        />
                      </div>
                      <div class="col-sm-3">
                        <label class="form-label form-label-sm mb-1">Type</label>
                        <select v-model="schemaNewCol.type" class="form-select form-select-sm">
                          <option v-for="t in COLUMN_TYPES" :key="t" :value="t">{{ t }}</option>
                        </select>
                      </div>
                      <div class="col-sm-2 d-flex align-items-center gap-3 pt-3">
                        <div class="form-check mb-0">
                          <input
                            id="schema-nullable"
                            v-model="schemaNewCol.nullable"
                            type="checkbox"
                            class="form-check-input"
                          />
                          <label class="form-check-label small" for="schema-nullable">
                            Nullable
                          </label>
                        </div>
                      </div>
                      <div class="col-sm-2 d-flex align-items-center gap-3 pt-3">
                        <div class="form-check mb-0">
                          <input
                            id="schema-unique"
                            v-model="schemaNewCol.unique"
                            type="checkbox"
                            class="form-check-input"
                          />
                          <label class="form-check-label small" for="schema-unique">
                            Unique
                          </label>
                        </div>
                      </div>
                      <div class="col-sm-1">
                        <button
                          class="btn btn-sm btn-primary w-100"
                          title="Add column"
                          @click="addSchemaColumn"
                        >
                          <i class="bi bi-plus" />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
            <div class="modal-footer">
              <template v-if="schemaEditMode">
                <button
                  class="btn btn-secondary"
                  :disabled="schemaSaving"
                  @click="cancelSchemaEdit"
                >
                  Cancel
                </button>
                <button class="btn btn-primary" :disabled="schemaSaving" @click="saveSchema">
                  <span
                    v-if="schemaSaving"
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                  />
                  <i v-else class="bi bi-check2 me-1" />
                  Save Changes
                </button>
              </template>
              <template v-else>
                <button class="btn btn-secondary" @click="showSchemaModal = false">Close</button>
                <button
                  v-if="schemaData && !schemaLoading && !schemaError"
                  class="btn btn-outline-primary"
                  @click="enterSchemaEdit"
                >
                  <i class="bi bi-pencil me-1" />Edit Schema
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

