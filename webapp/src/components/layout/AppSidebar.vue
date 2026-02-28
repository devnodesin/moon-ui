<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

defineProps<{ collapsed: boolean }>()

const authStore = useAuthStore()
const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'bi-speedometer2', to: '/dashboard' },
  { label: 'Connections', icon: 'bi-plug', to: '/connections' },
  { label: 'Collections', icon: 'bi-table', to: '/collections' },
  { label: 'Users', icon: 'bi-people', to: '/users', adminOnly: true },
  { label: 'API Keys', icon: 'bi-key', to: '/apikeys', adminOnly: true },
]

const visibleItems = navItems.filter(
  (item) => !item.adminOnly || authStore.user?.role === 'admin'
)

function isActive(to: string): boolean {
  return route.path.startsWith(to)
}
</script>

<template>
  <div
    class="bg-dark text-white d-flex flex-column"
    :class="[collapsed ? 'd-none' : 'd-flex', 'vh-100']"
    style="width: 220px; min-width: 220px"
  >
    <nav class="nav flex-column pt-3 flex-grow-1">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded mx-2 mb-1"
        :class="{ 'bg-primary': isActive(item.to) }"
      >
        <i class="bi" :class="item.icon" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="p-3 small text-muted border-top border-secondary">
      <i class="bi bi-moon-stars-fill me-1" />
      Moon Admin v1.0
    </div>
  </div>
</template>
