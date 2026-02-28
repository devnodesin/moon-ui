<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useConfirm } from '@/composables/useConfirm'
import { createApiKeysService } from '@/services/apikeys'
import type { ApiKey, ApiListMeta } from '@/types/api'

const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const { confirm } = useConfirm()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value ? createApiKeysService(activeConn.value.baseUrl, activeConn.value.id) : null,
)

// List state
const rows = ref<ApiKey[]>([])
const meta = ref<ApiListMeta | null>(null)
const loading = ref(false)
const loadingType = ref<'initial' | 'page'>('initial')
const loadError = ref<string | null>(null)

// Pagination — ?after= for both next and prev
const limit = ref(15)
const afterCursor = ref<string | null>(null)
const prevCursor = ref<string | null>(null)
const hasNext = ref(false)
const hasPrev = ref(false)

// Row action loading
const actionKeyId = ref<string | null>(null)

// API Key display modal — shown once after create or rotate
const revealedKey = ref<string | null>(null)
const revealedKeyName = ref('')
const keyCopied = ref(false)

const SKELETON_COUNT = 5

function buildParams(): Record<string, string> {
  const p: Record<string, string> = { limit: String(limit.value) }
  if (afterCursor.value) p['after'] = afterCursor.value
  return p
}

async function loadApiKeys(type: typeof loadingType.value = 'initial'): Promise<void> {
  if (!service.value) return
  loadingType.value = type
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.listApiKeys(buildParams())
    rows.value = res.data
    meta.value = res.meta
    hasNext.value = !!res.meta.next
    hasPrev.value = !!res.meta.prev
    prevCursor.value = res.meta.prev
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load API keys'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[ApiKeysView] load error:', err)
  } finally {
    loading.value = false
  }
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
    loadApiKeys('page')
  }
}

function goPrev(): void {
  if (prevCursor.value) {
    afterCursor.value = prevCursor.value
    loadApiKeys('page')
  }
}

function handleLimitChange(newLimit: number): void {
  limit.value = newLimit
  resetPagination()
  loadApiKeys('page')
}

function formatDate(dt: string): string {
  try {
    return new Date(dt).toLocaleDateString()
  } catch {
    return dt
  }
}

// Show the revealed key modal
function showKeyModal(key: string, name: string): void {
  revealedKey.value = key
  revealedKeyName.value = name
  keyCopied.value = false
}

function closeKeyModal(): void {
  revealedKey.value = null
  revealedKeyName.value = ''
  keyCopied.value = false
}

async function copyKey(): Promise<void> {
  if (!revealedKey.value) return
  try {
    await navigator.clipboard.writeText(revealedKey.value)
    keyCopied.value = true
    setTimeout(() => {
      keyCopied.value = false
    }, 2000)
  } catch {
    toastStore.show('Copy failed — please select and copy manually.', 'warning')
  }
}

// --- Row actions ---

function editKey(id: string): void {
  router.push({ name: 'apikey-edit', params: { id } })
}

