<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import FieldInput from '@/components/forms/FieldInput.vue'
import FormErrors from '@/components/forms/FormErrors.vue'
import { useConnectionsStore } from '@/stores/connections'
import { useToastStore } from '@/stores/toast'
import { useConfirm } from '@/composables/useConfirm'
import { createRecordsService } from '@/services/records'
import type { CollectionField, CollectionSchema } from '@/types/api'
import type { MoonRecord } from '@/services/records'

const props = defineProps<{ collection: string; id: string }>()
const router = useRouter()
const connectionsStore = useConnectionsStore()
const toastStore = useToastStore()
const { confirm } = useConfirm()

const activeConn = computed(() => connectionsStore.activeConnection)
const service = computed(() =>
  activeConn.value
    ? createRecordsService(activeConn.value.baseUrl, activeConn.value.id)
    : null,
)

// State model (from Comp.md §12)
const schema = ref<CollectionSchema | null>(null)
const originalData = ref<MoonRecord | null>(null)
const draftData = ref<Record<string, unknown>>({})
const dirtyFields = ref<Set<string>>(new Set())
const validationErrors = ref<Record<string, string>>({})
const mode = ref<'view' | 'edit'>('view')
const loadingState = ref<'idle' | 'load' | 'refresh' | 'save'>('idle')
const schemaError = ref<string | null>(null)
const loadError = ref<string | null>(null)

const isLoading = computed(() => loadingState.value !== 'idle')
const isSaving = computed(() => loadingState.value === 'save')
const isDirty = computed(() => dirtyFields.value.size > 0)

// Editable fields (non-readonly, non-id)
const editableFields = computed<CollectionField[]>(() =>
  (schema.value?.fields ?? []).filter((f) => f.type !== 'id' && !f.readonly),
)

// All visible fields
const visibleFields = computed<CollectionField[]>(() => schema.value?.fields ?? [])

// Unsaved changes protection (Comp.md §10)
onBeforeRouteLeave(async () => {
  if (mode.value === 'edit' && isDirty.value) {
    const ok = await confirm('You have unsaved changes. Continue without saving?', {
      confirmLabel: 'Leave',
      variant: 'warning',
    })
    if (!ok) return false
  }
})

async function loadSchema(): Promise<void> {
  if (!service.value) return
  try {
    const res = await service.value.getSchema(props.collection)
    // New API: data is an array, take first element
    schema.value = res.data[0]
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load schema'
    schemaError.value = msg
    toastStore.show(msg, 'error')
    console.error('[RecordView] schema error:', err)
  }
}

async function loadRecord(state: 'load' | 'refresh' = 'load'): Promise<void> {
  if (!service.value) return
  loadingState.value = state
  loadError.value = null
  try {
    const res = await service.value.getRecord(props.collection, props.id)
    // New API: data is an array, take first element
    originalData.value = res.data[0]
    // Reset draft to server values
    draftData.value = { ...res.data[0] }
    dirtyFields.value = new Set()
    validationErrors.value = {}
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Failed to load record'
    loadError.value = msg
    toastStore.show(msg, 'error')
    console.error('[RecordView] load error:', err)
  } finally {
    loadingState.value = 'idle'
  }
}

function formatValue(value: unknown, type: CollectionField['type']): string {
  if (value === null || value === undefined || value === '') return '—'
  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'datetime':
      try {
        return new Date(value as string).toLocaleString()
      } catch {
        return String(value)
      }
    case 'json':
      return JSON.stringify(value, null, 2)
    default:
      return String(value)
  }
}

function onFieldChange(fieldName: string, value: unknown): void {
  draftData.value = { ...draftData.value, [fieldName]: value }
  dirtyFields.value = new Set([...dirtyFields.value, fieldName])
  // Clear field validation error on change
  if (validationErrors.value[fieldName]) {
    const { [fieldName]: _, ...rest } = validationErrors.value
    validationErrors.value = rest
  }
}

