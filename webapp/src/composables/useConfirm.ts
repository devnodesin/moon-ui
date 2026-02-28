import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
}

const message = ref('')
const options = ref<ConfirmOptions>({})
const isVisible = ref(false)
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(msg: string, opts: ConfirmOptions = {}): Promise<boolean> {
    message.value = msg
    options.value = opts
    isVisible.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function accept(): void {
    isVisible.value = false
    resolvePromise?.(true)
  }

  function cancel(): void {
    isVisible.value = false
    resolvePromise?.(false)
  }

  return { message, options, isVisible, confirm, accept, cancel }
}
