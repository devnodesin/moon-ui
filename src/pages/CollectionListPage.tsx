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

interface CollectionRow {
  name: string;
  columnCount: number;
  recordCount: number | null;
}

interface FieldDraft {
  name: string;
  type: string;
  nullable: boolean;
}

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
  const [newFields, setNewFields] = useState<FieldDraft[]>([{ name: '', type: 'string', nullable: false }]);
  const [editingSchema, setEditingSchema] = useState<EditingSchema | null>(null);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchCollections = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const list: CollectionInfo[] = await collectionService.listCollections(baseUrl, token);
      
      // Fetch schema and record count for each collection
      const enrichedCollections = await Promise.all(
        list.map(async (c) => {
          try {
            // Fetch schema to get field count
            const schema = await collectionService.getSchema(baseUrl, token, c.name);
            
            // Fetch records with limit=0 to get total count (if API supports it)
            // Otherwise fetch with limit=1 and check for total in response
            const recordsResult = await collectionService.listRecords(baseUrl, token, c.name, { limit: 1 });
            
            // Try to determine record count from response
            // Some APIs return total, count, or we can estimate from has_more
            const recordCount = recordsResult.data?.length ?? 0;
            
            return {
              name: c.name,
              columnCount: schema.length,
              recordCount: recordCount > 0 || recordsResult.has_more ? recordCount : 0,
            };
          } catch {
            // If fetching metadata fails, return basic info
            return {
              name: c.name,
              columnCount: 0,
              recordCount: null,
            };
          }
        }),
      );
      
      setCollections(enrichedCollections);
    } catch {
      notify.error('Failed to load collections');
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
    } catch {
      notify.error(`Failed to delete "${name}"`);
    }
  };

  const handleEditSchema = async (name: string) => {
    try {
      startLoading();
      const schema = await collectionService.getSchema(baseUrl, token, name);
      setEditingSchema({ collectionName: name, fields: schema });
    } catch {
      notify.error(`Failed to load schema for "${name}"`);
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
    } catch {
      notify.error(`Failed to update schema for "${editingSchema.collectionName}"`);
      throw new Error('Failed to update schema');
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      notify.error('Collection name is required');
      return;
    }
    
    // Validate fields
    const validFields = newFields.filter(f => f.name.trim() !== '');
    if (validFields.length === 0) {
      notify.error('At least one field is required');
      return;
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
    }));
    
    try {
      await collectionService.createCollection(baseUrl, token, { name: trimmed, columns });
      notify.success(`Collection "${trimmed}" created`);
      setNewName('');
      setNewFields([{ name: '', type: 'string', nullable: false }]);
      setShowCreate(false);
      fetchCollections();
    } catch {
      notify.error('Failed to create collection');
    }
  };

  const addField = () => {
    setNewFields([...newFields, { name: '', type: 'string', nullable: false }]);
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
    { key: 'columnCount', label: 'Fields', sortable: true },
    { 
      key: 'recordCount' as keyof CollectionRow, 
      label: 'Records', 
      sortable: true,
      render: (value) => value === null ? '—' : String(value)
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
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold">Collection Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              placeholder="Enter collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              data-testid="create-name-input"
            />
          </div>

          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text font-semibold">Fields</span>
            </label>
            {newFields.map((field, index) => (
              <div key={index} className="flex gap-2 mb-2 items-center" data-testid={`field-row-${index}`}>
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1"
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
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
            <button className="btn btn-sm btn-ghost" onClick={() => {
              setShowCreate(false);
              setNewName('');
              setNewFields([{ name: '', type: 'string', nullable: false }]);
            }}>
              Cancel
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleCreate} data-testid="create-submit">
              Create Collection
            </button>
          </div>
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
