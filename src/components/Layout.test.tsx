import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Layout } from './Layout';

describe('Layout', () => {
  it('should render navbar', () => {
    render(
      <ThemeProvider>
        <HashRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </HashRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByText(/Moon Admin/i)).toBeInTheDocument();
  });

  it('should render sidebar', () => {
    render(
      <ThemeProvider>
        <HashRouter>
          <Layout>
            <div>Content</div>
          </Layout>
        </HashRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('should render children in main content area', () => {
    render(
      <ThemeProvider>
        <HashRouter>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </HashRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
