import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Connection } from '@/types/connection'

const STORAGE_KEY = 'moon_connections'
const ACTIVE_KEY = 'moon_active_connection'

export const useConnectionsStore = defineStore('connections', () => {
  const connections = ref<Connection[]>([])
  const activeConnectionId = ref<string | null>(null)

  const activeConnection = computed<Connection | null>(
    () => connections.value.find((c) => c.id === activeConnectionId.value) ?? null
  )

  function loadFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY)
    connections.value = raw ? (JSON.parse(raw) as Connection[]) : []
    activeConnectionId.value = localStorage.getItem(ACTIVE_KEY)
  }

  function persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections.value))
    if (activeConnectionId.value) {
      localStorage.setItem(ACTIVE_KEY, activeConnectionId.value)
    } else {
      localStorage.removeItem(ACTIVE_KEY)
    }
  }

  function addConnection(conn: Omit<Connection, 'isActive' | 'createdAt'>): Connection {
    const newConn: Connection = {
      ...conn,
      isActive: false,
      createdAt: new Date().toISOString(),
    }
    connections.value = [...connections.value, newConn]
    persist()
    return newConn
  }

  function removeConnection(id: string): void {
    connections.value = connections.value.filter((c) => c.id !== id)
    if (activeConnectionId.value === id) {
      activeConnectionId.value = connections.value[0]?.id ?? null
    }
    persist()
  }

  function setActive(id: string): void {
    connections.value = connections.value.map((c) => ({ ...c, isActive: c.id === id }))
    activeConnectionId.value = id
    persist()
  }

  return {
    connections,
    activeConnectionId,
    activeConnection,
    loadFromStorage,
    addConnection,
    removeConnection,
    setActive,
  }
})
