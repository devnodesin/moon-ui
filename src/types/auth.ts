export interface User {
  username: string;
  email?: string;
  role?: string;
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
  expires_in: number;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  currentConnection: ConnectionSession | null;
  login: (username: string, password: string, baseUrl: string, remember: boolean) => Promise<void>;
  logout: () => void;
}
