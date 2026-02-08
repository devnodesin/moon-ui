/**
 * Validates and normalizes collection and field names to lowercase snake_case.
 * According to Moon API spec, collection and field names must be lowercase snake_case.
 */

/**
 * Converts a string to lowercase snake_case format
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/[\s-]+/g, '_') // spaces and hyphens to underscores
    .replace(/[^a-z0-9_]/gi, '') // remove invalid chars
    .toLowerCase()
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_|_$/g, ''); // trim underscores
}

/**
 * Validates that a name is in lowercase snake_case format
 */
export function isValidSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(str);
}

/**
 * Validates a collection or field name and returns error message if invalid
 */
export function validateName(name: string, type: 'collection' | 'field'): string | null {
  if (!name || name.trim().length === 0) {
    return `${type === 'collection' ? 'Collection' : 'Field'} name is required`;
  }

  const trimmed = name.trim();
  
  if (!isValidSnakeCase(trimmed)) {
    return `${type === 'collection' ? 'Collection' : 'Field'} name must be lowercase snake_case (e.g., "my_${type}")`;
  }

  if (trimmed.length > 64) {
    return `${type === 'collection' ? 'Collection' : 'Field'} name must be 64 characters or less`;
  }

  return null;
}
