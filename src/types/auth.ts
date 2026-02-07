export interface User {
  id?: string;
  username: string;
  email?: string;
  role?: string;
  can_write?: boolean;
}

export interface ConnectionSession {
  connectionId: string;
  baseUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  remember: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type: string;
  user?: User;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  currentConnection: ConnectionSession | null;
  login: (username: string, password: string, baseUrl: string, remember: boolean) => Promise<void>;
  logout: () => void;
}
