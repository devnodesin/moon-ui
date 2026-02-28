<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  message?: string
}>()
</script>

<template>
  <div class="text-center py-5 text-muted">
    <i class="bi" :class="icon ?? 'bi-inbox'" style="font-size: 3rem" />
    <h5 class="mt-3">{{ title ?? 'No data' }}</h5>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>
