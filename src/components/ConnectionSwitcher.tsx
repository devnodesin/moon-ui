import { useConnections } from '../contexts/ConnectionContext';
import { useNavigate } from 'react-router-dom';

export function ConnectionSwitcher() {
  const { connections, currentConnectionId, switchConnection } = useConnections();
  const navigate = useNavigate();

  if (connections.length === 0) return null;

  const handleSwitch = (id: string) => {
    if (id === currentConnectionId) return;
    const profile = connections.find((c) => c.id === id);
    if (!profile) return;
    const switched = switchConnection(id);
    if (switched) {
      navigate(`/?baseUrl=${encodeURIComponent(profile.baseUrl)}`);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1" aria-label="Switch connection">
        🔌  
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-56 p-2 shadow-lg border border-base-300">
        {connections.map((conn) => (
          <li key={conn.id}>
            <button
              className={conn.id === currentConnectionId ? 'active' : ''}
              onClick={() => handleSwitch(conn.id)}
            >
              <span className="truncate">{conn.label}</span>
            </button>
          </li>
        ))}
        <li className="border-t border-base-300 mt-1 pt-1">
          <button onClick={() => navigate('/admin/connections')}>
            Manage Connections
          </button>
        </li>
      </ul>
    </div>
  );
}
