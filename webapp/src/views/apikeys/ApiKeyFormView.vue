<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import ApiKeyModal from '@/components/ui/ApiKeyModal.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { createApiKeysService } from '@/services/apikeys'
import type { ApiKey } from '@/types/api'

const props = defineProps<{ id?: string }>()
const isEditMode = computed(() => !!props.id)

const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value ? createApiKeysService(activeConn.value.baseUrl, activeConn.value.id) : null,
)

// Form fields
const name = ref('')
const description = ref('')
const role = ref<'admin' | 'user'>('user')
const canWrite = ref(false)

// State
const loading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
const formError = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

// Key display modal — shown once after create
const revealedKey = ref<string | null>(null)

async function loadApiKey(): Promise<void> {
  if (!service.value || !props.id) return
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.listApiKeys()
    // Fetch individual key to pre-fill form (list doesn't include key secret)
    const all = res.data
    const found = all.find((k: ApiKey) => k.id === props.id)
    if (found) {
      name.value = found.name
      description.value = found.description
      role.value = found.role
      canWrite.value = found.can_write
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
  if (!name.value.trim()) errors['name'] = 'Name is required'
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

async function save(): Promise<void> {
  formError.value = null
  if (!validate()) return

  saving.value = true
  try {
    if (isEditMode.value) {
      // Edit: name, description, can_write only (role not editable per SPEC)
      const res = await service.value!.updateApiKey(props.id!, {
        name: name.value.trim(),
        description: description.value.trim(),
        can_write: canWrite.value,
      })
      toastStore.show(res.message, 'success')
      router.push({ name: 'apikeys' })
    } else {
      const res = await service.value!.createApiKey({
        name: name.value.trim(),
        description: description.value.trim(),
        role: role.value,
        can_write: canWrite.value,
      })
      toastStore.show(res.message, 'success')
      // Show key modal — key is only returned once at creation
      if (res.data.key) {
        revealedKey.value = res.data.key
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

onMounted(() => {
  if (isEditMode.value) loadApiKey()
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center gap-2 mb-4">
        <button class="btn btn-sm btn-outline-secondary" @click="goBack">
          <i class="bi bi-arrow-left" />
        </button>
        <h1 class="h3 fw-bold mb-0">
          <i class="bi bi-key me-2 text-primary" />
          {{ isEditMode ? 'Edit API Key' : 'Add API Key' }}
        </h1>
      </div>

      <!-- Load error -->
      <div v-if="loadError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadApiKey">Retry</button>
      </div>

      <div v-else class="card border-0 shadow-sm" style="max-width: 540px">
        <div class="card-body">
          <!-- Skeleton -->
          <template v-if="loading">
            <div v-for="n in 4" :key="n" class="mb-3 placeholder-glow">
              <span class="placeholder col-3 mb-1 d-block" />
              <span class="placeholder col-12 d-block" style="height: 38px" />
            </div>
          </template>

          <template v-else>
            <!-- Form-level error -->
            <div v-if="formError" class="alert alert-danger py-2 mb-3">{{ formError }}</div>

            <!-- Name -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Name <span class="text-danger">*</span></label>
              <input
                v-model="name"
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

            <!-- Description -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Description</label>
              <textarea
                v-model="description"
                class="form-control"
                rows="2"
                placeholder="Optional description"
                :disabled="saving"
              />
            </div>

            <!-- Role (create only — per SPEC, not editable after creation) -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Role</label>
              <select v-model="role" class="form-select" :disabled="saving || isEditMode">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div v-if="isEditMode" class="form-text">Role cannot be changed after creation.</div>
            </div>

            <!-- Can Write -->
            <div class="mb-4">
              <div class="form-check form-switch">
                <input
                  id="api-can-write"
                  v-model="canWrite"
                  type="checkbox"
                  class="form-check-input"
                  role="switch"
                  :disabled="saving"
                />
                <label class="form-check-label" for="api-can-write">
                  Can Write
                  <span class="text-muted small ms-1">(allows write access to collections)</span>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <button class="btn btn-primary" :disabled="saving" @click="save">
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

    <!-- API Key Display Modal — shown once after creation -->
    <ApiKeyModal
      v-if="revealedKey"
      :api-key="revealedKey"
      :key-name="name"
      title="API Key Created"
      @close="closeKeyModal"
    />
  </AppLayout>
</template>
