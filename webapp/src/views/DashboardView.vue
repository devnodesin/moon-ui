<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useAsync } from '@/composables/useAsync'
import { getHealth } from '@/services/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { HealthData } from '@/types/api'

const authStore = useAuthStore()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const router = useRouter()

const conn = connectionsStore.activeConnection

const {
  loading: healthLoading,
  error: healthError,
  data: healthData,
  execute: fetchHealth,
} = useAsync<HealthData>(() => {
  if (!conn) throw { message: 'No active connection', status: 0 }
  return getHealth(conn.baseUrl)
})

onMounted(async () => {
  if (!conn) {
    toastStore.show('No active connection. Please log in.', 'warning')
    await router.push('/login')
    return
  }
  await fetchHealth()
  if (healthError.value) {
    toastStore.show(healthError.value, 'error')
  }
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <h1 class="h3 fw-bold mb-0">
          <i class="bi bi-speedometer2 me-2 text-primary" />
          Dashboard
        </h1>
        <button
          class="btn btn-outline-secondary btn-sm"
          :disabled="healthLoading"
          @click="fetchHealth"
        >
          <span v-if="healthLoading" class="spinner-border spinner-border-sm me-1" />
          <i v-else class="bi bi-arrow-clockwise me-1" />
          Refresh
        </button>
      </div>

      <!-- Connection Info -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6 col-xl-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                  <i class="bi bi-server text-primary fs-4" />
                </div>
                <div>
                  <div class="small text-muted">Connection</div>
                  <div class="fw-bold">{{ conn?.name ?? '—' }}</div>
                  <div class="small text-muted text-truncate" style="max-width: 180px">
                    {{ conn?.baseUrl ?? '—' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle bg-success bg-opacity-10 p-3">
                  <i class="bi bi-person-circle text-success fs-4" />
                </div>
                <div>
                  <div class="small text-muted">Logged in as</div>
                  <div class="fw-bold">{{ authStore.user?.username }}</div>
                  <div class="small">
                    <span
                      class="badge"
                      :class="authStore.user?.role === 'admin' ? 'bg-danger' : 'bg-secondary'"
                    >
                      {{ authStore.user?.role }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Status Card -->
        <div class="col-12 col-md-6 col-xl-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3">
                <div
                  class="rounded-circle p-3"
                  :class="healthError ? 'bg-danger bg-opacity-10' : 'bg-success bg-opacity-10'"
                >
                  <i
                    class="bi fs-4"
                    :class="
                      healthLoading
                        ? 'bi-hourglass-split text-secondary'
                        : healthError
                          ? 'bi-x-circle-fill text-danger'
                          : 'bi-heart-pulse-fill text-success'
                    "
                  />
                </div>
                <div>
                  <div class="small text-muted">Server Health</div>
                  <div v-if="healthLoading" class="fw-bold text-muted">Checking...</div>
                  <div v-else-if="healthError" class="fw-bold text-danger">Offline</div>
                  <div v-else class="fw-bold text-success">Online</div>
                  <div v-if="healthData" class="small text-muted">
                    Moon v{{ healthData.moon }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle bg-info bg-opacity-10 p-3">
                  <i class="bi bi-clock-history text-info fs-4" />
                </div>
                <div>
                  <div class="small text-muted">Last Check</div>
                  <div class="fw-bold">
                    {{
                      healthData ? new Date(healthData.timestamp).toLocaleTimeString() : '—'
                    }}
                  </div>
                  <div class="small text-muted">
                    {{ healthData ? new Date(healthData.timestamp).toLocaleDateString() : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Access -->
      <h5 class="fw-semibold mb-3">Quick Access</h5>
      <div class="row g-3">
        <div class="col-12 col-sm-6 col-lg-4">
          <RouterLink to="/collections" class="card border-0 shadow-sm text-decoration-none h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-table text-primary fs-2" />
              <div>
                <div class="fw-bold">Collections</div>
                <div class="small text-muted">Manage your data collections</div>
              </div>
              <i class="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </RouterLink>
        </div>

        <div v-if="authStore.user?.role === 'admin'" class="col-12 col-sm-6 col-lg-4">
          <RouterLink to="/users" class="card border-0 shadow-sm text-decoration-none h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-people text-success fs-2" />
              <div>
                <div class="fw-bold">Users</div>
                <div class="small text-muted">Manage user accounts</div>
              </div>
              <i class="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </RouterLink>
        </div>

        <div v-if="authStore.user?.role === 'admin'" class="col-12 col-sm-6 col-lg-4">
          <RouterLink to="/apikeys" class="card border-0 shadow-sm text-decoration-none h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-key text-warning fs-2" />
              <div>
                <div class="fw-bold">API Keys</div>
                <div class="small text-muted">Manage API access keys</div>
              </div>
              <i class="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </RouterLink>
        </div>

        <div class="col-12 col-sm-6 col-lg-4">
          <RouterLink to="/connections" class="card border-0 shadow-sm text-decoration-none h-100">
            <div class="card-body d-flex align-items-center gap-3">
              <i class="bi bi-plug text-secondary fs-2" />
              <div>
                <div class="fw-bold">Connections</div>
                <div class="small text-muted">Manage backend connections</div>
              </div>
              <i class="bi bi-chevron-right ms-auto text-muted" />
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