// Validation rules per Moon data types (Comp.md §6, SPEC.md §Form Validation)
function validateDraft(): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!schema.value) return errors

  for (const field of editableFields.value) {
    const value = draftData.value[field.name]
    const isEmpty = value === null || value === undefined || value === ''

    if (!field.nullable && isEmpty) {
      errors[field.name] = 'This field is required'
      continue
    }
    if (isEmpty) continue

    switch (field.type) {
      case 'integer': {
        const n = Number(value)
        if (!Number.isInteger(n)) errors[field.name] = 'Must be a whole number'
        break
      }
      case 'decimal': {
        if (!/^-?\d+(\.\d{1,10})?$/.test(String(value))) {
          errors[field.name] = 'Must be a valid decimal number (e.g. 9.99)'
        }
        break
      }
      case 'datetime': {
        if (!value || isNaN(Date.parse(String(value)))) {
          errors[field.name] = 'Must be a valid date/time'
        }
        break
      }
      case 'json': {
        try {
          JSON.parse(String(value))
        } catch {
          errors[field.name] = 'Must be valid JSON'
        }
        break
      }
    }
  }

  return errors
}

// Sanitization per Moon types (Comp.md §7)
function sanitizeDraft(dirty: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!schema.value) return out

  for (const field of editableFields.value) {
    if (!dirtyFields.value.has(field.name)) continue
    let value = dirty[field.name]

    if (value === null || value === undefined || value === '') {
      out[field.name] = null
      continue
    }

    switch (field.type) {
      case 'string':
        out[field.name] = String(value).trim()
        break
      case 'integer':
        out[field.name] = parseInt(String(value), 10)
        break
      case 'decimal':
        // API expects decimal as string
        out[field.name] = String(value).trim()
        break
      case 'boolean':
        out[field.name] = Boolean(value)
        break
      case 'datetime':
        // Ensure RFC3339; onDatetimeInput already appends :00Z
        out[field.name] = String(value)
        break
      case 'json':
        try {
          out[field.name] = JSON.parse(String(value))
        } catch {
          out[field.name] = String(value)
        }
        break
      default:
        out[field.name] = value
    }
  }

  return out
}

async function enterEdit(): Promise<void> {
  // Ensure draft is in sync with latest server data
  if (originalData.value) {
    draftData.value = { ...originalData.value }
    dirtyFields.value = new Set()
    validationErrors.value = {}
  }
  mode.value = 'edit'
}

async function cancelEdit(): Promise<void> {
  if (isDirty.value) {
    const ok = await confirm('Discard unsaved changes?', { variant: 'warning', confirmLabel: 'Discard' })
    if (!ok) return
  }
  mode.value = 'view'
  draftData.value = { ...originalData.value }
  dirtyFields.value = new Set()
  validationErrors.value = {}
}

async function save(): Promise<void> {
  // Step 1: Validate
  const errors = validateDraft()
  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    toastStore.show('Please fix validation errors before saving.', 'error')
    return
  }

  // Step 2: Sanitize dirty fields only
  const sanitized = sanitizeDraft(draftData.value)

  // Nothing to save
  if (Object.keys(sanitized).length === 0) {
    mode.value = 'view'
    return
  }

  // Step 3: Submit only dirty fields + id
  loadingState.value = 'save'
  try {
    const patch: MoonRecord = { id: props.id, ...sanitized }
    const res = await service.value!.updateRecord(props.collection, patch)
    toastStore.show(res.message, 'success')
    mode.value = 'view'
    dirtyFields.value = new Set()
    // Step 4: Reload fresh data from server (Comp.md §11)
    await loadRecord('refresh')
  } catch (err) {
    const msg = (err as { message?: string }).message ?? 'Save failed'
    toastStore.show(msg, 'error')
    console.error('[RecordView] save error:', err)
  } finally {
    loadingState.value = 'idle'
  }
}

function goBack(): void {
  router.push({ name: 'records', params: { collection: props.collection } })
}

onMounted(async () => {
  await loadSchema()
  await loadRecord('load')
})
</script>

