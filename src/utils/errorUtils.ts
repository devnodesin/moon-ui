import type { AppError } from '../types/http';

/**
 * Extracts the user-facing error message from an AppError.
 * If the error has an "error" property from the backend API, use that.
 * Otherwise, fall back to the default message or a provided fallback.
 *
 * @param error - The caught error (typically AppError)
 * @param fallback - Optional fallback message if no error message is found
 * @returns The user-facing error message
 */
export function extractUserMessage(error: unknown, fallback?: string): string {
  // Check if error is AppError with backend error field
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof (error as AppError).error === 'string'
  ) {
    const errorMsg = (error as AppError).error.trim();
    if (errorMsg.length > 0) {
      return errorMsg;
    }
  }

  // Fall back to message field if available
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as AppError).message;
  }

  // Use provided fallback or generic message
  return fallback || 'An error occurred';
}
