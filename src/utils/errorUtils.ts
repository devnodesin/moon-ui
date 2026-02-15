import type { AppError } from '../types/http';

/**
 * Extracts the user-facing error message from an AppError.
 * If the error has an "error" property from the backend API, use that.
 * Otherwise, fall back to the default message or a provided fallback.
 *
 * Format: If both code and error are available, return "{code} - {error}"
 *         Otherwise return just the error message or fallback
 *
 * @param error - The caught error (typically AppError)
 * @param fallback - Optional fallback message if no error message is found
 * @returns The user-facing error message
 */
export function extractUserMessage(error: unknown, fallback?: string): string {
  // Check if error is AppError with backend error field
  if (error && typeof error === 'object') {
    const appError = error as AppError;
    const code = appError.code;
    const errorMsg = appError.error;
    
    // If we have both code and error message, format as "{code} - {error}"
    if (code && errorMsg && typeof errorMsg === 'string' && errorMsg.trim().length > 0) {
      // Extract numeric code if it's in HTTP_XXX format
      const numericCode = typeof code === 'string' && code.startsWith('HTTP_') 
        ? code.replace('HTTP_', '') 
        : code;
      return `${numericCode} - ${errorMsg.trim()}`;
    }
    
    // If we only have error message, return it
    if (errorMsg && typeof errorMsg === 'string' && errorMsg.trim().length > 0) {
      return errorMsg.trim();
    }
    
    // Fall back to message field if available
    if ('message' in appError && typeof appError.message === 'string') {
      return appError.message;
    }
  }

  // Use provided fallback or generic message
  return fallback || 'An error occurred';
}
