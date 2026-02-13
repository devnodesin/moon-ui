import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/collections', label: 'Collections', icon: '📚' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/keys', label: 'API Keys', icon: '🔑' },
    { path: '/admin/connections', label: 'Connections', icon: '🔌' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <ul className="menu p-4 w-64 min-h-full bg-base-200">
      {navItems.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'active' : ''
            }
            end={item.path === '/admin'}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        </li>
      ))}
      
      <div className="divider my-2" />
      
      <li>
        <button onClick={handleLogout} className="text-error" data-testid="logout-button">
          <span className="text-xl">🚪</span>
          Logout
        </button>
      </li>
    </ul>
  );
}
