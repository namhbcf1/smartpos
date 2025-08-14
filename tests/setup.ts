/**
 * Jest setup file for SmartPOS backend tests
 */

import { jest } from '@jest/globals';

// Mock Cloudflare Workers environment
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  subtle: {} as any
} as any;

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';

// Mock Cloudflare bindings
export const mockEnv = {
  ENVIRONMENT: 'test',
  API_VERSION: 'v1',
  JWT_SECRET: 'test-jwt-secret-32-characters-long',
  ENCRYPTION_KEY: 'test-encryption-key-32-chars-long',
  DB: {
    prepare: jest.fn().mockReturnValue({
      bind: jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue({ success: true }),
        first: jest.fn().mockResolvedValue(null),
        all: jest.fn().mockResolvedValue([])
      })
    }),
    exec: jest.fn().mockResolvedValue({ success: true })
  },
  CACHE: {
    get: jest.fn().mockResolvedValue(null),
    put: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined)
  },
  SESSIONS: {
    get: jest.fn().mockResolvedValue(null),
    put: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined)
  }
};

// Mock Hono context
export const mockContext = {
  env: mockEnv,
  req: {
    method: 'GET',
    url: 'http://localhost:8787/test',
    header: jest.fn().mockReturnValue('test-value'),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    raw: new Request('http://localhost:8787/test')
  },
  res: {
    status: 200
  },
  json: jest.fn().mockReturnValue(new Response()),
  text: jest.fn().mockReturnValue(new Response()),
  header: jest.fn(),
  get: jest.fn(),
  set: jest.fn()
};

// Test utilities
export const createMockRequest = (method: string = 'GET', url: string = '/test', body?: any) => {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'test-agent'
    },
    body: body ? JSON.stringify(body) : undefined
  });
};

export const createMockContext = (overrides: any = {}) => {
  return {
    ...mockContext,
    ...overrides
  };
};

// Database test utilities
export const createMockDatabase = () => {
  const queries: string[] = [];
  const bindings: any[][] = [];
  
  return {
    prepare: jest.fn().mockImplementation((query: string) => {
      queries.push(query);
      return {
        bind: jest.fn().mockImplementation((...args: any[]) => {
          bindings.push(args);
          return {
            run: jest.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
            first: jest.fn().mockResolvedValue(null),
            all: jest.fn().mockResolvedValue([])
          };
        })
      };
    }),
    exec: jest.fn().mockResolvedValue({ success: true }),
    getQueries: () => queries,
    getBindings: () => bindings,
    reset: () => {
      queries.length = 0;
      bindings.length = 0;
    }
  };
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);