import { describe, it, expect } from 'vitest';
import { extractUserMessage } from './errorUtils';
import type { AppError } from '../types/http';

describe('extractUserMessage', () => {
  it('should extract error field from AppError when present', () => {
    const error: AppError = {
      code: 'INVALID_EMAIL',
      message: 'Bad request',
      error: 'invalid email format',
    };

    expect(extractUserMessage(error)).toBe('INVALID_EMAIL - invalid email format');
  });

  it('should extract error field even with different code', () => {
    const error: AppError = {
      code: '400',
      message: 'Request failed',
      error: 'Username already exists',
    };

    expect(extractUserMessage(error)).toBe('400 - Username already exists');
  });

  it('should fall back to message when error field is missing', () => {
    const error: AppError = {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
    };

    expect(extractUserMessage(error)).toBe('Network request failed');
  });

  it('should fall back to message when error field is empty string', () => {
    const error: AppError = {
      code: 'INVALID_REQUEST',
      message: 'Something went wrong',
      error: '',
    };

    expect(extractUserMessage(error)).toBe('Something went wrong');
  });

  it('should use custom fallback when error has no message or error field', () => {
    const error = {
      code: 'UNKNOWN',
    };

    expect(extractUserMessage(error, 'Custom fallback message')).toBe('Custom fallback message');
  });

  it('should use default fallback when no error or message fields present', () => {
    const error = {
      code: 'UNKNOWN',
    };

    expect(extractUserMessage(error)).toBe('An error occurred');
  });

  it('should handle non-object errors', () => {
    expect(extractUserMessage('string error')).toBe('An error occurred');
    expect(extractUserMessage(null)).toBe('An error occurred');
    expect(extractUserMessage(undefined)).toBe('An error occurred');
    expect(extractUserMessage(123)).toBe('An error occurred');
  });

  it('should handle Error instances', () => {
    const error = new Error('Standard error message');
    expect(extractUserMessage(error)).toBe('Standard error message');
  });

  it('should prioritize error field over message field', () => {
    const error: AppError = {
      code: 'VALIDATION_ERROR',
      message: 'Generic validation error',
      error: 'Email must be a valid email address',
    };

    expect(extractUserMessage(error)).toBe('VALIDATION_ERROR - Email must be a valid email address');
  });

  it('should handle complex error scenarios from real API', () => {
    const error: AppError = {
      code: 'INVALID_EMAIL_FORMAT',
      message: 'Bad request',
      error: 'invalid email format',
      details: {
        code: 400,
        error: 'invalid email format',
        error_code: 'INVALID_EMAIL_FORMAT',
      },
    };

    expect(extractUserMessage(error)).toBe('INVALID_EMAIL_FORMAT - invalid email format');
  });

  it('should use fallback parameter when provided and no error fields exist', () => {
    const error = {};
    expect(extractUserMessage(error, 'Failed to load data')).toBe('Failed to load data');
  });

  it('should handle error field with whitespace', () => {
    const error: AppError = {
      code: 'INVALID_INPUT',
      message: 'Input validation failed',
      error: '   ',
    };

    expect(extractUserMessage(error)).toBe('Input validation failed');
  });
});
