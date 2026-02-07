import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('should render a theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('autumn');
    
    const button = screen.getByRole('button');
    act(() => {
      button.click();
    });
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('abyss');
  });
});
