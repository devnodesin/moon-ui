import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConnections,
  getConnection,
  saveConnection,
  removeConnection,
} from './connectionManager';
import type { ConnectionProfile } from '../types/connection';

describe('connectionManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const profile: ConnectionProfile = {
    id: 'api.example.com',
    label: 'api.example.com',
    baseUrl: 'https://api.example.com',
    lastActive: 1000,
  };

  it('should return empty array when no connections stored', () => {
    expect(getConnections()).toEqual([]);
  });

  it('should save and retrieve a connection', () => {
    saveConnection(profile);
    expect(getConnections()).toEqual([profile]);
    expect(getConnection(profile.id)).toEqual(profile);
  });

  it('should update an existing connection', () => {
    saveConnection(profile);
    const updated = { ...profile, label: 'Updated Label', lastActive: 2000 };
    saveConnection(updated);
    const connections = getConnections();
    expect(connections).toHaveLength(1);
    expect(connections[0].label).toBe('Updated Label');
    expect(connections[0].lastActive).toBe(2000);
  });

  it('should remove a connection', () => {
    saveConnection(profile);
    removeConnection(profile.id);
    expect(getConnections()).toEqual([]);
  });

  it('should return undefined for unknown connection id', () => {
    expect(getConnection('nonexistent')).toBeUndefined();
  });

  it('should handle multiple connections', () => {
    const profile2: ConnectionProfile = {
      id: 'other.example.com',
      label: 'other.example.com',
      baseUrl: 'https://other.example.com',
      lastActive: 3000,
    };
    saveConnection(profile);
    saveConnection(profile2);
    expect(getConnections()).toHaveLength(2);
    removeConnection(profile.id);
    expect(getConnections()).toEqual([profile2]);
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('moon-connections', 'not-json');
    expect(getConnections()).toEqual([]);
  });
});
