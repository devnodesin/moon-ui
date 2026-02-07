import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { THEME_STORAGE_KEY } from '../types/theme';

// Test component to access theme context
function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide autumn theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme').textContent).toBe('autumn');
  });

  it('should load theme from localStorage if available', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'abyss');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme').textContent).toBe('abyss');
  });

  it('should toggle theme from autumn to abyss', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    act(() => {
      toggleButton.click();
    });
    
    expect(screen.getByTestId('current-theme').textContent).toBe('abyss');
  });

  it('should toggle theme from abyss to autumn', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'abyss');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    act(() => {
      toggleButton.click();
    });
    
    expect(screen.getByTestId('current-theme').textContent).toBe('autumn');
  });

  it('should persist theme to localStorage on toggle', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    act(() => {
      toggleButton.click();
    });
    
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('abyss');
  });

  it('should apply theme to document element', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('autumn');
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    act(() => {
      toggleButton.click();
    });
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('abyss');
  });
});
