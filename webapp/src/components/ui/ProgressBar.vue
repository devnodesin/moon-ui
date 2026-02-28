<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const active = ref(false)
const value = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null
let requestCount = 0

function start(): void {
  requestCount++
  if (!active.value) {
    active.value = true
    value.value = 10
    tick()
  }
}

function finish(): void {
  requestCount = Math.max(0, requestCount - 1)
  if (requestCount === 0) {
    if (timer) clearTimeout(timer)
    value.value = 100
    setTimeout(() => {
      active.value = false
      value.value = 0
    }, 300)
  }
}

function tick(): void {
  if (timer) clearTimeout(timer)
  if (value.value < 85) {
    value.value = Math.min(85, value.value + Math.random() * 8 + 2)
    timer = setTimeout(tick, 200 + Math.random() * 300)
  }
}

function onProgress(e: Event): void {
  const detail = (e as CustomEvent<{ active: boolean }>).detail
  if (detail.active) start()
  else finish()
}

onMounted(() => window.addEventListener('moon:progress', onProgress))
onUnmounted(() => window.removeEventListener('moon:progress', onProgress))
</script>

<template>
  <div
    v-if="active"
    class="progress position-fixed top-0 start-0 w-100"
    style="height: 3px; z-index: 9999; border-radius: 0"
  >
    <div
      class="progress-bar bg-primary"
      role="progressbar"
      :style="{ width: `${value}%`, transition: 'width 0.2s ease' }"
    />
  </div>
</template>
