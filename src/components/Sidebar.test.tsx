import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import * as useAuthModule from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Sidebar', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: mockLogout,
      isAuthenticated: true,
      user: null,
      currentConnection: null,
      login: vi.fn(),
    });
  });

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
    expect(screen.getByRole('link', { name: /connections/i })).toBeInTheDocument();
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
    const connectionsLink = screen.getByRole('link', { name: /connections/i });
    
    expect(usersLink).toHaveAttribute('href', '#/admin/users');
    expect(apiKeysLink).toHaveAttribute('href', '#/admin/keys');
    expect(connectionsLink).toHaveAttribute('href', '#/admin/connections');
  });

  it('should render logout button', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    const logoutButton = screen.getByTestId('logout-button');
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent(/logout/i);
  });

  it('should call logout and navigate to root when logout button is clicked', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
