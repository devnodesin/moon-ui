import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as collectionService from '../services/collectionService';
import type { CollectionInfo } from '../services/collectionService';

interface CollectionRow {
  name: string;
  columnCount: number;
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

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchCollections = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const list: CollectionInfo[] = await collectionService.listCollections(baseUrl, token);
      setCollections(
        list.map((c) => ({
          name: c.name,
          columnCount: c.columns?.length ?? 0,
        })),
      );
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

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await collectionService.createCollection(baseUrl, token, { name: trimmed, columns: [] });
      notify.success(`Collection "${trimmed}" created`);
      setNewName('');
      setShowCreate(false);
      fetchCollections();
    } catch {
      notify.error('Failed to create collection');
    }
  };

  const columns: Column<CollectionRow>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'columnCount', label: 'Fields', sortable: true },
    {
      key: 'name',
      label: 'Actions',
      render: (_value, row) => (
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
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Collections</h1>

      {showCreate && (
        <div className="flex gap-2 mb-4" data-testid="create-form">
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="create-name-input"
          />
          <button className="btn btn-sm btn-primary" onClick={handleCreate} data-testid="create-submit">
            Create
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
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
    </div>
  );
}
