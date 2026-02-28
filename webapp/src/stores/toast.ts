import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast, ToastType } from '@/types/ui'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function show(message: string, type: ToastType = 'info', autoDismiss = true): string {
    const id = crypto.randomUUID()
    const toast: Toast = { id, type, message, autoDismiss }
    toasts.value = [...toasts.value.slice(-4), toast]

    if (autoDismiss) {
      const delay = type === 'success' || type === 'info' ? 5000 : 8000
      setTimeout(() => dismiss(id), delay)
    }

    return id
  }

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function clear(): void {
    toasts.value = []
  }

  return { toasts, show, dismiss, clear }
})
