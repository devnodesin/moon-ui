import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/DataTable';
import type { Column, Pagination } from '../components/DataTable';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as userService from '../services/userService';
import type { UserRecord } from '../services/userService';
import { extractUserMessage } from '../utils/errorUtils';

const PAGE_SIZE = 20;

export function UsersPage() {
  const { currentConnection, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Use ref to avoid including cursors in fetchUsers dependencies
  const cursorsRef = useRef<string[]>([]);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';

  const fetchUsers = useCallback(async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    startLoading();
    try {
      const result = await userService.listUsers(baseUrl, token, {
        limit: PAGE_SIZE,
        after: page > 1 ? cursorsRef.current[page - 2] : undefined,
      });
      setUsers(result.users);
      setHasMore(result.has_more ?? false);
      if (result.next_cursor && page > cursorsRef.current.length) {
        cursorsRef.current = [...cursorsRef.current, result.next_cursor];
      }
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to load users'));
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, page, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

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
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to delete "${row.username}"`));
    }
  };

  const handleClearSession = async (row: UserRecord) => {
    if (!window.confirm(`Revoke all sessions for "${row.username}"?`)) return;
    try {
      await userService.revokeUserSessions(baseUrl, token, row.id);
      notify.success(`Sessions revoked for "${row.username}"`);
      fetchUsers();
    } catch (error) {
      notify.error(extractUserMessage(error, `Failed to revoke sessions for "${row.username}"`));
    }
  };

  const pagination: Pagination = {
    currentPage: page,
    totalPages: hasMore ? page + 1 : page,
    hasNext: hasMore,
    hasPrev: page > 1,
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
        pagination={pagination}
        onPageChange={handlePageChange}
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
