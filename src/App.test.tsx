import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('Moon Admin')).toBeInTheDocument();
  });

  it('renders the get started button with DaisyUI styling', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /get started/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-primary');
  });
});
