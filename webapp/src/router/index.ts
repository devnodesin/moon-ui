import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useConnectionsStore } from '@/stores/connections'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/connections',
      name: 'connections',
      component: () => import('@/views/ConnectionsView.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/users/UsersView.vue'),
      meta: { adminOnly: true },
    },
    {
      path: '/apikeys',
      name: 'apikeys',
      component: () => import('@/views/apikeys/ApiKeysView.vue'),
      meta: { adminOnly: true },
    },
    {
      path: '/collections',
      name: 'collections',
      component: () => import('@/views/collections/CollectionsView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const progressStore = useProgressStore()
  progressStore.start()

  const authStore = useAuthStore()
  const connectionsStore = useConnectionsStore()

  connectionsStore.loadFromStorage()

  const activeConn = connectionsStore.activeConnection
  if (activeConn && !authStore.isAuthenticated) {
    authStore.loadFromStorage(activeConn.id)
  }

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.adminOnly && authStore.user?.role !== 'admin') {
    return { name: 'dashboard' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

router.afterEach(() => {
  const progressStore = useProgressStore()
  progressStore.finish()
})

export default router
