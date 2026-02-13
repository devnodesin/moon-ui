import { useState, useEffect } from 'react';
import type { CollectionColumn } from '../services/collectionService';

interface FieldDraft extends CollectionColumn {
  _action?: 'add' | 'modify' | 'rename' | 'keep';
  _oldName?: string;
}

interface SchemaEditorModalProps {
  isOpen: boolean;
  collectionName: string;
  initialFields?: CollectionColumn[];
  onClose: () => void;
  onSave: (changes: SchemaChanges) => Promise<void>;
  mode: 'create' | 'edit';
}

export interface SchemaChanges {
  add_columns?: CollectionColumn[];
  rename_columns?: { old_name: string; new_name: string }[];
  modify_columns?: CollectionColumn[];
  remove_columns?: string[];
}

const FIELD_TYPES = ['string', 'integer', 'boolean', 'datetime', 'decimal', 'json'];

export function SchemaEditorModal({
  isOpen,
  collectionName,
  initialFields = [],
  onClose,
  onSave,
  mode,
}: SchemaEditorModalProps) {
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [removedFields, setRemovedFields] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialFields.length > 0) {
        setFields(initialFields.map(f => ({ ...f, _action: 'keep' as const })));
      } else if (mode === 'create') {
        setFields([{ name: '', type: 'string', nullable: false, unique: false, _action: 'add' as const }]);
      }
      setRemovedFields([]);
      setError('');
    }
  }, [isOpen, initialFields, mode]);

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', nullable: false, unique: false, _action: 'add' as const }]);
  };

  const removeField = (index: number) => {
    const field = fields[index];
    if (mode === 'edit' && field._action === 'keep') {
      // Mark existing field for removal
      setRemovedFields([...removedFields, field.name]);
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FieldDraft>) => {
    const updated = [...fields];
    const currentField = updated[index];
    
    // Apply updates first
    const updatedField = { ...currentField, ...updates };
    
    // Determine action based on changes
    if (mode === 'edit') {
      if (currentField._action === 'keep' || currentField._action === 'modify' || currentField._action === 'rename') {
        // Check what changed compared to initial state
        const initialField = initialFields.find(f => f.name === (currentField._oldName || currentField.name));
        if (initialField) {
          const nameChanged = updatedField.name !== initialField.name;
          const typeChanged = updatedField.type !== initialField.type;
          const nullableChanged = updatedField.nullable !== initialField.nullable;
          const uniqueChanged = updatedField.unique !== initialField.unique;
          
          if (nameChanged) {
            // Name changed - this is a rename
            updatedField._action = 'rename';
            updatedField._oldName = initialField.name;
          } else if (typeChanged || nullableChanged || uniqueChanged) {
            // Type, nullable, or unique changed - this is a modify
            updatedField._action = 'modify';
            // Clear old name if we're no longer renaming
            delete updatedField._oldName;
          } else {
            // No changes - back to keep
            updatedField._action = 'keep';
            delete updatedField._oldName;
          }
        }
      }
    }
    
    updated[index] = updatedField;
    setFields(updated);
  };

  const handleSave = async () => {
    setError('');
    
    // Validate
    const validFields = fields.filter(f => f.name.trim() !== '');
    if (validFields.length === 0) {
      setError('At least one field is required');
      return;
    }
    
    // Check for duplicate names
    const names = validFields.map(f => f.name.trim());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      setError('Field names must be unique');
      return;
    }
    
    const changes: SchemaChanges = {};
    
    if (mode === 'create') {
      // For create mode, all fields are new
      changes.add_columns = validFields.map(f => ({
        name: f.name.trim(),
        type: f.type,
        nullable: f.nullable,
        unique: f.unique || false,
      }));
    } else {
      // For edit mode, determine changes
      changes.add_columns = validFields
        .filter(f => f._action === 'add')
        .map(f => ({
          name: f.name.trim(),
          type: f.type,
          nullable: f.nullable,
          unique: f.unique || false,
        }));
      
      changes.rename_columns = validFields
        .filter(f => f._action === 'rename' && f._oldName)
        .map(f => ({
          old_name: f._oldName!,
          new_name: f.name.trim(),
        }));
      
      changes.modify_columns = validFields
        .filter(f => f._action === 'modify')
        .map(f => ({
          name: f.name.trim(),
          type: f.type,
          nullable: f.nullable,
          unique: f.unique || false,
        }));
      
      if (removedFields.length > 0) {
        changes.remove_columns = removedFields;
      }
      
      // Only include non-empty change arrays
      if (changes.add_columns?.length === 0) delete changes.add_columns;
      if (changes.rename_columns?.length === 0) delete changes.rename_columns;
      if (changes.modify_columns?.length === 0) delete changes.modify_columns;
    }
    
    try {
      setSaving(true);
      await onSave(changes);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schema');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg mb-4">
          {mode === 'create' ? 'Define Fields' : `Edit Schema: ${collectionName}`}
        </h3>
        
        {error && (
          <div className="alert alert-error mb-4" data-testid="schema-editor-error">
            <span>{error}</span>
          </div>
        )}
        
        <div className="overflow-x-auto mb-4">
          <table className="table table-sm" data-testid="schema-editor-table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Type</th>
                <th>Nullable</th>
                <th>Unique</th>
                {mode === 'edit' && <th>Status</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={index} data-testid={`schema-field-row-${index}`}>
                  <td>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      placeholder="Field name"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      data-testid={`schema-field-name-${index}`}
                    />
                  </td>
                  <td>
                    <select
                      className="select select-bordered select-sm w-full"
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value })}
                      data-testid={`schema-field-type-${index}`}
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={field.nullable}
                      onChange={(e) => updateField(index, { nullable: e.target.checked })}
                      data-testid={`schema-field-nullable-${index}`}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={field.unique || false}
                      onChange={(e) => updateField(index, { unique: e.target.checked })}
                      data-testid={`schema-field-unique-${index}`}
                    />
                  </td>
                  {mode === 'edit' && (
                    <td>
                      <span className={`badge badge-sm ${
                        field._action === 'add' ? 'badge-success' :
                        field._action === 'rename' ? 'badge-warning' :
                        field._action === 'modify' ? 'badge-info' :
                        'badge-ghost'
                      }`}>
                        {field._action === 'add' ? 'New' :
                         field._action === 'rename' ? 'Renamed' :
                         field._action === 'modify' ? 'Modified' :
                         '—'}
                      </span>
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      className="btn btn-xs btn-error btn-outline"
                      onClick={() => removeField(index)}
                      disabled={mode === 'create' && fields.length === 1}
                      data-testid={`schema-remove-field-${index}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button
            type="button"
            className="btn btn-xs btn-ghost mt-2"
            onClick={addField}
            data-testid="schema-add-field-btn"
          >
            + Add Field
          </button>
          
          {removedFields.length > 0 && (
            <div className="alert alert-warning mt-4">
              <span>Fields to be removed: {removedFields.join(', ')}</span>
            </div>
          )}
        </div>
        
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            data-testid="schema-save-btn"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create Collection' : 'Save Changes'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
