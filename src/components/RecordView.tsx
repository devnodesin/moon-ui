import { useState, useCallback, useEffect } from 'react';

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'select';
  editable?: boolean;
  options?: string[];
}

export interface RecordViewProps<T extends Record<string, unknown>> {
  data: T;
  fields: FieldDefinition[];
  onSave?: (data: T) => Promise<void>;
  onBack?: () => void;
  initialMode?: 'view' | 'edit';
}

export function RecordView<T extends Record<string, unknown>>({
  data,
  fields,
  onSave,
  onBack,
  initialMode = 'view',
}: RecordViewProps<T>) {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [draft, setDraft] = useState<T>(data);
  const [saving, setSaving] = useState(false);

  // Sync draft when data prop changes (e.g., after async fetch)
  useEffect(() => {
    setDraft(data);
  }, [data]);

  const handleEdit = useCallback(() => {
    setDraft(data);
    setMode('edit');
  }, [data]);

  const handleCancel = useCallback(() => {
    setDraft(data);
    setMode('view');
  }, [data]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(draft);
      setMode('view');
    } finally {
      setSaving(false);
    }
  }, [onSave, draft]);

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="w-full max-w-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {onBack && (
            <button className="btn btn-sm btn-ghost gap-1" onClick={onBack} data-testid="record-back">
              ← Back
            </button>
          )}
        </div>
        {mode === 'view' && onSave && (
          <button className="btn btn-sm btn-primary" onClick={handleEdit} data-testid="record-edit">
            Edit
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="form-control" data-testid={`field-${field.key}`}>
            <label className="label">
              <span className="label-text font-medium">{field.label}</span>
            </label>
            {mode === 'view' ? (
              <span className="px-1 py-2" data-testid={`value-${field.key}`}>
                {renderViewValue(data[field.key], field)}
              </span>
            ) : (
              renderEditField(field, draft[field.key], field.editable !== false, updateField)
            )}
          </div>
        ))}
      </div>

      {/* Edit mode buttons */}
      {mode === 'edit' && (
        <div className="flex gap-2 mt-6 justify-end">
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleCancel}
            disabled={saving}
            data-testid="record-cancel"
          >
            Cancel
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleSave}
            disabled={saving}
            data-testid="record-save"
          >
            {saving ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

function renderViewValue(value: unknown, field: FieldDefinition): string {
  if (value == null) return '—';
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function renderEditField(
  field: FieldDefinition,
  value: unknown,
  editable: boolean,
  onChange: (key: string, value: unknown) => void
) {
  const disabled = !editable;

  switch (field.type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(field.key, e.target.checked)}
          data-testid={`input-${field.key}`}
        />
      );
    case 'select':
      return (
        <select
          className="select select-bordered select-sm w-full"
          value={String(value ?? '')}
          disabled={disabled}
          onChange={(e) => onChange(field.key, e.target.value)}
          data-testid={`input-${field.key}`}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'number':
      return (
        <input
          type="number"
          className="input input-bordered input-sm w-full"
          value={value != null ? Number(value) : ''}
          disabled={disabled}
          onChange={(e) => onChange(field.key, e.target.value === '' ? null : Number(e.target.value))}
          data-testid={`input-${field.key}`}
        />
      );
    default:
      return (
        <input
          type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
          className="input input-bordered input-sm w-full"
          value={String(value ?? '')}
          disabled={disabled}
          onChange={(e) => onChange(field.key, e.target.value)}
          data-testid={`input-${field.key}`}
        />
      );
  }
}
