<script setup lang="ts">
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
</script>

<template>
  <ProgressBar />
  <RouterView />
  <ToastContainer />
  <ConfirmModal />
</template>
