<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { message, options, isVisible, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="modal show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ options.title ?? 'Confirm' }}</h5>
            <button type="button" class="btn-close" @click="cancel" />
          </div>
          <div class="modal-body">
            <p>{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancel">
              {{ options.cancelLabel ?? 'Cancel' }}
            </button>
            <button
              type="button"
              class="btn"
              :class="`btn-${options.variant ?? 'danger'}`"
              @click="accept"
            >
              {{ options.confirmLabel ?? 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
