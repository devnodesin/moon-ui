import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('should render navbar with branding', () => {
    render(
      <ThemeProvider>
        <HashRouter>
          <Navbar />
        </HashRouter>
      </ThemeProvider>
    );
    expect(screen.getByText(/Moon Admin/i)).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(
      <ThemeProvider>
        <HashRouter>
          <Navbar />
        </HashRouter>
      </ThemeProvider>
    );
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  it('should render menu toggle button', () => {
    render(
      <ThemeProvider>
        <HashRouter>
          <Navbar />
        </HashRouter>
      </ThemeProvider>
    );
    const menuButton = screen.getByLabelText(/open menu/i);
    expect(menuButton).toBeInTheDocument();
  });
});
