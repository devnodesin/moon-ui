<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import ApiKeyModal from '@/components/ui/ApiKeyModal.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { createApiKeysService } from '@/services/apikeys'

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
    // Use getApiKey to fetch individual key
    const res = await service.value.getApiKey(props.id)
    const found = res.data[0]
    if (found) {
      name.value = found.name
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
      // Edit: name and can_write only (role not editable per SPEC)
      const res = await service.value!.updateApiKey(props.id!, {
        name: name.value.trim(),
        can_write: canWrite.value,
      })
      toastStore.show(res.message, 'success')
      router.push({ name: 'apikeys' })
    } else {
      const res = await service.value!.createApiKey({
        name: name.value.trim(),
        role: role.value,
        can_write: canWrite.value,
      })
      toastStore.show(res.message, 'success')
      // Show key modal — key is only returned once at creation
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

      <!-- Load error -->
      <div v-if="loadError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadApiKey">Retry</button>
      </div>

      <div v-else class="card border-0 shadow-sm" style="max-width: 540px">
        <div class="card-body">
          <!-- Skeleton while loading -->
          <template v-if="loading">
            <div v-for="n in 3" :key="n" class="mb-3 placeholder-glow">
              <span class="placeholder col-3 mb-1 d-block" />
              <span class="placeholder col-12 d-block" style="height: 38px" />
            </div>
          </template>

          <template v-else>
            <!-- Form-level error -->
            <div v-if="formError" class="alert alert-danger py-2 mb-3">
              {{ formError }}
            </div>

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

            <!-- Role (create only) -->
            <div v-if="!isEditMode" class="mb-3">
              <label class="form-label fw-semibold">Role</label>
              <select v-model="role" class="form-select" :disabled="saving">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <!-- Can Write -->
            <div class="mb-4">
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
                  <span class="text-muted small ms-1">(allows write access to collections)</span>
                </label>
              </div>
            </div>

            <!-- Info note on create -->
            <div v-if="!isEditMode" class="alert alert-info py-2 mb-3 small">
              <i class="bi bi-info-circle me-1" />
              The API key value will be shown <strong>once</strong> after creation. Store it securely.
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

    <!-- API Key Display Modal (shown once after create) -->
    <ApiKeyModal
      v-if="revealedKey"
      :api-key="revealedKey"
      :key-name="name"
      title="API Key Created"
      @close="closeKeyModal"
    />
  </AppLayout>
</template>
