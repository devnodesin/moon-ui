<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="d-flex flex-column vh-100">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <div class="d-flex flex-grow-1 overflow-hidden">
      <AppSidebar :collapsed="sidebarCollapsed" />
      <main class="flex-grow-1 overflow-auto bg-light">
        <slot />
      </main>
    </div>
  </div>
</template>
