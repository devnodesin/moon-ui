import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecordView } from '../components/RecordView';
import type { FieldDefinition } from '../components/RecordView';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as userService from '../services/userService';
import type { UserRecord } from '../services/userService';

const viewFields: FieldDefinition[] = [
  { key: 'id', label: 'ID', type: 'text', editable: false },
  { key: 'username', label: 'Username', type: 'text', editable: false },
  { key: 'email', label: 'Email', type: 'email', editable: true },
  { key: 'role', label: 'Role', type: 'select', editable: true, options: ['admin', 'user'] },
  { key: 'created_at', label: 'Created', type: 'text', editable: false },
];

const createFields: FieldDefinition[] = [
  { key: 'username', label: 'Username', type: 'text', editable: true },
  { key: 'email', label: 'Email', type: 'email', editable: true },
  { key: 'password', label: 'Password', type: 'text', editable: true },
  { key: 'role', label: 'Role', type: 'select', editable: true, options: ['admin', 'user'] },
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentConnection } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();

  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = currentConnection?.baseUrl ?? '';
  const token = currentConnection?.accessToken ?? '';
  const isNew = id === 'new';

  const fetchUser = useCallback(async () => {
    if (!baseUrl || !token || isNew) {
      setLoading(false);
      return;
    }
    setLoading(true);
    startLoading();
    try {
      const data = await userService.getUser(baseUrl, token, id!);
      setUser(data);
    } catch {
      notify.error('Failed to load user');
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [baseUrl, token, id, isNew, startLoading, stopLoading, notify]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSave = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        if (isNew) {
          await userService.createUser(baseUrl, token, {
            username: String(data.username ?? ''),
            email: String(data.email ?? ''),
            password: String(data.password ?? ''),
            role: String(data.role ?? 'user'),
          });
          notify.success('User created');
          navigate('/admin/users');
        } else {
          await userService.updateUser(baseUrl, token, id!, {
            email: String(data.email ?? ''),
            role: String(data.role ?? ''),
          });
          notify.success('User updated');
          await fetchUser();
        }
      } catch {
        notify.error('Failed to save user');
        throw new Error('Save failed');
      }
    },
    [baseUrl, token, id, isNew, notify, navigate, fetchUser],
  );

  const handleBack = useCallback(() => {
    navigate('/admin/users');
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (isNew) {
    const emptyUser: Record<string, unknown> = {
      username: '',
      email: '',
      password: '',
      role: 'user',
    };

    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">New User</h1>
        <RecordView<Record<string, unknown>>
          data={emptyUser}
          fields={createFields}
          onSave={handleSave}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <button className="btn btn-sm btn-ghost mb-4" onClick={handleBack}>
          ← Back
        </button>
        <p className="text-base-content/60">User not found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User: {user.username}</h1>
      <RecordView<Record<string, unknown>>
        data={user as unknown as Record<string, unknown>}
        fields={viewFields}
        onSave={handleSave}
        onBack={handleBack}
      />
    </div>
  );
}
