export function useImportExport() {
  function exportCsv(records: Record<string, unknown>[], fields: string[], filename: string): void {
    const header = fields.join(',')
    const rows = records.map((r) =>
      fields
        .map((f) => {
          const val = r[f] ?? ''
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    )
    const csv = [header, ...rows].join('\n')
    downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  function exportJson(records: Record<string, unknown>[], filename: string): void {
    downloadFile(JSON.stringify(records, null, 2), filename, 'application/json')
  }

  function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function importCsv(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.trim().split('\n')
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
          const records = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
            return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
          })
          resolve(records)
        } catch {
          reject(new Error('Failed to parse CSV file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  function importJson(file: File): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (!Array.isArray(data)) reject(new Error('JSON must be an array'))
          else resolve(data as Record<string, unknown>[])
        } catch {
          reject(new Error('Failed to parse JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return { exportCsv, exportJson, importCsv, importJson }
}
