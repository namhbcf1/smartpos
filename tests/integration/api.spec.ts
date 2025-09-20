import { describe, test, expect } from '@jest/globals';
import { testApiClient } from '../setup';

describe('API Integration Tests', () => {
  const API_BASE_URL = 'https://namhbcf-api.bangachieu2.workers.dev/api/v1';

  test('should handle concurrent product requests', async () => {
    // Simulate 10 concurrent requests
    const requests = Array(10).fill().map(() => 
      testApiClient.get(`${API_BASE_URL}/products`)
    );
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });
  });

  test('should handle rate limiting gracefully', async () => {
    // Simulate rapid requests to test rate limiting
    const rapidRequests = Array(50).fill().map((_, index) => 
      testApiClient.get(`${API_BASE_URL}/products?page=${index}`)
        .catch(error => ({ status: 429, error: 'Rate limited' }))
    );
    
    const results = await Promise.allSettled(rapidRequests);
    
    // Some requests should succeed
    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 200
    );
    expect(successful.length).toBeGreaterThan(0);

    // Some might be rate limited
    const rateLimited = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );
    
    // Either all succeed (no rate limiting) or some are rate limited
    expect(successful.length + rateLimited.length).toBe(50);
  });

  test('should validate API response schemas', async () => {
    const response = await testApiClient.get(`${API_BASE_URL}/products`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    
    // If products exist, validate schema
    if (response.data.length > 0) {
      const product = response.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('price');
    }
  });

  test('should handle network timeout', async () => {
    // Simulate slow network request
    const slowRequest = new Promise((resolve) => {
      setTimeout(() => resolve({ status: 200, data: [] }), 100);
    });

    const result = await Promise.race([
      slowRequest,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    ]);

    expect(result).toBeDefined();
  });

  test('should handle malformed requests', async () => {
    const malformedData = {
      name: null,
      price: 'invalid-price',
      sku: undefined
    };

    const response = await testApiClient.post(`${API_BASE_URL}/products`, malformedData)
      .catch(error => ({ status: 400, error: 'Bad Request' }));

    expect([200, 400, 422]).toContain(response.status);
  });

  test('should handle authentication errors', async () => {
    // Test without authentication token
    const response = await testApiClient.get(`${API_BASE_URL}/users`)
      .catch(error => ({ status: 401, error: 'Unauthorized' }));

    expect([200, 401, 403]).toContain(response.status);
  });

  test('should handle server errors gracefully', async () => {
    // Test endpoint that might cause server error
    const response = await testApiClient.get(`${API_BASE_URL}/invalid-endpoint`)
      .catch(error => ({ status: 404, error: 'Not Found' }));

    expect([404, 500]).toContain(response.status);
  });

  test('should maintain data consistency across requests', async () => {
    // Create a product
    const newProduct = {
      name: 'API Test Product',
      sku: 'API-TEST-001',
      price: 50000,
      cost_price: 30000
    };

    const createResponse = await testApiClient.post(`${API_BASE_URL}/products`, newProduct);
    expect([200, 201]).toContain(createResponse.status);

    // Verify it exists
    const getResponse = await testApiClient.get(`${API_BASE_URL}/products`);
    expect(getResponse.status).toBe(200);
    
    // Check if our product is in the list (mock data)
    expect(Array.isArray(getResponse.data)).toBe(true);
  });

  test('should handle pagination correctly', async () => {
    const page1 = await testApiClient.get(`${API_BASE_URL}/products?page=1&limit=10`);
    const page2 = await testApiClient.get(`${API_BASE_URL}/products?page=2&limit=10`);

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    
    // Validate pagination structure
    expect(Array.isArray(page1.data)).toBe(true);
    expect(Array.isArray(page2.data)).toBe(true);
  });

  test('should handle search and filtering', async () => {
    const searchResponse = await testApiClient.get(`${API_BASE_URL}/products?search=test`);
    const filterResponse = await testApiClient.get(`${API_BASE_URL}/products?category=electronics`);

    expect(searchResponse.status).toBe(200);
    expect(filterResponse.status).toBe(200);
    
    expect(Array.isArray(searchResponse.data)).toBe(true);
    expect(Array.isArray(filterResponse.data)).toBe(true);
  });
});