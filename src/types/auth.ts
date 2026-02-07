export interface User {
  username: string;
  email?: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string, baseUrl: string, remember: boolean) => Promise<void>;
  logout: () => void;
}
