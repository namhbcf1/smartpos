import { describe, test, expect, jest } from '@jest/globals';

describe('Network Error Handling Tests', () => {
  
  test('should retry failed requests with exponential backoff', async () => {
    let attemptCount = 0;
    const mockFetch = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Network timeout'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], success: true })
      });
    });

    global.fetch = mockFetch;

    const result = await apiWithRetry('/products', { 
      retries: 3, 
      baseDelay: 100 
    });
    
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.data).toEqual([]);
    expect(result.success).toBe(true);
  });

  test('should fail after maximum retry attempts', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Persistent network error'));
    global.fetch = mockFetch;

    await expect(
      apiWithRetry('/products', { retries: 2, baseDelay: 10 })
    ).rejects.toThrow('Persistent network error');
    
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  test('should handle offline mode gracefully', async () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    // Mock offline storage
    const offlineStorage = new Map();
    
    await expect(
      apiCallWithOfflineSupport('/products', offlineStorage)
    ).rejects.toThrow('No internet connection. Data will be synced when online.');
  });

  test('should queue requests when offline and process when online', async () => {
    const requestQueue: any[] = [];
    
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    // Queue requests while offline
    queueOfflineRequest('/products/create', { name: 'Test Product' }, requestQueue);
    queueOfflineRequest('/products/update/1', { name: 'Updated Product' }, requestQueue);
    
    expect(requestQueue).toHaveLength(2);

    // Simulate coming online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    global.fetch = mockFetch;

    // Process queued requests
    const results = await processOfflineQueue(requestQueue);
    
    expect(results.processed).toBe(2);
    expect(results.failed).toBe(0);
    expect(requestQueue).toHaveLength(0); // Queue should be empty
  });

  test('should handle connection timeout', async () => {
    const slowResponse = new Promise(resolve => 
      setTimeout(() => resolve({ 
        ok: true, 
        json: () => Promise.resolve({ data: [] }) 
      }), 5000)
    );

    const mockFetch = jest.fn().mockReturnValue(slowResponse);
    global.fetch = mockFetch;

    await expect(
      apiWithTimeout('/products', 2000) // 2 second timeout
    ).rejects.toThrow('Request timeout');
  });

  test('should handle server errors with appropriate messages', async () => {
    const serverErrors = [
      { status: 500, message: 'Internal Server Error' },
      { status: 502, message: 'Bad Gateway' },
      { status: 503, message: 'Service Unavailable' },
      { status: 504, message: 'Gateway Timeout' }
    ];

    for (const error of serverErrors) {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: error.status,
        statusText: error.message,
        json: () => Promise.resolve({ error: error.message })
      });
      global.fetch = mockFetch;

      await expect(
        handleApiResponse('/test-endpoint')
      ).rejects.toThrow(error.message);
    }
  });

  test('should handle rate limiting with appropriate delays', async () => {
    let callCount = 0;
    const mockFetch = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 3) {
        return Promise.resolve({
          ok: false,
          status: 429,
          headers: new Map([['Retry-After', '2']]),
          json: () => Promise.resolve({ error: 'Rate limited' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
      });
    });
    global.fetch = mockFetch;

    const startTime = Date.now();
    const result = await apiWithRateLimit('/products');
    const endTime = Date.now();

    expect(result.data).toBe('success');
    expect(endTime - startTime).toBeGreaterThanOrEqual(6000); // 3 * 2 seconds delay
  });

  test('should handle malformed JSON responses', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token'))
    });
    global.fetch = mockFetch;

    await expect(
      apiCallWithJsonValidation('/products')
    ).rejects.toThrow('Invalid JSON response from server');
  });

  test('should handle CORS errors', async () => {
    const mockFetch = jest.fn().mockRejectedValue(
      new TypeError('Failed to fetch')
    );
    global.fetch = mockFetch;

    await expect(
      apiCallWithCorsHandling('/products')
    ).rejects.toThrow('Network error - please check your connection or contact support');
  });

  test('should implement circuit breaker pattern', async () => {
    const circuitBreaker = new CircuitBreaker(3, 5000); // 3 failures, 5 second timeout
    
    // Mock 3 failures
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockRejectedValueOnce(new Error('Service error'))
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 'success' }) });
    
    global.fetch = mockFetch;

    // First 3 calls should fail and trip the circuit
    await expect(apiWithCircuitBreaker('/test', circuitBreaker)).rejects.toThrow();
    await expect(apiWithCircuitBreaker('/test', circuitBreaker)).rejects.toThrow();
    await expect(apiWithCircuitBreaker('/test', circuitBreaker)).rejects.toThrow();

    // Circuit should now be open - immediate failure
    await expect(apiWithCircuitBreaker('/test', circuitBreaker)).rejects.toThrow('Circuit breaker is open');
    
    expect(circuitBreaker.isOpen()).toBe(true);
  });
});

// Mock implementation functions
async function apiWithRetry(url: string, options: any = {}) {
  const { retries = 3, baseDelay = 1000 } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function apiCallWithOfflineSupport(url: string, offlineStorage: Map<string, any>) {
  if (!navigator.onLine) {
    throw new Error('No internet connection. Data will be synced when online.');
  }
  
  const response = await fetch(url);
  return response.json();
}

function queueOfflineRequest(url: string, data: any, queue: any[]) {
  queue.push({ url, data, timestamp: Date.now() });
}

async function processOfflineQueue(queue: any[]) {
  let processed = 0;
  let failed = 0;

  while (queue.length > 0) {
    const request = queue.shift();
    try {
      await fetch(request.url, {
        method: 'POST',
        body: JSON.stringify(request.data),
        headers: { 'Content-Type': 'application/json' }
      });
      processed++;
    } catch (error) {
      failed++;
      queue.push(request); // Re-queue failed requests
      break; // Stop processing on failure
    }
  }

  return { processed, failed };
}

async function apiWithTimeout(url: string, timeout: number) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

async function handleApiResponse(url: string) {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || response.statusText);
  }
  
  return response.json();
}

async function apiWithRateLimit(url: string) {
  let delay = 0;
  
  while (true) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
    
    const response = await fetch(url);
    
    if (response.status === 429) {
      delay = parseInt(response.headers.get('Retry-After') || '1');
      continue;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
}

async function apiCallWithJsonValidation(url: string) {
  const response = await fetch(url);
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from server');
  }
}

async function apiCallWithCorsHandling(url: string) {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error - please check your connection or contact support');
    }
    throw error;
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number,
    private timeout: number
  ) {}

  async execute(fn: () => Promise<any>) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  isOpen() {
    return this.state === 'open';
  }
}

async function apiWithCircuitBreaker(url: string, circuitBreaker: CircuitBreaker) {
  return circuitBreaker.execute(async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
}