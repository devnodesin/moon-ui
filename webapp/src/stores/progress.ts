import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  const active = ref(false)
  const value = ref(0)
  let timer: ReturnType<typeof setTimeout> | null = null

  function start(): void {
    active.value = true
    value.value = 10
    tick()
  }

  function tick(): void {
    if (timer) clearTimeout(timer)
    if (value.value < 85) {
      const increment = Math.random() * 8 + 2
      value.value = Math.min(85, value.value + increment)
      timer = setTimeout(tick, 200 + Math.random() * 300)
    }
  }

  function finish(): void {
    if (timer) clearTimeout(timer)
    value.value = 100
    setTimeout(() => {
      active.value = false
      value.value = 0
    }, 300)
  }

  return { active, value, start, finish }
})
