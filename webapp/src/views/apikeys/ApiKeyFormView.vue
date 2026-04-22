<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import ApiKeyModal from '@/components/ui/ApiKeyModal.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { createApiKeysService } from '@/services/apikeys'
import { createCollectionsService } from '@/services/collections'
import type { CollectionSummary } from '@/types/api'
import { isValidUrl } from '@/utils/validators'

const props = defineProps<{ id?: string }>()
const isEditMode = computed(() => !!props.id)

const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value ? createApiKeysService(activeConn.value.baseUrl, activeConn.value.id) : null
)
const collectionsService = computed(() =>
  activeConn.value ? createCollectionsService(activeConn.value.baseUrl, activeConn.value.id) : null
)

const EXCLUDED_COLLECTIONS = new Set(['users', 'apikeys'])
const COLLECTIONS_PER_PAGE = 100
const MAX_COLLECTION_PAGES = 50
const DEFAULT_RATE_LIMIT = 15

// Form fields
const name = ref('')
const role = ref<'admin' | 'user'>('user')
const canWrite = ref(false)
const selectedCollections = ref<string[]>([])
const isWebsite = ref(false)
const allowedOrigins = ref<string[]>([])
const rateLimit = ref(DEFAULT_RATE_LIMIT)
const captchaRequired = ref(false)
const enabled = ref(true)

// State
const loading = ref(false)
const saving = ref(false)
const collectionsLoading = ref(false)
const loadError = ref<string | null>(null)
const formError = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})
const availableCollections = ref<CollectionSummary[]>([])

// Key display modal — shown once after create
const revealedKey = ref<string | null>(null)

const collectionOptions = computed(() =>
  Array.from(
    new Set([
      ...availableCollections.value.map((collection) => collection.name),
      ...selectedCollections.value,
    ])
  ).sort((left, right) => left.localeCompare(right))
)

watch(isWebsite, (value) => {
  if (value && allowedOrigins.value.length === 0) {
    allowedOrigins.value = ['']
    return
  }

  if (!value) {
    allowedOrigins.value = []
  }
})

function normalizeOrigins(origins: string[]): string[] {
  return Array.from(
    new Set(origins.map((origin) => origin.trim()).filter((origin) => origin.length > 0))
  )
}

function normalizeCollections(collections: string[]): string[] {
  return Array.from(
    new Set(
      collections
        .map((collection) => collection.trim())
        .filter((collection) => collection.length > 0)
    )
  )
}

function filterAvailableCollections(collections: CollectionSummary[]): CollectionSummary[] {
  return collections
    .filter((collection) => !collection.system && !EXCLUDED_COLLECTIONS.has(collection.name))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function addAllowedOrigin(): void {
  allowedOrigins.value = [...allowedOrigins.value, '']
}

function removeAllowedOrigin(index: number): void {
  allowedOrigins.value = allowedOrigins.value.filter((_, currentIndex) => currentIndex !== index)
  if (isWebsite.value && allowedOrigins.value.length === 0) {
    allowedOrigins.value = ['']
  }
}

async function loadAvailableCollections(): Promise<void> {
  if (!collectionsService.value) return

  collectionsLoading.value = true
  try {
    const allCollections: CollectionSummary[] = []
    let page = 1

    while (page <= MAX_COLLECTION_PAGES) {
      const res = await collectionsService.value.listCollections({
        page: String(page),
        per_page: String(COLLECTIONS_PER_PAGE),
      })

      allCollections.push(...filterAvailableCollections(res.data ?? []))

      if (page >= res.meta.total_pages) break
      page += 1
    }

    if (page > MAX_COLLECTION_PAGES) {
      throw new Error('Failed to load available collections')
    }

    availableCollections.value = allCollections
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load available collections'
    toastStore.show(msg, 'error')
    console.error('[ApiKeyFormView] collections load error:', err)
  } finally {
    collectionsLoading.value = false
  }
}

async function loadApiKey(): Promise<void> {
  if (!service.value || !props.id) return
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.getApiKey(props.id)
    const found = res.data[0]
    if (found) {
      name.value = found.name
      role.value = found.role
      canWrite.value = found.can_write
      selectedCollections.value = normalizeCollections(found.collections ?? [])
      isWebsite.value = found.is_website
      allowedOrigins.value = found.allowed_origins ? [...found.allowed_origins] : []
      rateLimit.value = found.rate_limit
      captchaRequired.value = found.captcha_required
      enabled.value = found.enabled
    } else {
      loadError.value = 'API key not found'
    }
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load API key'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[ApiKeyFormView] load error:', err)
  } finally {
    loading.value = false
  }
}

