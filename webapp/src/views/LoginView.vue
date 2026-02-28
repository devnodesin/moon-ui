<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { authLogin } from '@/services/auth'
import type { ApiError } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()

const url = ref('')
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const connName = ref('My Server')

onMounted(() => {
  connectionsStore.loadFromStorage()
  const active = connectionsStore.activeConnection
  if (active) {
    url.value = active.baseUrl
    connName.value = active.name
  }
})

async function handleLogin(): Promise<void> {
  errorMessage.value = null

  if (!url.value || !username.value || !password.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  let baseUrl = url.value.trim().replace(/\/$/, '')
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    errorMessage.value = 'URL must start with http:// or https://'
    return
  }

  loading.value = true

  try {
    const tokens = await authLogin(baseUrl, { username: username.value, password: password.value })

    // Create or reuse connection
    let conn = connectionsStore.connections.find((c) => c.baseUrl === baseUrl)
    if (!conn) {
      conn = connectionsStore.addConnection({
        id: crypto.randomUUID(),
        name: connName.value || baseUrl,
        baseUrl,
      })
    }
    connectionsStore.setActive(conn.id)
    authStore.setSession(conn.id, tokens, rememberMe.value)

    toastStore.show('Login successful', 'success')
    await router.push('/dashboard')
  } catch (err) {
    const apiErr = err as ApiError
    errorMessage.value = apiErr.message ?? 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div class="card shadow" style="width: 100%; max-width: 420px">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <i class="bi bi-moon-stars-fill text-primary" style="font-size: 2.5rem" />
          <h2 class="mt-2 fw-bold">Moon Admin</h2>
          <p class="text-muted small">Connect to your Moon API server</p>
        </div>

        <div
          v-if="errorMessage"
          class="alert alert-danger d-flex align-items-center gap-2"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle-fill" />
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="server-url" class="form-label fw-semibold">Server URL</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-server" /></span>
              <input
                id="server-url"
                v-model="url"
                type="url"
                class="form-control"
                placeholder="https://your-moon-server.com"
                autocomplete="url"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="conn-name" class="form-label fw-semibold">Connection Name</label>
            <input
              id="conn-name"
              v-model="connName"
              type="text"
              class="form-control"
              placeholder="My Server"
              :disabled="loading"
            />
          </div>

          <div class="mb-3">
            <label for="username" class="form-label fw-semibold">Username</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-person" /></span>
              <input
                id="username"
                v-model="username"
                type="text"
                class="form-control"
                placeholder="Username"
                autocomplete="username"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label fw-semibold">Password</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-lock" /></span>
              <input
                id="password"
                v-model="password"
                type="password"
                class="form-control"
                placeholder="Password"
                autocomplete="current-password"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="mb-4 form-check">
            <input
              id="remember-me"
              v-model="rememberMe"
              type="checkbox"
              class="form-check-input"
              :disabled="loading"
            />
            <label for="remember-me" class="form-check-label">Remember Me</label>
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" />
            {{ loading ? 'Connecting...' : 'Connect' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
