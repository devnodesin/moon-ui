import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types/api'
import { storeTokens, clearTokens } from '@/services/http'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const expiresAt = ref<string | null>(null)
  const rememberMe = ref(false)
  const connId = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  function setSession(
    id: string,
    tokens: { access_token: string; refresh_token: string; expires_at: string; user: AuthUser },
    remember: boolean
  ): void {
    connId.value = id
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    expiresAt.value = tokens.expires_at
    user.value = tokens.user
    rememberMe.value = remember
    storeTokens(id, tokens.access_token, tokens.refresh_token, tokens.expires_at, remember)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(`moon_${id}_user`, JSON.stringify(tokens.user))
  }

  function loadFromStorage(id: string): boolean {
    connId.value = id
    const rememberVal = localStorage.getItem(`moon_${id}_remember_me`) === 'true'
    rememberMe.value = rememberVal
    const storage = rememberVal ? localStorage : sessionStorage
    const token = storage.getItem(`moon_${id}_access_token`)
    const refresh = storage.getItem(`moon_${id}_refresh_token`)
    const userStr = storage.getItem(`moon_${id}_user`)
    const expires = localStorage.getItem(`moon_${id}_expires_at`)

    if (token && userStr) {
      accessToken.value = token
      refreshToken.value = refresh
      expiresAt.value = expires
      user.value = JSON.parse(userStr) as AuthUser
      return true
    }
    return false
  }

  function clearSession(): void {
    if (connId.value) clearTokens(connId.value)
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    expiresAt.value = null
    connId.value = null
  }

  return {
    user,
    accessToken,
    refreshToken,
    expiresAt,
    rememberMe,
    connId,
    isAuthenticated,
    setSession,
    loadFromStorage,
    clearSession,
  }
})
