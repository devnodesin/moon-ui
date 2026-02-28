import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConnectionsStore } from '@/stores/connections'

describe('useConnectionsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with empty connections', () => {
    const store = useConnectionsStore()
    expect(store.connections).toHaveLength(0)
  })

  it('adds a connection', () => {
    const store = useConnectionsStore()
    const conn = store.addConnection({ id: 'test-id', name: 'Test', baseUrl: 'https://test.com' })
    expect(store.connections).toHaveLength(1)
    expect(conn.name).toBe('Test')
  })

  it('persists to localStorage', () => {
    const store = useConnectionsStore()
    store.addConnection({ id: 'test-id', name: 'Test', baseUrl: 'https://test.com' })
    const raw = localStorage.getItem('moon_connections')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toHaveLength(1)
  })

  it('sets active connection', () => {
    const store = useConnectionsStore()
    const conn = store.addConnection({ id: 'test-id', name: 'Test', baseUrl: 'https://test.com' })
    store.setActive(conn.id)
    expect(store.activeConnectionId).toBe(conn.id)
    expect(store.activeConnection?.name).toBe('Test')
  })

  it('removes a connection', () => {
    const store = useConnectionsStore()
    const conn = store.addConnection({ id: 'test-id', name: 'Test', baseUrl: 'https://test.com' })
    store.removeConnection(conn.id)
    expect(store.connections).toHaveLength(0)
  })

  it('loads from localStorage', () => {
    const data = [
      {
        id: 'x',
        name: 'X',
        baseUrl: 'https://x.com',
        isActive: false,
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem('moon_connections', JSON.stringify(data))
    const store = useConnectionsStore()
    store.loadFromStorage()
    expect(store.connections).toHaveLength(1)
  })
})
