import { useConnections } from '../contexts/ConnectionContext';
import { useNavigate } from 'react-router-dom';

export function ConnectionsPage() {
  const { connections, currentConnectionId, switchConnection, removeConnection } =
    useConnections();
  const navigate = useNavigate();

  const handleConnect = (id: string) => {
    const profile = connections.find((c) => c.id === id);
    if (!profile) return;
    const switched = switchConnection(id);
    if (switched) {
      navigate(`/?baseUrl=${encodeURIComponent(profile.baseUrl)}`);
    }
  };

  const handleForget = (id: string) => {
    const confirmed = window.confirm('Remove this saved connection?');
    if (confirmed) {
      removeConnection(id);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Connections</h1>

      {connections.length === 0 ? (
        <div className="text-base-content/60">
          No saved connections. Log in with &quot;Remember Connection&quot; to save one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Label</th>
                <th>Server URL</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((conn) => (
                <tr key={conn.id} data-testid={`connection-row-${conn.id}`}>
                  <td>
                    {conn.label}
                    {conn.id === currentConnectionId && (
                      <span className="badge badge-primary badge-sm ml-2">Active</span>
                    )}
                  </td>
                  <td className="text-sm opacity-70">{conn.baseUrl}</td>
                  <td className="text-sm opacity-70">
                    {conn.lastActive
                      ? new Date(conn.lastActive).toLocaleString()
                      : '—'}
                  </td>
                  <td className="flex gap-2">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleConnect(conn.id)}
                    >
                      Connect
                    </button>
                    <button
                      className="btn btn-sm btn-error btn-outline"
                      onClick={() => handleForget(conn.id)}
                    >
                      Forget
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
