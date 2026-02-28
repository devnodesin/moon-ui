<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <h1 class="h3 fw-bold mb-4"><i class="bi bi-key me-2 text-primary" />API Keys</h1>
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <EmptyState icon="bi-key" title="API Keys management" message="Coming soon." />
        </div>
      </div>
    </div>
  </AppLayout>
</template>
