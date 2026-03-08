<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { createUsersService } from '@/services/users'
import type { MoonUser } from '@/types/api'

const props = defineProps<{ id?: string }>()
const isEditMode = computed(() => !!props.id)

const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value ? createUsersService(activeConn.value.baseUrl, activeConn.value.id) : null,
)

// Form fields
const username = ref('')
const email = ref('')
const password = ref('')
const role = ref<'admin' | 'user'>('user')
const canWrite = ref(true)

// State
const loading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
const formError = ref<string | null>(null)
const validationErrors = ref<Record<string, string>>({})

const SKELETON_COUNT = 4

async function loadUser(): Promise<void> {
  if (!service.value || !props.id) return
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.getUser(props.id)
    // New API: data is an array, take first element
    const u: MoonUser = res.data[0]
    username.value = u.username
    email.value = u.email
    role.value = u.role
    canWrite.value = u.can_write
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load user'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[UserFormView] load error:', err)
  } finally {
    loading.value = false
  }
}

function validate(): boolean {
  const errors: Record<string, string> = {}
  if (!isEditMode.value && !username.value.trim()) errors['username'] = 'Username is required'
  if (!email.value.trim()) errors['email'] = 'Email is required'
  if (!email.value.includes('@')) errors['email'] = 'Enter a valid email address'
  if (!isEditMode.value && !password.value.trim()) errors['password'] = 'Password is required'
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

async function save(): Promise<void> {
  formError.value = null
  if (!validate()) return

  saving.value = true
  try {
    if (isEditMode.value) {
      const res = await service.value!.updateUser(props.id!, {
        email: email.value.trim(),
        role: role.value,
        can_write: canWrite.value,
      })
      toastStore.show(res.message, 'success')
    } else {
      const res = await service.value!.createUser({
        username: username.value.trim(),
        email: email.value.trim(),
        password: password.value,
        role: role.value,
        can_write: canWrite.value,
      })
      toastStore.show(res.message, 'success')
    }
    router.push({ name: 'users' })
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Save failed'
    formError.value = msg
    console.error('[UserFormView] save error:', err)
  } finally {
    saving.value = false
  }
}

function goBack(): void {
  router.push({ name: 'users' })
}

onMounted(() => {
  if (isEditMode.value) loadUser()
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center gap-2 mb-4">
        <button class="btn btn-sm btn-outline-secondary" @click="goBack">
          <i class="bi bi-arrow-left" /> Users
        </button>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item active fs-4" aria-current="page">
              {{ isEditMode ? 'Edit User' : 'Add User' }}
            </li>
          </ol>
        </nav>
      </div>

      <!-- Load error -->
      <div v-if="loadError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadUser">Retry</button>
      </div>

      <div v-else class="card border-0 shadow-sm" style="max-width: 540px">
        <div class="card-body">
          <!-- Skeleton -->
          <template v-if="loading">
            <div v-for="n in SKELETON_COUNT" :key="n" class="mb-3 placeholder-glow">
              <span class="placeholder col-3 mb-1 d-block" />
              <span class="placeholder col-12 d-block" style="height: 38px" />
            </div>
          </template>

          <template v-else>
            <!-- Form-level error -->
            <div v-if="formError" class="alert alert-danger py-2 mb-3">
              {{ formError }}
            </div>

            <!-- Username (create only) -->
            <div v-if="!isEditMode" class="mb-3">
              <label class="form-label fw-semibold">Username <span class="text-danger">*</span></label>
              <input
                v-model="username"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': validationErrors['username'] }"
                placeholder="e.g. moonuser"
                :disabled="saving"
                autocomplete="username"
              />
              <div v-if="validationErrors['username']" class="invalid-feedback">
                {{ validationErrors['username'] }}
              </div>
            </div>

            <!-- Username display (edit mode) -->
            <div v-else class="mb-3">
              <label class="form-label fw-semibold">Username</label>
              <input type="text" class="form-control" :value="username" disabled />
              <div class="form-text">Username cannot be changed.</div>
            </div>

            <!-- Email -->
            <div class="mb-3">
              <label class="form-label fw-semibold">Email <span class="text-danger">*</span></label>
              <input
                v-model="email"
                type="email"
                class="form-control"
                :class="{ 'is-invalid': validationErrors['email'] }"
                placeholder="user@example.com"
                :disabled="saving"
                autocomplete="email"
              />
              <div v-if="validationErrors['email']" class="invalid-feedback">
                {{ validationErrors['email'] }}
              </div>
            </div>

            <!-- Password (create only) -->
            <div v-if="!isEditMode" class="mb-3">
              <label class="form-label fw-semibold">Password <span class="text-danger">*</span></label>
              <input
                v-model="password"
                type="password"
                class="form-control"
                :class="{ 'is-invalid': validationErrors['password'] }"
                placeholder="Enter password"
                :disabled="saving"
                autocomplete="new-password"
              />
              <div v-if="validationErrors['password']" class="invalid-feedback">
                {{ validationErrors['password'] }}
              </div>
            </div>

            <!-- Role -->
            <div class="mb-3">
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

            <!-- Actions -->
            <div class="d-flex gap-2">
              <button class="btn btn-primary" :disabled="saving" @click="save">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status" />
                <i v-else class="bi bi-check2 me-1" />
                {{ isEditMode ? 'Save Changes' : 'Create User' }}
              </button>
              <button class="btn btn-outline-secondary" :disabled="saving" @click="goBack">
                Cancel
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
