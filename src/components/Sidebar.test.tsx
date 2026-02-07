import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('should render navigation links', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /collections/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /api keys/i })).toBeInTheDocument();
  });

  it('should render notifications link', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
  });

  it('should render connections link', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    expect(screen.getByRole('link', { name: /connections/i })).toBeInTheDocument();
  });

  it('should have correct navigation paths', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    const usersLink = screen.getByRole('link', { name: /users/i });
    const apiKeysLink = screen.getByRole('link', { name: /api keys/i });
    const notificationsLink = screen.getByRole('link', { name: /notifications/i });
    const connectionsLink = screen.getByRole('link', { name: /connections/i });
    
    expect(usersLink).toHaveAttribute('href', '#/admin/users');
    expect(apiKeysLink).toHaveAttribute('href', '#/admin/keys');
    expect(notificationsLink).toHaveAttribute('href', '#/admin/notifications');
    expect(connectionsLink).toHaveAttribute('href', '#/admin/connections');
  });
});
