export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidCollectionName(name: string): boolean {
  return /^[a-z][a-z0-9_]{1,62}$/.test(name)
}

export function isValidFieldName(name: string): boolean {
  return /^[a-z][a-z0-9_]{1,62}$/.test(name) && !['id', 'pkid'].includes(name)
}

export function isValidInteger(value: string): boolean {
  return /^-?\d+$/.test(value.trim())
}

export function isValidDecimal(value: string): boolean {
  return /^-?\d+(\.\d{1,10})?$/.test(value.trim())
}

export function isValidJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
