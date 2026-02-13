import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ConnectionProvider } from '../contexts/ConnectionContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('should render navbar with branding', () => {
    render(
      <ThemeProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <HashRouter>
              <Navbar />
            </HashRouter>
          </NotificationProvider>
        </ConnectionProvider>
      </ThemeProvider>
    );
    expect(screen.getByText(/Moon Admin/i)).toBeInTheDocument();
  });

  it('should render settings dropdown button', () => {
    render(
      <ThemeProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <HashRouter>
              <Navbar />
            </HashRouter>
          </NotificationProvider>
        </ConnectionProvider>
      </ThemeProvider>
    );
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('should render menu toggle button', () => {
    render(
      <ThemeProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <HashRouter>
              <Navbar />
            </HashRouter>
          </NotificationProvider>
        </ConnectionProvider>
      </ThemeProvider>
    );
    const menuButton = screen.getByLabelText(/open menu/i);
    expect(menuButton).toBeInTheDocument();
  });
});
