<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useConfirm } from '@/composables/useConfirm'
import { ref } from 'vue'
import { getHealth } from '@/services/auth'

const connectionsStore = useConnectionsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { confirm } = useConfirm()

const adding = ref(false)
const validating = ref(false)
const newName = ref('')
const newUrl = ref('')

async function addConnection(): Promise<void> {
  if (!newName.value || !newUrl.value) {
    toastStore.show('Please fill in all fields.', 'error')
    return
  }
  const baseUrl = newUrl.value.trim().replace(/\/$/, '')
  validating.value = true
  try {
    await getHealth(baseUrl)
    connectionsStore.addConnection({ id: crypto.randomUUID(), name: newName.value, baseUrl })
    toastStore.show('Connection added', 'success')
    adding.value = false
    newName.value = ''
    newUrl.value = ''
  } catch {
    toastStore.show('Could not reach server. Check the URL.', 'error')
  } finally {
    validating.value = false
  }
}

async function deleteConnection(id: string): Promise<void> {
  const ok = await confirm('Are you sure you want to remove this connection?', { variant: 'danger' })
  if (!ok) return
  if (authStore.connId === id) authStore.clearSession()
  connectionsStore.removeConnection(id)
  toastStore.show('Connection removed', 'success')
}

function switchConnection(id: string): void {
  authStore.clearSession()
  connectionsStore.setActive(id)
  toastStore.show('Switched connection. Please log in.', 'info')
}
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <h1 class="h3 fw-bold mb-0"><i class="bi bi-plug me-2 text-primary" />Connections</h1>
        <button class="btn btn-primary btn-sm" @click="adding = !adding">
          <i class="bi bi-plus-lg me-1" />Add Connection
        </button>
      </div>

      <div v-if="adding" class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title">New Connection</h5>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Name</label>
              <input v-model="newName" type="text" class="form-control" placeholder="Production" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Base URL</label>
              <input v-model="newUrl" type="url" class="form-control" placeholder="https://..." />
            </div>
            <div class="col-md-2 d-flex align-items-end gap-2">
              <button class="btn btn-primary" :disabled="validating" @click="addConnection">
                <span v-if="validating" class="spinner-border spinner-border-sm me-1" />
                Save
              </button>
              <button class="btn btn-secondary" @click="adding = false">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <EmptyState
            v-if="connectionsStore.connections.length === 0"
            icon="bi-plug"
            title="No connections"
            message="Add a Moon backend connection to get started."
          />
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="conn in connectionsStore.connections" :key="conn.id">
                  <td class="fw-semibold">{{ conn.name }}</td>
                  <td class="text-muted small">{{ conn.baseUrl }}</td>
                  <td>
                    <span
                      v-if="conn.id === connectionsStore.activeConnectionId"
                      class="badge bg-success"
                      >Active</span
                    >
                    <span v-else class="badge bg-secondary">Inactive</span>
                  </td>
                  <td class="small text-muted">
                    {{ new Date(conn.createdAt).toLocaleDateString() }}
                  </td>
                  <td class="text-end">
                    <button
                      v-if="conn.id !== connectionsStore.activeConnectionId"
                      class="btn btn-sm btn-outline-primary me-1"
                      @click="switchConnection(conn.id)"
                    >
                      Switch
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteConnection(conn.id)"
                    >
                      <i class="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
