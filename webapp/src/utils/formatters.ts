export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function toRfc3339(datetime: string): string {
  return new Date(datetime).toISOString()
}

export function collectionFilename(name: string, ext: 'csv' | 'json'): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${name}_${ts}.${ext}`
}
