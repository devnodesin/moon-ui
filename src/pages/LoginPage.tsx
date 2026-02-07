import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FormErrors {
  serverUrl?: string;
  username?: string;
  password?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validate(serverUrl: string, username: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!serverUrl.trim()) {
    errors.serverUrl = 'Server URL is required';
  } else if (!isValidUrl(serverUrl.trim())) {
    errors.serverUrl = 'Enter a valid URL (e.g. https://api.example.com)';
  }
  if (!username.trim()) {
    errors.username = 'Username is required';
  }
  if (!password) {
    errors.password = 'Password is required';
  }
  return errors;
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');

  const nextPath = searchParams.get('next') || '/admin';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(decodeURIComponent(nextPath), { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate(serverUrl, username, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await login(username.trim(), password, serverUrl.trim(), remember);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Connection failed. Please check your credentials and server URL.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center justify-center text-2xl mb-2">
            🌙 Moon Admin
          </h2>

          {/* Saved Connections placeholder */}
          <div className="form-control mb-2">
            <select className="select select-bordered w-full" disabled>
              <option>Saved Connections</option>
            </select>
          </div>

          <div className="divider my-1 text-xs">OR</div>

          {apiError && (
            <div className="alert alert-error text-sm mb-2" role="alert">
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Server URL */}
            <div className="form-control mb-3">
              <label className="label" htmlFor="serverUrl">
                <span className="label-text">Server URL</span>
              </label>
              <input
                id="serverUrl"
                type="url"
                placeholder="https://api.example.com"
                className={`input input-bordered w-full ${errors.serverUrl ? 'input-error' : ''}`}
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={loading}
              />
              {errors.serverUrl && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.serverUrl}</span>
                </label>
              )}
            </div>

            {/* Username */}
            <div className="form-control mb-3">
              <label className="label" htmlFor="username">
                <span className="label-text">Username</span>
              </label>
              <input
                id="username"
                type="text"
                placeholder="Username or email"
                className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              {errors.username && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.username}</span>
                </label>
              )}
            </div>

            {/* Password */}
            <div className="form-control mb-3">
              <label className="label" htmlFor="password">
                <span className="label-text">Password</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password}</span>
                </label>
              )}
            </div>

            {/* Remember Connection */}
            <div className="form-control mb-4">
              <label className="label cursor-pointer justify-start gap-2" htmlFor="remember">
                <input
                  id="remember"
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span className="label-text">Remember Connection</span>
              </label>
            </div>

            {/* Connect Button */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </form>

          {/* Manage Connections placeholder */}
          <div className="text-center mt-3">
            <button className="btn btn-link btn-sm" disabled>
              Manage Connections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