function validate(): boolean {
  const errors: Record<string, string> = {}
  const normalizedOrigins = normalizeOrigins(allowedOrigins.value)

  if (!name.value.trim()) errors['name'] = 'Name is required'

  if (!Number.isInteger(rateLimit.value) || rateLimit.value < 0) {
    errors['rateLimit'] = 'Rate limit must be a whole number of at least 0'
  }

  if (isWebsite.value && normalizedOrigins.some((origin) => !isValidUrl(origin))) {
    errors['allowedOrigins'] = 'Allowed origins must be valid http:// or https:// URLs'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

async function save(): Promise<void> {
  formError.value = null
  if (!service.value) {
    formError.value = 'No active connection selected'
    return
  }

  if (!validate()) return

  const normalizedCollections = normalizeCollections(selectedCollections.value)
  const normalizedOrigins = normalizeOrigins(allowedOrigins.value)

  saving.value = true
  try {
    if (isEditMode.value) {
      const res = await service.value.updateApiKey(props.id!, {
        name: name.value.trim(),
        can_write: canWrite.value,
        collections: normalizedCollections,
        is_website: isWebsite.value,
        allowed_origins: isWebsite.value ? normalizedOrigins : null,
        rate_limit: rateLimit.value,
        captcha_required: captchaRequired.value,
        enabled: enabled.value,
      })
      toastStore.show(res.message, 'success')
      router.push({ name: 'apikeys' })
    } else {
      const res = await service.value.createApiKey({
        name: name.value.trim(),
        role: role.value,
        can_write: canWrite.value,
        collections: normalizedCollections,
        is_website: isWebsite.value,
        allowed_origins: isWebsite.value ? normalizedOrigins : null,
        rate_limit: rateLimit.value,
        captcha_required: captchaRequired.value,
        enabled: enabled.value,
      })
      toastStore.show(res.message, 'success')
      const newKey = res.data?.[0]?.key
      if (newKey) {
        revealedKey.value = newKey
      } else {
        router.push({ name: 'apikeys' })
      }
    }
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Save failed'
    formError.value = msg
    console.error('[ApiKeyFormView] save error:', err)
  } finally {
    saving.value = false
  }
}

function closeKeyModal(): void {
  revealedKey.value = null
  router.push({ name: 'apikeys' })
}

function goBack(): void {
  router.push({ name: 'apikeys' })
}

onMounted(async () => {
  await loadAvailableCollections()
  if (isEditMode.value) await loadApiKey()
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <div class="d-flex align-items-center gap-2 mb-4">
        <button class="btn btn-sm btn-outline-secondary" @click="goBack">
          <i class="bi bi-arrow-left" />API Keys
        </button>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item active fs-4" aria-current="page">
              {{ isEditMode ? 'Edit API Key' : 'Add API Key' }}
            </li>
          </ol>
        </nav>
      </div>

      <div v-if="loadError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadApiKey">Retry</button>
      </div>

      <div v-else class="card border-0 shadow-sm" style="max-width: 760px">
        <div class="card-body">
          <template v-if="loading">
            <div v-for="n in 6" :key="n" class="mb-3 placeholder-glow">
              <span class="placeholder col-3 mb-1 d-block" />
              <span class="placeholder col-12 d-block" style="height: 38px" />
            </div>
          </template>

          <template v-else>
            <div v-if="formError" class="alert alert-danger py-2 mb-3">
              {{ formError }}
            </div>

            <div class="row g-3">
              <div class="col-12">
                <label class="form-label fw-semibold"
                  >Name <span class="text-danger">*</span></label
                >
                <input
                  v-model="name"
                  name="api-key-name"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': validationErrors['name'] }"
                  placeholder="e.g. Integration Service"
                  :disabled="saving"
                />
                <div v-if="validationErrors['name']" class="invalid-feedback">
                  {{ validationErrors['name'] }}
                </div>
              </div>

              <div v-if="!isEditMode" class="col-md-6">
                <label class="form-label fw-semibold">Role</label>
                <select v-model="role" class="form-select" :disabled="saving">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold">Rate Limit</label>
                <input
                  id="rate-limit"
                  v-model.number="rateLimit"
                  type="number"
                  min="0"
                  step="1"
                  class="form-control"
                  :class="{ 'is-invalid': validationErrors['rateLimit'] }"
                  :disabled="saving"
                />
                <div v-if="validationErrors['rateLimit']" class="invalid-feedback">
                  {{ validationErrors['rateLimit'] }}
                </div>
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold d-block">Collections</label>
                <div class="border rounded p-3 bg-body-tertiary">
                  <div
                    v-if="collectionsLoading"
                    class="d-flex align-items-center text-muted small gap-2"
                  >
                    <span
                      class="spinner-border spinner-border-sm text-primary"
                      role="status"
                      aria-hidden="true"
                    />
                    Loading collections…
                  </div>
                  <div v-else-if="collectionOptions.length === 0" class="text-muted small">
                    No collections are currently available on this Moon server.
                  </div>
                  <div v-else class="row g-2">
                    <div
                      v-for="collectionName in collectionOptions"
                      :key="collectionName"
                      class="col-sm-6"
                    >
                      <div class="form-check border rounded bg-white px-3 py-2 h-100">
                        <input
                          :id="`collection-${collectionName}`"
                          v-model="selectedCollections"
                          class="form-check-input"
                          type="checkbox"
                          :value="collectionName"
                          :disabled="saving"
                        />
                        <label
                          class="form-check-label fw-semibold text-break"
                          :for="`collection-${collectionName}`"
                        >
                          {{ collectionName }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-text">
                  Choose which collections this API key can access on the current Moon server.
                </div>
              </div>

              <div class="col-md-6">
                <div class="form-check form-switch">
                  <input
                    id="can-write"
                    v-model="canWrite"
                    type="checkbox"
                    class="form-check-input"
                    role="switch"
                    :disabled="saving"
                  />
                  <label class="form-check-label" for="can-write">
                    Can Write
                    <span class="text-muted small ms-1"
                      >(allows write access to selected collections)</span
                    >
                  </label>
                </div>
              </div>

              <div class="col-md-6">
                <div class="form-check form-switch">
                  <input
                    id="enabled"
                    v-model="enabled"
                    type="checkbox"
                    class="form-check-input"
                    role="switch"
                    :disabled="saving"
                  />
                  <label class="form-check-label" for="enabled">Enabled</label>
                </div>
              </div>

              <div class="col-md-6">
                <div class="form-check form-switch">
                  <input
                    id="is-website"
                    v-model="isWebsite"
                    type="checkbox"
                    class="form-check-input"
                    role="switch"
                    :disabled="saving"
                  />
                  <label class="form-check-label" for="is-website">
                    Website API Key
                    <span class="text-muted small ms-1"
                      >(restrict browser use with allowed origins)</span
                    >
                  </label>
                </div>
              </div>

              <div class="col-md-6">
                <div class="form-check form-switch">
                  <input
                    id="captcha-required"
                    v-model="captchaRequired"
                    type="checkbox"
                    class="form-check-input"
                    role="switch"
                    :disabled="saving"
                  />
                  <label class="form-check-label" for="captcha-required"> CAPTCHA Required </label>
                </div>
              </div>

              <div v-if="isWebsite" class="col-12">
                <label class="form-label fw-semibold d-block">Allowed Origins</label>
                <div class="d-flex flex-column gap-2">
                  <div
                    v-for="(_, index) in allowedOrigins"
                    :key="`origin-${index}`"
                    class="input-group"
                  >
                    <input
                      :data-testid="`origin-input-${index}`"
                      v-model="allowedOrigins[index]"
                      type="url"
                      class="form-control"
                      :class="{ 'is-invalid': validationErrors['allowedOrigins'] }"
                      placeholder="https://example.com"
                      :disabled="saving"
                    />
                    <button
                      :data-testid="`remove-origin-${index}`"
                      class="btn btn-outline-danger"
                      type="button"
                      :disabled="saving"
                      @click="removeAllowedOrigin(index)"
                    >
                      <i class="bi bi-x-lg me-1" />Remove
                    </button>
                  </div>
                </div>
                <div v-if="validationErrors['allowedOrigins']" class="invalid-feedback d-block">
                  {{ validationErrors['allowedOrigins'] }}
                </div>
                <div class="d-flex align-items-center justify-content-between gap-2 mt-2">
                  <div class="form-text mb-0">
                    Add every website origin that should be allowed to use this API key.
                  </div>
                  <button
                    data-testid="add-origin"
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    :disabled="saving"
                    @click="addAllowedOrigin"
                  >
                    <i class="bi bi-plus-lg me-1" />Add Origin
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!isEditMode" class="alert alert-info py-2 mb-3 mt-4 small">
              <i class="bi bi-info-circle me-1" />
              The API key value will be shown <strong>once</strong> after creation. Store it
              securely.
            </div>

            <div class="d-flex gap-2 mt-4">
              <button id="save-api-key" class="btn btn-primary" :disabled="saving" @click="save">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status" />
                <i v-else class="bi bi-check2 me-1" />
                {{ isEditMode ? 'Save Changes' : 'Create API Key' }}
              </button>
              <button class="btn btn-outline-secondary" :disabled="saving" @click="goBack">
                Cancel
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <ApiKeyModal
      v-if="revealedKey"
      :api-key="revealedKey"
      :key-name="name"
      title="API Key Created"
      @close="closeKeyModal"
    />
  </AppLayout>
</template>
