<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
}>()

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') emit('search')
}

function clear(): void {
  emit('update:modelValue', '')
  emit('search')
}
</script>

<template>
  <div class="input-group">
    <input
      type="search"
      class="form-control"
      :placeholder="placeholder ?? 'Search…'"
      :value="modelValue"
      :disabled="loading"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onKeydown"
    />
    <button
      v-if="modelValue"
      class="btn btn-outline-secondary"
      type="button"
      title="Clear search"
      :disabled="loading"
      @click="clear"
    >
      <i class="bi bi-x" />
    </button>
    <button
      class="btn btn-primary"
      type="button"
      :disabled="loading"
      @click="emit('search')"
    >
      <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" />
      <i v-else class="bi bi-search me-1" />
      Search
    </button>
  </div>
</template>
