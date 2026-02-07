import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ConnectionProfile } from '../types/connection';
import * as connectionManager from '../services/connectionManager';

export interface ConnectionContextValue {
  connections: ConnectionProfile[];
  currentConnectionId: string | null;
  unsavedChanges: boolean;
  setUnsavedChanges: (flag: boolean) => void;
  switchConnection: (id: string) => boolean;
  removeConnection: (id: string) => void;
  refreshConnections: () => void;
  setCurrentConnectionId: (id: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<ConnectionProfile[]>(
    () => connectionManager.getConnections(),
  );
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const refreshConnections = useCallback(() => {
    setConnections(connectionManager.getConnections());
  }, []);

  const switchConnection = useCallback(
    (id: string): boolean => {
      if (unsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Discard and switch connection?',
        );
        if (!confirmed) return false;
      }
      setUnsavedChanges(false);
      setCurrentConnectionId(id);
      return true;
    },
    [unsavedChanges],
  );

  const removeConn = useCallback(
    (id: string) => {
      connectionManager.removeConnection(id);
      refreshConnections();
      if (currentConnectionId === id) {
        setCurrentConnectionId(null);
      }
    },
    [currentConnectionId, refreshConnections],
  );

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        currentConnectionId,
        unsavedChanges,
        setUnsavedChanges,
        switchConnection,
        removeConnection: removeConn,
        refreshConnections,
        setCurrentConnectionId,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnections(): ConnectionContextValue {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnections must be used within a ConnectionProvider');
  }
  return context;
}
