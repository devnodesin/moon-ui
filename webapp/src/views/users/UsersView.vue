<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useConfirm } from '@/composables/useConfirm'
import { createUsersService } from '@/services/users'
import type { MoonUser, ApiListMeta } from '@/types/api'

const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const { confirm } = useConfirm()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value ? createUsersService(activeConn.value.baseUrl, activeConn.value.id) : null,
)

// List state
const rows = ref<MoonUser[]>([])
const meta = ref<ApiListMeta | null>(null)
const loading = ref(false)
const loadingType = ref<'initial' | 'page' | 'filter'>('initial')
const loadError = ref<string | null>(null)

// Pagination — page-based
const perPage = ref(15)
const currentPage = ref(1)
const totalPages = ref(0)
const hasNext = computed(() => currentPage.value < totalPages.value)
const hasPrev = computed(() => currentPage.value > 1)

// Search
const searchQuery = ref('')
const activeSearch = ref('')

// Row action loading
const actionUserId = ref<string | null>(null)

// Reset password modal state
const resetPwdUserId = ref<string | null>(null)
const resetPwdUser = ref<MoonUser | null>(null)
const newPassword = ref('')
const resetPwdLoading = ref(false)
const resetPwdError = ref<string | null>(null)

const SKELETON_COUNT = 5

function buildParams(): Record<string, string> {
  const p: Record<string, string> = { per_page: String(perPage.value), page: String(currentPage.value) }
  if (activeSearch.value) p['q'] = activeSearch.value
  return p
}

async function loadUsers(type: typeof loadingType.value = 'initial'): Promise<void> {
  if (!service.value) return
  loadingType.value = type
  loading.value = true
  loadError.value = null
  try {
    const res = await service.value.listUsers(buildParams())
    rows.value = res.data
    meta.value = res.meta
    currentPage.value = res.meta.current_page
    totalPages.value = res.meta.total_pages
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load users'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[UsersView] load error:', err)
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  activeSearch.value = searchQuery.value
  currentPage.value = 1
  loadUsers('filter')
}

function goNext(): void {
  if (hasNext.value) {
    currentPage.value++
    loadUsers('page')
  }
}

function goPrev(): void {
  if (hasPrev.value) {
    currentPage.value--
    loadUsers('page')
  }
}

function handlePerPageChange(newPerPage: number): void {
  perPage.value = newPerPage
  currentPage.value = 1
  loadUsers('page')
}

function formatDate(dt?: string | null): string {
  if (!dt) return 'Never'
  try {
    return new Date(dt).toLocaleString()
  } catch {
    return dt
  }
}

// --- Row actions ---

function editUser(id: string): void {
  router.push({ name: 'user-edit', params: { id } })
}

async function deleteUser(user: MoonUser): Promise<void> {
  const ok = await confirm(`Delete user "${user.username}"? This cannot be undone.`, {
    variant: 'danger',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  actionUserId.value = user.id
  try {
    const res = await service.value!.deleteUser(user.id)
    toastStore.show(res.message, 'success')
    await loadUsers(loading.value ? 'filter' : 'initial')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Delete failed'
    toastStore.show(msg, 'error')
    console.error('[UsersView] delete error:', err)
  } finally {
    actionUserId.value = null
  }
}

// Reset password modal
function openResetPassword(user: MoonUser): void {
  resetPwdUserId.value = user.id
  resetPwdUser.value = user
  newPassword.value = ''
  resetPwdError.value = null
}

function closeResetPassword(): void {
  resetPwdUserId.value = null
  resetPwdUser.value = null
  newPassword.value = ''
  resetPwdError.value = null
}

async function submitResetPassword(): Promise<void> {
  if (!newPassword.value.trim()) {
    resetPwdError.value = 'New password is required'
    return
  }
  resetPwdLoading.value = true
  resetPwdError.value = null
  try {
    const res = await service.value!.updateUser(resetPwdUserId.value!, {
      password: newPassword.value,
    })
    toastStore.show(res.message, 'success')
    closeResetPassword()
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to reset password'
    resetPwdError.value = msg
    console.error('[UsersView] reset password error:', err)
  } finally {
    resetPwdLoading.value = false
  }
}

onMounted(() => loadUsers('initial'))
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item active fs-4" aria-current="page"><i class="bi bi-people me-2 text-primary" />Users</li>
          </ol>
        </nav>
        <button class="btn btn-sm btn-primary" @click="router.push({ name: 'user-create' })">
          <i class="bi bi-plus-lg me-1" />Add User
        </button>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body pb-0">
          <!-- Search -->
          <div class="row g-2 mb-3">
            <div class="col-12 col-md-6 col-lg-5">
              <SearchBar
                v-model="searchQuery"
                placeholder="Search by username or email…"
                :loading="loading && loadingType === 'filter'"
                @search="handleSearch"
              />
            </div>
          </div>
        </div>

        <!-- Load error -->
        <div v-if="loadError && !loading" class="px-4 py-3">
          <div class="alert alert-danger mb-0">
            <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
            <button class="btn btn-sm btn-outline-danger ms-2" @click="loadUsers('initial')">
              Retry
            </button>
          </div>
        </div>

        <!-- Table -->
        <div v-else class="position-relative">
          <!-- Overlay for page/filter reload -->
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
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Can Write</th>
                  <th>Last Login</th>
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
                  <tr v-for="user in rows" :key="user.id">
                    <td class="fw-semibold">{{ user.username }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="user.role === 'admin' ? 'bg-danger' : 'bg-secondary'"
                      >
                        {{ user.role }}
                      </span>
                    </td>
                    <td>
                      <i
                        class="bi"
                        :class="user.can_write ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-muted'"
                      />
                    </td>
                    <td class="text-muted small">{{ formatDate(user.last_login_at) }}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          title="Edit"
                          :disabled="actionUserId === user.id"
                          @click="editUser(user.id)"
                        >
                          <i class="bi bi-pencil" />
                        </button>
                        <button
                          class="btn btn-sm btn-outline-warning"
                          title="Reset Password"
                          :disabled="actionUserId === user.id"
                          @click="openResetPassword(user)"
                        >
                          <i class="bi bi-key" />
                        </button>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          title="Delete"
                          :disabled="actionUserId === user.id"
                          @click="deleteUser(user)"
                        >
                          <span
                            v-if="actionUserId === user.id"
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
                  <td colspan="6" class="p-0">
                    <EmptyState icon="bi-people" title="No users found" message="Try a different search term." />
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

    <!-- Reset Password Modal -->
    <Teleport to="body">
      <div
        v-if="resetPwdUserId"
        class="modal show d-block"
        tabindex="-1"
        style="background: rgba(0,0,0,0.5)"
        @click.self="closeResetPassword"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-key me-2" />Reset Password
              </h5>
              <button type="button" class="btn-close" @click="closeResetPassword" />
            </div>
            <div class="modal-body">
              <p class="text-muted mb-3">
                Resetting password for <strong>{{ resetPwdUser?.username }}</strong>.
              </p>
              <div class="alert alert-danger py-2" v-if="resetPwdError">
                {{ resetPwdError }}
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">New Password</label>
                <input
                  v-model="newPassword"
                  type="password"
                  class="form-control"
                  placeholder="Enter new password"
                  :disabled="resetPwdLoading"
                  @keydown.enter="submitResetPassword"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" :disabled="resetPwdLoading" @click="closeResetPassword">
                Cancel
              </button>
              <button class="btn btn-warning" :disabled="resetPwdLoading" @click="submitResetPassword">
                <span v-if="resetPwdLoading" class="spinner-border spinner-border-sm me-1" role="status" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>
