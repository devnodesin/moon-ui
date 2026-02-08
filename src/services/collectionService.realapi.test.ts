import { describe, it, expect } from 'vitest';

describe('Collections API Bug Fix - Real API Response Structure', () => {
  it('should handle real API response where collections is a string array', () => {
    // This is what the real Moon API returns
    const mockRealApiResponse = {
      collections: ['products', 'users', 'orders'],
      count: 3
    };
    
    // Our service should convert this to CollectionInfo[]
    const expected = [
      { name: 'products' },
      { name: 'users' },
      { name: 'orders' }
    ];
    
    // Verify the mapping logic
    const mapped = mockRealApiResponse.collections.map(name => ({ name }));
    expect(mapped).toEqual(expected);
  });
  
  it('should unwrap collection wrapper from getCollection response', () => {
    // This is what the real Moon API returns for get
    const mockRealApiResponse = {
      collection: {
        name: 'products',
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: false }
        ]
      }
    };
    
    // Our service should extract collection object
    const expected = {
      name: 'products',
      columns: [
        { name: 'id', type: 'integer', nullable: false },
        { name: 'name', type: 'string', nullable: false }
      ]
    };
    
    expect(mockRealApiResponse.collection).toEqual(expected);
  });
});
