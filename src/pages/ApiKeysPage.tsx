import { useState, useEffect, useCallback, useRef } from 'react';
import { DataTable } from '../components/DataTable';
import type { Column, Pagination } from '../components/DataTable';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import { extractUserMessage } from '../utils/errorUtils';
import * as apiKeyService from '../services/apiKeyService';
import type { ApiKeyRecord } from '../services/apiKeyService';

const PAGE_SIZE = 20;

export function ApiKeysPage() {
  const { currentConnection } = useAuth();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Use ref to avoid including cursors in fetchKeys dependencies
  const cursorsRef = useRef<string[]>([]);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formCanWrite, setFormCanWrite] = useState(false);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchKeys = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const result = await apiKeyService.listApiKeys(baseUrl, token, {
        limit: PAGE_SIZE,
        after: page > 1 ? cursorsRef.current[page - 2] : undefined,
      });
      setKeys(result.apikeys);
      setHasMore(result.has_more ?? false);
      if (result.next_cursor && page > cursorsRef.current.length) {
        cursorsRef.current = [...cursorsRef.current, result.next_cursor];
      }
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to load API keys'));
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, page, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleCreate = async () => {
    const trimmedName = formName.trim();
    if (!trimmedName) return;
    try {
      const result = await apiKeyService.createApiKey(baseUrl, token, {
        name: trimmedName,
        description: formDescription.trim(),
        role: formRole,
        can_write: formCanWrite,
      });
      setCreatedKey(result.key);
      notify.success(`API key "${trimmedName}" created`);
      setFormName('');
      setFormDescription('');
      setFormRole('user');
      setFormCanWrite(false);
      setShowCreate(false);
      fetchKeys();
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to create API key'));
    }
  };

  const handleDelete = async (row: ApiKeyRecord) => {
    if (!window.confirm(`Delete API key "${row.name}"?`)) return;
    try {
      await apiKeyService.deleteApiKey(baseUrl, token, row.id);
      notify.success(`API key "${row.name}" deleted`);
      fetchKeys();
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to delete "${row.name}"`));
    }
  };

  const handleRotate = async (row: ApiKeyRecord) => {
    if (!window.confirm(`Regenerate API key "${row.name}"? The old key will be immediately invalidated.`)) return;
    try {
      const result = await apiKeyService.rotateApiKey(baseUrl, token, row.id);
      setCreatedKey(result.key);
      notify.success(`API key "${row.name}" regenerated`);
      fetchKeys();
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to regenerate "${row.name}"`));
    }
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      notify.success('Key copied to clipboard');
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to copy key'));
    }
  };

  const columns: Column<ApiKeyRecord>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'role', label: 'Role', sortable: true },
    {
      key: 'can_write',
      label: 'Write',
      render: (value) => (value ? 'Yes' : 'No'),
    },
    { key: 'created_at', label: 'Created', sortable: true },
    {
      key: 'id',
      label: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-1">
          <button
            className="btn btn-xs btn-warning btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(row);
            }}
            data-testid={`rotate-${row.name}`}
          >
            Regenerate
          </button>
          <button
            className="btn btn-xs btn-error btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            data-testid={`delete-${row.name}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const pagination: Pagination = {
    currentPage: page,
    totalPages: hasMore ? page + 1 : page,
    hasNext: hasMore,
    hasPrev: page > 1,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">API Keys</h1>

      {createdKey && (
        <div className="alert alert-success mb-4 shadow-lg" data-testid="created-key-alert">
          <div className="flex flex-col gap-2 w-full">
            <span className="font-bold">API Key created! Copy it now — it won't be shown again.</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all bg-base-100 text-base-content p-2 rounded border border-success" data-testid="created-key-value">
                {createdKey}
              </code>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleCopyKey}
                data-testid="copy-key-btn"
              >
                📋 Copy
              </button>
            </div>
            <button
              className="btn btn-sm btn-outline self-end"
              onClick={() => setCreatedKey(null)}
              data-testid="dismiss-key-alert"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="card bg-base-200 p-4 mb-4" data-testid="create-key-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">Name</span></label>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                data-testid="key-name-input"
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Description</span></label>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                data-testid="key-description-input"
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Role</span></label>
              <select
                className="select select-bordered select-sm"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                data-testid="key-role-input"
              >
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Can Write</span></label>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formCanWrite}
                onChange={(e) => setFormCanWrite(e.target.checked)}
                data-testid="key-canwrite-input"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-sm btn-primary" onClick={handleCreate} data-testid="key-create-submit">
              Create
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable<ApiKeyRecord>
        columns={columns}
        data={keys}
        isLoading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        actions={
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreate(true)}
            data-testid="create-key-btn"
          >
            + New API Key
          </button>
        }
      />
    </div>
  );
}
