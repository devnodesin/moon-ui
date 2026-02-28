<script setup lang="ts">
defineProps<{
  errors: Record<string, string>
}>()
</script>

<template>
  <div v-if="Object.keys(errors).length > 0" class="alert alert-danger py-2 mb-3">
    <ul class="mb-0 ps-3">
      <li v-for="(msg, field) in errors" :key="field">
        <strong class="text-capitalize">{{ String(field).replace(/_/g, ' ') }}</strong>: {{ msg }}
      </li>
    </ul>
  </div>
</template>
