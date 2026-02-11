import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as userService from '../services/userService';
import type { UserRecord } from '../services/userService';

export function UsersPage() {
  const { currentConnection, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchUsers = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const list = await userService.listUsers(baseUrl, token);
      setUsers(list);
    } catch {
      notify.error('Failed to load users');
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (row: UserRecord) => {
    if (currentUser && row.username === currentUser.username) {
      notify.warning('Cannot delete your own account');
      return;
    }
    if (!window.confirm(`Delete user "${row.username}"?`)) return;
    try {
      await userService.deleteUser(baseUrl, token, row.id);
      notify.success(`User "${row.username}" deleted`);
      fetchUsers();
    } catch {
      notify.error(`Failed to delete "${row.username}"`);
    }
  };

  const handleClearSession = async (row: UserRecord) => {
    if (!window.confirm(`Revoke all sessions for "${row.username}"?`)) return;
    try {
      await userService.revokeUserSessions(baseUrl, token, row.id);
      notify.success(`Sessions revoked for "${row.username}"`);
      fetchUsers();
    } catch {
      notify.error(`Failed to revoke sessions for "${row.username}"`);
    }
  };

  const columns: Column<UserRecord>[] = [
    { key: 'username', label: 'Username', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
    {
      key: 'id',
      label: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-xs btn-warning btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleClearSession(row);
            }}
            data-testid={`clear-session-${row.username}`}
          >
            Clear Session
          </button>
          <button
            className="btn btn-xs btn-error btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            disabled={currentUser?.username === row.username}
            data-testid={`delete-${row.username}`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <DataTable<UserRecord>
        columns={columns}
        data={users}
        isLoading={loading}
        onRowClick={(row) => navigate(`/admin/users/${encodeURIComponent(row.id)}`)}
        actions={
          <button
            className="btn btn-sm btn-primary"
            onClick={() => navigate('/admin/users/new')}
            data-testid="create-user-btn"
          >
            + New User
          </button>
        }
      />
    </div>
  );
}
