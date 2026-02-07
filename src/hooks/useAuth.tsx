import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextValue, ConnectionSession } from '../types/auth';
import * as authService from '../services/authService';
import { MemoryTokenStorage, LocalStorageTokenStorage } from '../services/tokenStorage';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentConnection, setCurrentConnection] = useState<ConnectionSession | null>(null);

  const login = useCallback(async (
    username: string,
    password: string,
    baseUrl: string,
    remember: boolean
  ) => {
    const tokens = await authService.login(baseUrl, username, password);

    // Parse expires_at or calculate expiry
    const expiresAt = tokens.expires_at 
      ? new Date(tokens.expires_at).getTime()
      : Date.now() + 3600 * 1000; // Default 1 hour
    
    const connectionId = new URL(baseUrl).host;

    const storage = remember
      ? new LocalStorageTokenStorage(connectionId)
      : new MemoryTokenStorage();
    storage.setTokens(tokens.access_token, tokens.refresh_token, expiresAt);

    let fetchedUser: User;
    // Use user from token response if available
    if (tokens.user) {
      fetchedUser = tokens.user;
    } else {
      try {
        fetchedUser = await authService.getCurrentUser(baseUrl, tokens.access_token);
      } catch {
        fetchedUser = { username };
      }
    }

    const session: ConnectionSession = {
      connectionId,
      baseUrl,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      remember,
    };

    setCurrentConnection(session);
    setUser(fetchedUser);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    if (currentConnection) {
      const { baseUrl, accessToken, refreshToken, connectionId, remember } = currentConnection;
      authService.logout(baseUrl, accessToken, refreshToken).catch(() => {});
      if (remember) {
        new LocalStorageTokenStorage(connectionId).clearTokens();
      }
    }
    setIsAuthenticated(false);
    setUser(null);
    setCurrentConnection(null);
  }, [currentConnection]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, currentConnection, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