async function rotateKey(key: ApiKey): Promise<void> {
  const ok = await confirm(
    `Rotate the API key "${key.name}"? The current key will stop working immediately.`,
    { variant: 'warning', confirmLabel: 'Rotate Key' },
  )
  if (!ok) return
  actionKeyId.value = key.id
  try {
    const res = await service.value!.rotateApiKey(key.id)
    toastStore.show(res.message, 'success')
    const newKey = res.data[0]?.key
    if (newKey) showKeyModal(newKey, key.name)
    await loadApiKeys('initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to rotate key'
    toastStore.show(msg, 'error')
    console.error('[ApiKeysView] rotate error:', err)
  } finally {
    actionKeyId.value = null
  }
}

async function deleteKey(key: ApiKey): Promise<void> {
  const ok = await confirm(`Delete API key "${key.name}"? This cannot be undone.`, {
    variant: 'danger',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  actionKeyId.value = key.id
  try {
    const res = await service.value!.deleteApiKey(key.id)
    toastStore.show(res.message, 'success')
    await loadApiKeys('initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Delete failed'
    toastStore.show(msg, 'error')
    console.error('[ApiKeysView] delete error:', err)
  } finally {
    actionKeyId.value = null
  }
}

onMounted(() => loadApiKeys('initial'))
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <h1 class="h3 fw-bold mb-0"><i class="bi bi-key me-2 text-primary" />API Keys</h1>
        <button class="btn btn-primary" @click="router.push({ name: 'apikey-create' })">
          <i class="bi bi-plus-lg me-1" />Add API Key
        </button>
      </div>

      <div class="card border-0 shadow-sm">
        <!-- Load error -->
        <div v-if="loadError && !loading" class="card-body">
          <div class="alert alert-danger mb-0">
            <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="loadApiKeys('initial')">
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
                  <th>Description</th>
                  <th>Role</th>
                  <th>Can Write</th>
                  <th>Created</th>
                  <th style="width: 140px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- Skeleton -->
                <template v-if="loading && (loadingType === 'initial' || rows.length === 0)">
                  <tr v-for="n in SKELETON_COUNT" :key="n" aria-hidden="true">
                    <td v-for="col in 5" :key="col">
                      <span class="placeholder-glow d-block">
                        <span class="placeholder" :class="n % 2 === 0 ? 'col-7' : 'col-9'" />
                      </span>
                    </td>
                    <td>
                      <span class="placeholder-glow d-block"><span class="placeholder col-10" /></span>
                    </td>
                  </tr>
                </template>

                <!-- Data -->
                <template v-else-if="rows.length > 0">
                  <tr v-for="key in rows" :key="key.id">
                    <td class="fw-semibold">{{ key.name }}</td>
                    <td class="text-muted">{{ key.description || '—' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="key.role === 'admin' ? 'bg-danger' : 'bg-secondary'"
                      >{{ key.role }}</span>
                    </td>
                    <td>
                      <i
                        class="bi"
                        :class="key.can_write ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                      />
                    </td>
                    <td class="text-muted small">{{ formatDate(key.created_at) }}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          title="Edit"
                          :disabled="actionKeyId === key.id"
                          @click="editKey(key.id)"
                        >
                          <i class="bi bi-pencil" />
                        </button>
                        <button
                          class="btn btn-sm btn-outline-warning"
                          title="Rotate Key"
                          :disabled="actionKeyId === key.id"
                          @click="rotateKey(key)"
                        >
                          <span
                            v-if="actionKeyId === key.id"
                            class="spinner-border spinner-border-sm"
                            role="status"
                          />
                          <i v-else class="bi bi-arrow-repeat" />
                        </button>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          title="Delete"
                          :disabled="actionKeyId === key.id"
                          @click="deleteKey(key)"
                        >
                          <i class="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- Empty -->
                <tr v-else>
                  <td colspan="6" class="p-0">
                    <EmptyState icon="bi-key" title="No API keys found" />
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

    <!-- API Key Display Modal (shown once after create or rotate) -->
    <Teleport to="body">
      <div
        v-if="revealedKey"
        class="modal show d-block"
        tabindex="-1"
        style="background: rgba(0,0,0,0.5)"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-bottom-0">
              <h5 class="modal-title"><i class="bi bi-key me-2 text-warning" />API Key — {{ revealedKeyName }}</h5>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning d-flex align-items-start gap-2 mb-3">
                <i class="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" />
                <div>
                  <strong>Store this key securely.</strong> It will not be shown again.
                </div>
              </div>
              <label class="form-label fw-semibold small text-muted">API Key</label>
              <div class="input-group">
                <input
                  type="text"
                  class="form-control font-monospace small"
                  :value="revealedKey"
                  readonly
                  @focus="($event.target as HTMLInputElement).select()"
                />
                <button class="btn btn-outline-secondary" @click="copyKey">
                  <i class="bi" :class="keyCopied ? 'bi-check-lg text-success' : 'bi-clipboard'" />
                  {{ keyCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
            <div class="modal-footer border-top-0">
              <button class="btn btn-primary" @click="closeKeyModal">I've saved the key</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

