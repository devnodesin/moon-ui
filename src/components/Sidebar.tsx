import { NavLink } from 'react-router-dom';

export function Sidebar() {
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/collections', label: 'Collections', icon: '📚' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/keys', label: 'API Keys', icon: '🔑' },
    { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
  ];

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
    </ul>
  );
}
