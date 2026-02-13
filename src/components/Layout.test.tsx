import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ConnectionProvider } from '../contexts/ConnectionContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { Layout } from './Layout';
import * as useAuthModule from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderLayout(children: React.ReactNode) {
  return render(
    <ThemeProvider>
      <ConnectionProvider>
        <NotificationProvider>
          <HashRouter>
            <Layout>{children}</Layout>
          </HashRouter>
        </NotificationProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      logout: vi.fn(),
      isAuthenticated: true,
      user: null,
      currentConnection: null,
      login: vi.fn(),
    });
  });

  it('should render navbar', () => {
    renderLayout(<div>Content</div>);
    expect(screen.getByText(/Moon Admin/i)).toBeInTheDocument();
  });

  it('should render sidebar', () => {
    renderLayout(<div>Content</div>);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    renderLayout(<div>Test Content</div>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
