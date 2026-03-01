<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'
import { authLogout } from '@/services/auth'
import { createHttpClient } from '@/services/http'

const authStore = useAuthStore()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const router = useRouter()

const emit = defineEmits<{ toggleSidebar: [] }>()

async function handleLogout(): Promise<void> {
  try {
    const conn = connectionsStore.activeConnection
    if (conn && authStore.accessToken && authStore.refreshToken) {
      const client = createHttpClient(conn.baseUrl, conn.id)
      await authLogout(client, authStore.refreshToken)
    }
  } catch {
    // Ignore logout errors
  } finally {
    authStore.clearSession()
    toastStore.show('Logged out successfully', 'success')
    await router.push('/login')
  }
}
</script>

<template>
  <nav class="navbar navbar-dark bg-dark px-3">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-dark d-lg-none" @click="emit('toggleSidebar')">
        <i class="bi bi-list fs-5" />
      </button>
      <span class="navbar-brand mb-0 fw-bold">
        <i class="bi bi-moon-stars-fill me-1" />
        Moon Admin
      </span>
    </div>

    <div class="d-flex align-items-center gap-3">
      <span
        v-if="connectionsStore.activeConnection"
        class="badge bg-success text-white d-none d-md-inline-flex align-items-center gap-1"
      >
        <i class="bi bi-server" />
        {{ connectionsStore.activeConnection.name }}
      </span>
      <span v-else class="badge bg-secondary text-light d-none d-md-inline-flex align-items-center gap-1">
        <i class="bi bi-server" />
        Not connected
      </span>
      <div class="dropdown">
        <button
          class="btn btn-dark dropdown-toggle d-flex align-items-center gap-2"
          type="button"
          data-bs-toggle="dropdown"
        >
          <i class="bi bi-person-circle" />
          <span class="d-none d-sm-inline">{{ authStore.user?.username ?? 'User' }}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
          <li>
            <span class="dropdown-item-text small text-white-50">
              {{ authStore.user?.email }}
            </span>
          </li>
          <li><hr class="dropdown-divider" /></li>
          <li>
            <button class="dropdown-item" @click="handleLogout">
              <i class="bi bi-box-arrow-right me-2" />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
