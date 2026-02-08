import { describe, it, expect } from 'vitest';
import { toSnakeCase, isValidSnakeCase, validateName } from './validation';

describe('validation', () => {
  describe('toSnakeCase', () => {
    it('converts camelCase to snake_case', () => {
      expect(toSnakeCase('myFieldName')).toBe('my_field_name');
      expect(toSnakeCase('userId')).toBe('user_id');
    });

    it('converts spaces to underscores', () => {
      expect(toSnakeCase('my field name')).toBe('my_field_name');
      expect(toSnakeCase('user id')).toBe('user_id');
    });

    it('converts hyphens to underscores', () => {
      expect(toSnakeCase('my-field-name')).toBe('my_field_name');
    });

    it('removes invalid characters', () => {
      expect(toSnakeCase('my@field#name!')).toBe('myfieldname');
      expect(toSnakeCase('user$id%')).toBe('userid');
    });

    it('collapses multiple underscores', () => {
      expect(toSnakeCase('my___field___name')).toBe('my_field_name');
    });

    it('trims leading and trailing underscores', () => {
      expect(toSnakeCase('_my_field_')).toBe('my_field');
    });

    it('handles already snake_case strings', () => {
      expect(toSnakeCase('my_field_name')).toBe('my_field_name');
    });

    it('trims whitespace', () => {
      expect(toSnakeCase('  my field  ')).toBe('my_field');
    });
  });

  describe('isValidSnakeCase', () => {
    it('accepts valid snake_case', () => {
      expect(isValidSnakeCase('my_field_name')).toBe(true);
      expect(isValidSnakeCase('user_id')).toBe(true);
      expect(isValidSnakeCase('a')).toBe(true);
      expect(isValidSnakeCase('field123')).toBe(true);
    });

    it('rejects uppercase letters', () => {
      expect(isValidSnakeCase('MyField')).toBe(false);
      expect(isValidSnakeCase('my_Field')).toBe(false);
    });

    it('rejects spaces', () => {
      expect(isValidSnakeCase('my field')).toBe(false);
    });

    it('rejects hyphens', () => {
      expect(isValidSnakeCase('my-field')).toBe(false);
    });

    it('rejects special characters', () => {
      expect(isValidSnakeCase('my@field')).toBe(false);
      expect(isValidSnakeCase('my$field')).toBe(false);
    });

    it('rejects starting with underscore', () => {
      expect(isValidSnakeCase('_my_field')).toBe(false);
    });

    it('rejects starting with number', () => {
      expect(isValidSnakeCase('123field')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidSnakeCase('')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('accepts valid collection names', () => {
      expect(validateName('my_collection', 'collection')).toBeNull();
      expect(validateName('users', 'collection')).toBeNull();
      expect(validateName('product_items', 'collection')).toBeNull();
    });

    it('accepts valid field names', () => {
      expect(validateName('my_field', 'field')).toBeNull();
      expect(validateName('user_id', 'field')).toBeNull();
      expect(validateName('created_at', 'field')).toBeNull();
    });

    it('rejects empty names', () => {
      expect(validateName('', 'collection')).toBe('Collection name is required');
      expect(validateName('  ', 'field')).toBe('Field name is required');
    });

    it('rejects non-snake_case names', () => {
      expect(validateName('MyCollection', 'collection')).toContain('lowercase snake_case');
      expect(validateName('my-field', 'field')).toContain('lowercase snake_case');
      expect(validateName('my field', 'field')).toContain('lowercase snake_case');
    });

    it('rejects names longer than 64 characters', () => {
      const longName = 'a'.repeat(65);
      expect(validateName(longName, 'collection')).toContain('64 characters or less');
    });

    it('trims whitespace before validation', () => {
      expect(validateName('  my_collection  ', 'collection')).toBeNull();
    });
  });
});
