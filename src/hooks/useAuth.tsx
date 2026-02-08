import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextValue, ConnectionSession } from '../types/auth';
import * as authService from '../services/authService';
import { MemoryTokenStorage, LocalStorageTokenStorage } from '../services/tokenStorage';
import * as connectionManager from '../services/connectionManager';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentConnection, setCurrentConnection] = useState<ConnectionSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const connections = connectionManager.getConnections();
        if (connections.length === 0) {
          setIsInitialized(true);
          return;
        }

        // Find the most recently active connection
        const mostRecent = connections.reduce((prev, current) =>
          current.lastActive > prev.lastActive ? current : prev
        );

        const connectionId = mostRecent.id;
        const storage = new LocalStorageTokenStorage(connectionId);
        const accessToken = storage.getAccessToken();
        const refreshToken = storage.getRefreshToken();
        const expiresAt = storage.getExpiresAt();

        if (!accessToken || !refreshToken || !expiresAt) {
          setIsInitialized(true);
          return;
        }

        // Check if token is expired
        const now = Date.now();
        if (now >= expiresAt) {
          // Token expired, clear it
          storage.clearTokens();
          setIsInitialized(true);
          return;
        }

        // Try to get current user to validate token
        let fetchedUser: User;
        try {
          fetchedUser = await authService.getCurrentUser(mostRecent.baseUrl, accessToken);
        } catch {
          // Token might be invalid, try to refresh
          try {
            const tokens = await authService.refresh(mostRecent.baseUrl, refreshToken);
            const newExpiresAt = tokens.expires_at
              ? new Date(tokens.expires_at).getTime()
              : Date.now() + 3600 * 1000;
            storage.setTokens(tokens.access_token, tokens.refresh_token, newExpiresAt);
            
            fetchedUser = tokens.user || await authService.getCurrentUser(mostRecent.baseUrl, tokens.access_token);
            
            // Update session with refreshed tokens
            const session: ConnectionSession = {
              connectionId,
              baseUrl: mostRecent.baseUrl,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: newExpiresAt,
              remember: true,
            };
            setCurrentConnection(session);
            setUser(fetchedUser);
            setIsAuthenticated(true);
            setIsInitialized(true);
            return;
          } catch {
            // Refresh failed, clear tokens
            storage.clearTokens();
            setIsInitialized(true);
            return;
          }
        }

        // Token is valid, restore session
        const session: ConnectionSession = {
          connectionId,
          baseUrl: mostRecent.baseUrl,
          accessToken,
          refreshToken,
          expiresAt,
          remember: true,
        };
        setCurrentConnection(session);
        setUser(fetchedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    restoreSession();
  }, []);

  // Don't render children until initialization is complete
  if (!isInitialized) {
    return null;
  }

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
