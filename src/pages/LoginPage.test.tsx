import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    currentConnection: null,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

function renderLogin(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
  });

  it('should render all form fields', () => {
    renderLogin();
    expect(screen.getByText('🌙 Moon Admin')).toBeInTheDocument();
    expect(screen.getByLabelText(/server url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember connection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('should show saved connections dropdown placeholder', () => {
    renderLogin();
    expect(screen.getByText('Saved Connections')).toBeInTheDocument();
  });

  it('should show manage connections placeholder', () => {
    renderLogin();
    expect(screen.getByText('Manage Connections')).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(screen.getByText('Server URL is required')).toBeInTheDocument();
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should show URL validation error for invalid URL', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/server url/i), 'not-a-url');
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(screen.getByText(/enter a valid url/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should call login with correct params on valid submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/server url/i), 'https://api.example.com');
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'admin',
        'secret',
        'https://api.example.com',
        false,
      );
    });
  });

  it('should call login with remember=true when checkbox checked', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/server url/i), 'https://api.example.com');
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByLabelText(/remember connection/i));
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'admin',
        'secret',
        'https://api.example.com',
        true,
      );
    });
  });

  it('should show loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/server url/i), 'https://api.example.com');
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(screen.getByText('Connecting…')).toBeInTheDocument();
    });
  });

  it('should show API error on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/server url/i), 'https://api.example.com');
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should disable inputs during loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/server url/i), 'https://api.example.com');
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/server url/i)).toBeDisabled();
      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByLabelText(/remember connection/i)).toBeDisabled();
    });
  });

  it('should have password field masked', () => {
    renderLogin();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });
});
