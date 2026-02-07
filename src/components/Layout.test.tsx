import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ConnectionProvider } from '../contexts/ConnectionContext';
import { Layout } from './Layout';

function renderLayout(children: React.ReactNode) {
  return render(
    <ThemeProvider>
      <ConnectionProvider>
        <HashRouter>
          <Layout>{children}</Layout>
        </HashRouter>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

describe('Layout', () => {
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
