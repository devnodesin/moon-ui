<script setup lang="ts">
import { computed } from 'vue'
import type { CollectionField } from '@/types/api'

const props = defineProps<{
  field: CollectionField
  modelValue: unknown
  disabled?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const stringValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return ''
  return String(props.modelValue)
})

const boolValue = computed(() => Boolean(props.modelValue))

// datetime-local input requires 'YYYY-MM-DDTHH:mm' format
const datetimeLocalValue = computed(() => {
  if (!props.modelValue) return ''
  const s = String(props.modelValue)
  // Slice off seconds/timezone to match datetime-local format
  return s.length >= 16 ? s.slice(0, 16) : s
})

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onDatetimeInput(e: Event): void {
  const raw = (e.target as HTMLInputElement).value
  // Convert datetime-local value to RFC3339 (append :00Z)
  const rfc = raw ? `${raw}:00Z` : ''
  emit('update:modelValue', rfc)
}

function onCheck(e: Event): void {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}

function onTextarea(e: Event): void {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

const isReadOnly = computed(() => props.disabled || props.field.readonly === true)
</script>

<template>
  <div>
    <!-- Boolean -->
    <div v-if="field.type === 'boolean'" class="form-check form-switch">
      <input
        :id="`fi-${field.name}`"
        type="checkbox"
        class="form-check-input"
        :checked="boolValue"
        :disabled="isReadOnly"
        @change="onCheck"
      />
      <label class="form-check-label" :for="`fi-${field.name}`">
        {{ boolValue ? 'Yes' : 'No' }}
      </label>
    </div>

    <!-- JSON -->
    <textarea
      v-else-if="field.type === 'json'"
      class="form-control form-control-sm font-monospace"
      :class="{ 'is-invalid': error }"
      rows="4"
      :value="stringValue"
      :disabled="isReadOnly"
      @input="onTextarea"
    />

    <!-- Datetime -->
    <input
      v-else-if="field.type === 'datetime'"
      type="datetime-local"
      class="form-control form-control-sm"
      :class="{ 'is-invalid': error }"
      :value="datetimeLocalValue"
      :disabled="isReadOnly"
      @input="onDatetimeInput"
    />

    <!-- Integer -->
    <input
      v-else-if="field.type === 'integer'"
      type="number"
      step="1"
      class="form-control form-control-sm"
      :class="{ 'is-invalid': error }"
      :value="stringValue"
      :disabled="isReadOnly"
      @input="onInput"
    />

    <!-- Decimal (sent as string per API spec) -->
    <input
      v-else-if="field.type === 'decimal'"
      type="text"
      inputmode="decimal"
      class="form-control form-control-sm"
      :class="{ 'is-invalid': error }"
      :value="stringValue"
      :disabled="isReadOnly"
      @input="onInput"
    />

    <!-- String / ID fallback -->
    <input
      v-else
      type="text"
      class="form-control form-control-sm"
      :class="{ 'is-invalid': error }"
      :value="stringValue"
      :disabled="isReadOnly"
      @input="onInput"
    />

    <div v-if="error" class="invalid-feedback d-block">{{ error }}</div>
  </div>
</template>
