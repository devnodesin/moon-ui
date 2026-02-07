import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render login page by default when not authenticated', () => {
    render(<App />);
    expect(screen.getByText(/Moon Admin/i)).toBeInTheDocument();
  });

  it('should render with ThemeProvider', () => {
    render(<App />);
    // Verify the app renders without crashing
    expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
  });
});
