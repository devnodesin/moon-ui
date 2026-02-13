import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { SchemaEditorModal } from '../components/SchemaEditorModal';
import type { SchemaChanges } from '../components/SchemaEditorModal';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as collectionService from '../services/collectionService';
import type { CollectionInfo, CollectionColumn } from '../services/collectionService';
import { validateName } from '../utils/validation';
import { extractUserMessage } from '../utils/errorUtils';

interface CollectionRow {
  name: string;
  records: number;
}

interface FieldDraft {
  name: string;
  type: string;
  nullable: boolean;
  unique: boolean;
}

const createEmptyField = (): FieldDraft => ({ 
  name: '', 
  type: 'string', 
  nullable: false, 
  unique: false 
});

interface EditingSchema {
  collectionName: string;
  fields: CollectionColumn[];
}

export function CollectionListPage() {
  const { currentConnection } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFields, setNewFields] = useState<FieldDraft[]>([createEmptyField()]);
  const [editingSchema, setEditingSchema] = useState<EditingSchema | null>(null);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchCollections = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const list: CollectionInfo[] = await collectionService.listCollections(baseUrl, token);
      
      // Map to CollectionRow format (API now provides records count directly)
      const rows: CollectionRow[] = list.map((c) => ({
        name: c.name,
        records: c.records,
      }));
      
      setCollections(rows);
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to load collections'));
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Delete collection "${name}"?`)) return;
    try {
      await collectionService.deleteCollection(baseUrl, token, name);
      notify.success(`Collection "${name}" deleted`);
      fetchCollections();
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to delete "${name}"`));
    }
  };

  const handleEditSchema = async (name: string) => {
    try {
      startLoading();
      const schema = await collectionService.getSchema(baseUrl, token, name);
      setEditingSchema({ collectionName: name, fields: schema });
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to load schema for "${name}"`));
    } finally {
      stopLoading();
    }
  };

  const handleSaveSchema = async (changes: SchemaChanges) => {
    if (!editingSchema) return;
    try {
      await collectionService.updateSchema(baseUrl, token, { name: editingSchema.collectionName, ...changes });
      notify.success(`Schema updated for "${editingSchema.collectionName}"`);
      setEditingSchema(null);
      fetchCollections();
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to update schema for "${editingSchema.collectionName}"`));
      throw new Error('Failed to update schema');
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    
    // Validate collection name
    const collectionError = validateName(trimmed, 'collection');
    if (collectionError) {
      notify.error(collectionError);
      return;
    }
    
    // Validate fields
    const validFields = newFields.filter(f => f.name.trim() !== '');
    if (validFields.length === 0) {
      notify.error('At least one field is required');
      return;
    }
    
    // Validate each field name
    for (const field of validFields) {
      const fieldError = validateName(field.name.trim(), 'field');
      if (fieldError) {
        notify.error(fieldError);
        return;
      }
    }
    
    // Check for duplicate field names
    const fieldNames = validFields.map(f => f.name.trim());
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      notify.error('Field names must be unique');
      return;
    }
    
    const columns: CollectionColumn[] = validFields.map(f => ({
      name: f.name.trim(),
      type: f.type,
      nullable: f.nullable,
      unique: f.unique,
    }));
    
    try {
      await collectionService.createCollection(baseUrl, token, { name: trimmed, columns });
      notify.success(`Collection "${trimmed}" created`);
      setNewName('');
      setNewFields([createEmptyField()]);
      setShowCreate(false);
      fetchCollections();
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to create collection'));
    }
  };

  const addField = () => {
    setNewFields([...newFields, createEmptyField()]);
  };

  const removeField = (index: number) => {
    if (newFields.length > 1) {
      setNewFields(newFields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, updates: Partial<FieldDraft>) => {
    const updated = [...newFields];
    updated[index] = { ...updated[index], ...updates };
    setNewFields(updated);
  };

  const columns: Column<CollectionRow>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { 
      key: 'records', 
      label: 'Records', 
      sortable: true,
    },
    {
      key: 'name' as keyof CollectionRow,
      label: 'Actions',
      sortable: false,
      render: (_value, row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-xs btn-info btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleEditSchema(row.name);
            }}
            data-testid={`edit-schema-${row.name}`}
          >
            Edit Schema
          </button>
          <button
            className="btn btn-xs btn-error btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.name);
            }}
            data-testid={`delete-${row.name}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Collections</h1>

      {showCreate && (
        <div className="card bg-base-200 mb-4 p-4" data-testid="create-form">
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold">Collection Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              placeholder="e.g., my_collection, users, product_items"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              pattern="[a-z][a-z0-9_]*"
              title="Collection name must be lowercase snake_case (start with a letter, contain only lowercase letters, numbers, and underscores)"
              required
              data-testid="create-name-input"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Must be lowercase snake_case (letters, numbers, underscores)
              </span>
            </label>
          </div>

          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold">Fields</span>
              <span className="label-text-alt text-base-content/60">
                Field names must be lowercase snake_case
              </span>
            </label>
            {newFields.map((field, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center" data-testid={`field-row-${index}`}>
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  placeholder="e.g., user_id, created_at"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  pattern="[a-z][a-z0-9_]*"
                  title="Field name must be lowercase snake_case (start with a letter, contain only lowercase letters, numbers, and underscores)"
                  required
                  data-testid={`field-name-${index}`}
                />
                <select
                  className="select select-bordered select-sm w-32"
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value })}
                  data-testid={`field-type-${index}`}
                >
                  <option value="string">String</option>
                  <option value="integer">Integer</option>
                  <option value="boolean">Boolean</option>
                  <option value="datetime">DateTime</option>
                  <option value="decimal">Decimal</option>
                  <option value="json">JSON</option>
                </select>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={field.nullable}
                    onChange={(e) => updateField(index, { nullable: e.target.checked })}
                    data-testid={`field-nullable-${index}`}
                  />
                  <span className="label-text text-sm">Nullable</span>
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={field.unique}
                    onChange={(e) => updateField(index, { unique: e.target.checked })}
                    data-testid={`field-unique-${index}`}
                  />
                  <span className="label-text text-sm">Unique</span>
                </label>
                {newFields.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-xs btn-error btn-outline"
                    onClick={() => removeField(index)}
                    data-testid={`remove-field-${index}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-xs btn-ghost mt-1"
              onClick={addField}
              data-testid="add-field-btn"
            >
              + Add Field
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => {
              setShowCreate(false);
              setNewName('');
              setNewFields([createEmptyField()]);
            }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-primary" data-testid="create-submit">
              Create Collection
            </button>
          </div>
          </form>
        </div>
      )}

      <DataTable<CollectionRow>
        columns={columns}
        data={collections}
        isLoading={loading}
        onRowClick={(row) => navigate(`/admin/collections/${encodeURIComponent(row.name)}`)}
        actions={
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreate(true)}
            data-testid="create-collection-btn"
          >
            + New Collection
          </button>
        }
      />

      {editingSchema && (
        <SchemaEditorModal
          isOpen={true}
          collectionName={editingSchema.collectionName}
          initialFields={editingSchema.fields}
          onClose={() => setEditingSchema(null)}
          onSave={handleSaveSchema}
          mode="edit"
        />
      )}
    </div>
  );
}
