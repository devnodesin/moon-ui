import { describe, test, expect } from 'bun:test'

describe('Sample test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2)
  })

  test('should handle strings', () => {
    expect('Moon' + ' ' + 'Admin').toBe('Moon Admin')
  })
})
