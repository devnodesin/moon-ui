import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConnectionsStore } from '@/stores/connections'
import ApiKeyFormView from '@/views/apikeys/ApiKeyFormView.vue'

const {
  routerPush,
  createApiKey,
  updateApiKey,
  getApiKey,
  listCollections,
  createApiKeysService,
  createCollectionsService,
} = vi.hoisted(() => ({
  routerPush: vi.fn(),
  createApiKey: vi.fn(),
  updateApiKey: vi.fn(),
  getApiKey: vi.fn(),
  listCollections: vi.fn(),
  createApiKeysService: vi.fn(),
  createCollectionsService: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('@/services/apikeys', () => ({
  createApiKeysService,
}))

vi.mock('@/services/collections', () => ({
  createCollectionsService,
}))

describe('ApiKeyFormView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    routerPush.mockReset()
    createApiKey.mockReset()
    updateApiKey.mockReset()
    getApiKey.mockReset()
    listCollections.mockReset()
    createApiKeysService.mockReset()
    createCollectionsService.mockReset()

    createApiKeysService.mockReturnValue({
      createApiKey,
      updateApiKey,
      getApiKey,
    })

    createCollectionsService.mockReturnValue({
      listCollections,
    })

    listCollections.mockResolvedValue({
      data: [
        { name: 'products', count: 2, system: false },
        { name: 'orders', count: 4, system: false },
        { name: 'users', count: 1, system: true },
      ],
      meta: { count: 3, current_page: 1, per_page: 15, total: 3, total_pages: 1 },
      links: { first: null, last: null, next: null, prev: null },
    })

    const connectionsStore = useConnectionsStore()
    const conn = connectionsStore.addConnection({
      id: 'conn-1',
      name: 'Test',
      baseUrl: 'https://moon.devnodes.in',
    })
    connectionsStore.setActive(conn.id)
  })

  function mountView(id?: string) {
    return mount(ApiKeyFormView, {
      props: id ? { id } : {},
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          ApiKeyModal: true,
        },
      },
    })
  }

  it('loads collections and submits the new create payload fields', async () => {
    createApiKey.mockResolvedValue({
      message: 'Resource created successfully',
      data: [{ key: 'moon_live_123' }],
      meta: { success: 1, failed: 0 },
    })

    const wrapper = mountView()
    await flushPromises()

    expect(listCollections).toHaveBeenCalled()
    expect(wrapper.find('#collection-products').exists()).toBe(true)
    expect(wrapper.find('#collection-orders').exists()).toBe(true)

    await wrapper.find('input[name="api-key-name"]').setValue('Website Key')
    await wrapper.find('#can-write').setValue(true)
    await wrapper.find('#collection-products').setValue(true)
    await wrapper.find('#is-website').setValue(true)
    await wrapper.find('#rate-limit').setValue('25')
    await wrapper.find('#captcha-required').setValue(true)
    await wrapper.find('[data-testid="origin-input-0"]').setValue('https://moon.devnodes.in')
    await wrapper.find('[data-testid="add-origin"]').trigger('click')
    await wrapper.find('[data-testid="origin-input-1"]').setValue('https://app.moon.devnodes.in')
    await wrapper.find('[data-testid="remove-origin-0"]').trigger('click')
    await wrapper.find('#save-api-key').trigger('click')

    expect(createApiKey).toHaveBeenCalledWith({
      name: 'Website Key',
      role: 'user',
      can_write: true,
      collections: ['products'],
      is_website: true,
      allowed_origins: ['https://app.moon.devnodes.in'],
      rate_limit: 25,
      captcha_required: true,
      enabled: true,
    })
  })

  it('loads edit values and clears origins when website access is disabled', async () => {
    getApiKey.mockResolvedValue({
      data: [
        {
          id: '01KJ100',
          name: 'Existing Key',
          role: 'user',
          can_write: false,
          collections: ['orders'],
          is_website: true,
          allowed_origins: ['https://moon.devnodes.in', 'https://app.moon.devnodes.in'],
          rate_limit: 10,
          captcha_required: true,
          enabled: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    })
    updateApiKey.mockResolvedValue({
      message: 'Resource updated successfully',
      data: [],
      meta: { success: 1, failed: 0 },
    })

    const wrapper = mountView('01KJ100')
    await flushPromises()

    expect((wrapper.find('input[name="api-key-name"]').element as HTMLInputElement).value).toBe(
      'Existing Key'
    )
    expect((wrapper.find('#collection-orders').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.find('#captcha-required').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('[data-testid="origin-input-1"]').exists()).toBe(true)

    await wrapper.find('#is-website').setValue(false)
    await wrapper.find('#save-api-key').trigger('click')

    expect(updateApiKey).toHaveBeenCalledWith('01KJ100', {
      name: 'Existing Key',
      can_write: false,
      collections: ['orders'],
      is_website: false,
      allowed_origins: null,
      rate_limit: 10,
      captcha_required: true,
      enabled: true,
    })
    expect(routerPush).toHaveBeenCalledWith({ name: 'apikeys' })
  })
})
