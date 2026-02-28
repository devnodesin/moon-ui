<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import type { Toast } from '@/types/ui'

const toastStore = useToastStore()

function bgClass(type: Toast['type']): string {
  const map: Record<Toast['type'], string> = {
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-info',
  }
  return map[type]
}

function iconClass(type: Toast['type']): string {
  const map: Record<Toast['type'], string> = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  }
  return map[type]
}
</script>

<template>
  <div
    class="toast-container position-fixed bottom-0 end-0 p-3"
    style="z-index: 1100"
    aria-live="polite"
  >
    <div
      v-for="toast in toastStore.toasts"
      :key="toast.id"
      class="toast show align-items-center border-0"
      :class="bgClass(toast.type)"
      role="alert"
    >
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi" :class="iconClass(toast.type)" />
          {{ toast.message }}
        </div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          @click="toastStore.dismiss(toast.id)"
        />
      </div>
    </div>
  </div>
</template>