<template>
  <AppLayout>
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left" /> {{ collection }}
          </button>
          <div class="h-100 d-flex align-items-center">
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item active" aria-current="page">{{ id }}</li>
              </ol>
            </nav>
          </div>
        </div>

        <!-- Mode actions -->
        <div class="d-flex gap-2">
          <template v-if="mode === 'view'">
            <button
              class="btn  btn-sm btn-primary"
              :disabled="isLoading || !!schemaError || !!loadError"
              @click="enterEdit"
            >
              <i class="bi bi-pencil me-1" /> Edit
            </button>
          </template>
          <template v-else>
            <button class="btn btn-success" :disabled="isSaving" @click="save">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" />
              <i v-else class="bi bi-check2 me-1" />
              Save
            </button>
            <button class="btn btn-outline-secondary" :disabled="isSaving" @click="cancelEdit">
              Cancel
            </button>
          </template>
        </div>
      </div>

      <!-- Schema error -->
      <div v-if="schemaError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />{{ schemaError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadSchema">Retry</button>
      </div>

      <!-- Load error -->
      <div v-else-if="loadError && loadingState === 'idle'" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2" />{{ loadError }}
        <button class="btn btn-sm btn-outline-danger ms-2" @click="loadRecord('load')">Retry</button>
      </div>

      <div v-else class="card border-0 shadow-sm">
        <!-- Refresh overlay -->
        <div
          v-if="loadingState === 'refresh'"
          class="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center"
          style="z-index: 10"
        >
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Refreshing…</span>
          </div>
        </div>

        <div class="card-body">
          <!-- Form-level validation errors -->
          <FormErrors :errors="validationErrors" />

          <!-- Initial skeleton -->
          <template v-if="loadingState === 'load'">
            <div v-for="n in 6" :key="n" class="row mb-3 align-items-center placeholder-glow">
              <div class="col-4 col-md-3">
                <span class="placeholder col-8" />
              </div>
              <div class="col-8 col-md-9">
                <span class="placeholder col-10" />
              </div>
            </div>
          </template>

          <!-- Field rows -->
          <template v-else>
            <div
              v-for="field in visibleFields"
              :key="field.name"
              class="row mb-3 align-items-start"
            >
              <!-- Label -->
              <div class="col-4 col-md-3">
                <label
                  :for="`rv-${field.name}`"
                  class="form-label fw-semibold text-capitalize mb-0 pt-1"
                >
                  {{ field.name.replace(/_/g, ' ') }}
                  <span
                    v-if="!field.nullable && field.type !== 'id'"
                    class="text-danger ms-1"
                    title="Required"
                  >*</span>
                </label>
                <div class="text-muted" style="font-size: 0.7rem">{{ field.type }}</div>
              </div>

              <!-- Value / Input -->
              <div class="col-8 col-md-9">
                <!-- View mode -->
                <template v-if="mode === 'view' || field.type === 'id' || field.readonly">
                  <pre
                    v-if="field.type === 'json'"
                    class="mb-0 small bg-light p-2 rounded"
                    style="white-space: pre-wrap; word-break: break-all"
                  >{{ formatValue(originalData?.[field.name], field.type) }}</pre>
                  <span
                    v-else-if="field.type === 'id'"
                    class="font-monospace small text-muted"
                  >{{ String(originalData?.[field.name] ?? '—') }}</span>
                  <span v-else>{{ formatValue(originalData?.[field.name], field.type) }}</span>
                  <span
                    v-if="field.readonly"
                    class="badge bg-secondary ms-2 small"
                  >read-only</span>
                </template>

                <!-- Edit mode -->
                <template v-else>
                  <FieldInput
                    :id="`rv-${field.name}`"
                    :field="field"
                    :model-value="draftData[field.name]"
                    :disabled="isSaving"
                    :error="validationErrors[field.name]"
                    @update:model-value="onFieldChange(field.name, $event)"
                  />
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- Card footer: dirty indicator -->
        <div v-if="mode === 'edit' && isDirty" class="card-footer bg-warning-subtle text-warning-emphasis small">
          <i class="bi bi-exclamation-circle me-1" />You have unsaved changes.
        </div>
      </div>
    </div>
  </AppLayout>
</template>
