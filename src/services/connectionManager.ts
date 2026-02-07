import type { ConnectionProfile } from '../types/connection';

const STORAGE_KEY = 'moon-connections';

function loadProfiles(): ConnectionProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistProfiles(profiles: ConnectionProfile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getConnections(): ConnectionProfile[] {
  return loadProfiles();
}

export function getConnection(id: string): ConnectionProfile | undefined {
  return loadProfiles().find((p) => p.id === id);
}

export function saveConnection(profile: ConnectionProfile): void {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  persistProfiles(profiles);
}

export function removeConnection(id: string): void {
  const profiles = loadProfiles().filter((p) => p.id !== id);
  persistProfiles(profiles);
}
