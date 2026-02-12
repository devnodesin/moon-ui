import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RecordView } from '../components/RecordView';
import type { FieldDefinition } from '../components/RecordView';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotify';
import { useLoading } from '../contexts/LoadingContext';
import * as userService from '../services/userService';
import type { UserRecord } from '../services/userService';
import { extractUserMessage } from '../utils/errorUtils';

const viewFields: FieldDefinition[] = [
  { key: 'id', label: 'ID', type: 'text', editable: false },
  { key: 'username', label: 'Username', type: 'text', editable: false },
  { key: 'email', label: 'Email', type: 'email', editable: true },
  { key: 'role', label: 'Role', type: 'select', editable: true, options: ['admin', 'user'] },
  { key: 'created_at', label: 'Created', type: 'text', editable: false },
];

const createFields: FieldDefinition[] = [
  { 
    key: 'username', 
    label: 'Username', 
    type: 'text', 
    editable: true, 
    pattern: '[a-z0-9]+',
    required: true,
    placeholder: 'lowercase alphanumeric only'
  },
  { 
    key: 'email', 
    label: 'Email', 
    type: 'email', 
    editable: true,
    required: true 
  },
  { 
    key: 'password', 
    label: 'Password', 
    type: 'password', 
    editable: true,
    minLength: 8,
    required: true,
    placeholder: 'min 8 characters'
  },
  { 
    key: 'role', 
    label: 'Role', 
    type: 'select', 
    editable: true, 
    options: ['admin', 'user'],
    required: true
  },
];

function validateUsername(username: string): string | null {
  if (!username) return 'Username is required';
  if (!/^[a-z0-9]+$/.test(username)) return 'Username must be lowercase alphanumeric only';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password should contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password should contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password should contain at least one digit';
  return null;
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentConnection } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const { startLoading, stopLoading } = useLoading();

  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

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
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to load user'));
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
          const username = String(data.username ?? '');
          const password = String(data.password ?? '');
          const usernameError = validateUsername(username);
          const passwordError = validatePassword(password);
          
          if (usernameError) {
            notify.error(usernameError);
            throw new Error(usernameError);
          }
          if (passwordError) {
            notify.warning(passwordError);
          }
          
          await userService.createUser(baseUrl, token, {
            username,
            email: String(data.email ?? ''),
            password,
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
      } catch (error) {
        notify.error(extractUserMessage(error, 'Failed to save user'));
        throw new Error('Save failed');
      }
    },
    [baseUrl, token, id, isNew, notify, navigate, fetchUser],
  );

  const handlePasswordChange = useCallback(async () => {
    const error = validatePassword(newPassword);
    setPasswordError(error);
    
    if (error) {
      notify.warning(error);
      return;
    }

    setChangingPassword(true);
    try {
      await userService.updateUser(baseUrl, token, id!, {
        action: 'reset_password',
        new_password: newPassword,
      });
      notify.success('Password changed successfully');
      setNewPassword('');
      setPasswordError(null);
      await fetchUser();
    } catch (error) {
      notify.error(extractUserMessage(error, 'Failed to change password'));
    } finally {
      setChangingPassword(false);
    }
  }, [baseUrl, token, id, newPassword, notify, fetchUser]);

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
          initialMode="edit"
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
      
      {/* Change Password Section */}
      <div className="mt-8 w-full max-w-2xl border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">New Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input input-bordered input-sm w-full pr-10"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError(null);
              }}
              placeholder="Enter new password (min 8 characters)"
              minLength={8}
              data-testid="new-password-input"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-xs btn-ghost"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {passwordError && (
            <label className="label">
              <span className="label-text-alt text-warning">{passwordError}</span>
            </label>
          )}
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              Must be at least 8 characters. Should include uppercase, lowercase, and digit.
            </span>
          </label>
        </div>
        <div className="mt-4">
          <button
            className="btn btn-sm btn-primary"
            onClick={handlePasswordChange}
            disabled={!newPassword || changingPassword}
            data-testid="change-password-btn"
          >
            {changingPassword ? <span className="loading loading-spinner loading-xs" /> : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
