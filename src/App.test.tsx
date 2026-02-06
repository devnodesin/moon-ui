import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders Hello Moon message', () => {
    render(<App />);
    expect(screen.getByText(/Hello Moon/i)).toBeInTheDocument();
  });

  it('renders the Get Started button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
  });

  it('renders Moon Admin WebApp text', () => {
    render(<App />);
    expect(screen.getByText(/Moon Admin WebApp/i)).toBeInTheDocument();
  });
});
