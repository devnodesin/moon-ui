<script setup lang="ts">
import { ref } from 'vue'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  apiKey: string
  keyName: string
  title: string
  warning?: string
}>()

const emit = defineEmits<{ close: [] }>()

const toastStore = useToastStore()
const keyCopied = ref(false)

async function copyKey(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.apiKey)
    keyCopied.value = true
    setTimeout(() => {
      keyCopied.value = false
    }, 2000)
  } catch {
    toastStore.show('Copy failed — please select and copy manually.', 'warning')
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom-0">
            <h5 class="modal-title">
              <i class="bi bi-key me-2 text-warning" />{{ title }} — {{ keyName }}
            </h5>
          </div>
          <div class="modal-body">
            <div class="alert alert-success d-flex align-items-start gap-2 mb-3">
              <i class="bi bi-shield-check-fill flex-shrink-0 mt-1" />
              <div>
                <strong>Store this key securely.</strong>
                {{ warning ?? 'It will not be shown again.' }}
              </div>
            </div>
            <label class="form-label fw-semibold small text-muted">API Key</label>
            <div class="input-group">
              <textarea
                class="form-control font-monospace small"
                :value="apiKey"
                readonly
                rows="3"
                @focus="($event.target as HTMLTextAreaElement).select()"
              />
              <button class="btn btn-outline-secondary" @click="copyKey">
                <i class="bi" :class="keyCopied ? 'bi-check-lg text-success' : 'bi-clipboard'" />
                {{ keyCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
          <div class="modal-footer border-top-0">
            <button class="btn btn-primary" @click="emit('close')">I've saved the key</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
