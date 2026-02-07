import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('should render navigation links', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /collections/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /api keys/i })).toBeInTheDocument();
  });

  it('should render notifications link', () => {
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );
    
    expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
  });
});
