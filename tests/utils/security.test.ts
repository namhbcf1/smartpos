import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SecurityError,
  getEnvVar,
  validateJWTSecret,
  validateEncryptionKey,
  generateSecureKey,
  sanitizeForLogging,
  RateLimiter,
  InputValidator
} from '../../src/utils/security';
import { mockEnv } from '../setup';

describe('Security Utilities', () => {
  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      const result = getEnvVar(mockEnv, 'JWT_SECRET');
      expect(result).toBe('test-jwt-secret-32-characters-long');
    });

    it('should throw error for missing required variable', () => {
      expect(() => getEnvVar(mockEnv, 'MISSING_VAR')).toThrow(SecurityError);
    });

    it('should return empty string for missing optional variable', () => {
      const result = getEnvVar(mockEnv, 'MISSING_VAR', false);
      expect(result).toBe('');
    });
  });

  describe('validateJWTSecret', () => {
    it('should validate strong JWT secret', () => {
      const strongSecret = 'very-strong-jwt-secret-with-32-characters';
      expect(() => validateJWTSecret(strongSecret)).not.toThrow();
    });

    it('should reject short JWT secret', () => {
      const shortSecret = 'short';
      expect(() => validateJWTSecret(shortSecret)).toThrow(SecurityError);
    });

    it('should reject weak patterns', () => {
      const weakSecrets = [
        'secret123456789012345678901234567890',
        'password123456789012345678901234567890',
        'test123456789012345678901234567890',
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      ];

      weakSecrets.forEach(secret => {
        expect(() => validateJWTSecret(secret)).toThrow(SecurityError);
      });
    });
  });

  describe('validateEncryptionKey', () => {
    it('should validate 32-character encryption key', () => {
      const validKey = '12345678901234567890123456789012';
      expect(() => validateEncryptionKey(validKey)).not.toThrow();
    });

    it('should reject wrong length keys', () => {
      const shortKey = 'short';
      const longKey = '123456789012345678901234567890123';
      
      expect(() => validateEncryptionKey(shortKey)).toThrow(SecurityError);
      expect(() => validateEncryptionKey(longKey)).toThrow(SecurityError);
    });
  });

  describe('generateSecureKey', () => {
    it('should generate key of specified length', () => {
      const key = generateSecureKey(32);
      expect(key).toHaveLength(32);
    });

    it('should generate different keys each time', () => {
      const key1 = generateSecureKey(32);
      const key2 = generateSecureKey(32);
      expect(key1).not.toBe(key2);
    });

    it('should contain only valid characters', () => {
      const key = generateSecureKey(32);
      const validChars = /^[A-Za-z0-9!@#$%^&*]+$/;
      expect(validChars.test(key)).toBe(true);
    });
  });

  describe('sanitizeForLogging', () => {
    it('should redact sensitive keys', () => {
      const data = {
        username: 'testuser',
        password: 'secret123',
        token: 'jwt-token',
        publicData: 'safe'
      };

      const sanitized = sanitizeForLogging(data);
      
      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.publicData).toBe('safe');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'test',
          password: 'secret'
        },
        auth: {
          token: 'jwt-token'
        }
      };

      const sanitized = sanitizeForLogging(data);
      
      expect(sanitized.user.name).toBe('test');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.auth.token).toBe('[REDACTED]');
    });

    it('should handle non-object inputs', () => {
      expect(sanitizeForLogging('string')).toBe('string');
      expect(sanitizeForLogging(123)).toBe(123);
      expect(sanitizeForLogging(null)).toBe(null);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      // Use up the limit
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      // Should be blocked now
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should track different identifiers separately', () => {
      // Use up limit for user1
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      // user2 should still be allowed
      expect(rateLimiter.isAllowed('user2')).toBe(true);
    });

    it('should reset identifier', () => {
      // Use up limit
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      // Reset and try again
      rateLimiter.reset('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });
  });

  describe('InputValidator', () => {
    describe('sanitizeString', () => {
      it('should remove control characters', () => {
        const input = 'test\x00\x01string';
        const result = InputValidator.sanitizeString(input);
        expect(result).toBe('teststring');
      });

      it('should trim whitespace', () => {
        const input = '  test string  ';
        const result = InputValidator.sanitizeString(input);
        expect(result).toBe('test string');
      });

      it('should limit length', () => {
        const input = 'a'.repeat(2000);
        const result = InputValidator.sanitizeString(input, 100);
        expect(result).toHaveLength(100);
      });

      it('should throw error for non-string input', () => {
        expect(() => InputValidator.sanitizeString(123 as any)).toThrow(SecurityError);
      });
    });

    describe('validateEmail', () => {
      it('should validate correct email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        validEmails.forEach(email => {
          expect(InputValidator.validateEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user@domain',
          'user name@domain.com'
        ];

        invalidEmails.forEach(email => {
          expect(InputValidator.validateEmail(email)).toBe(false);
        });
      });
    });

    describe('validatePhone', () => {
      it('should validate Vietnamese phone numbers', () => {
        const validPhones = [
          '0901234567',
          '+84901234567',
          '84901234567',
          '0123456789'
        ];

        validPhones.forEach(phone => {
          expect(InputValidator.validatePhone(phone)).toBe(true);
        });
      });

      it('should reject invalid phone numbers', () => {
        const invalidPhones = [
          '123',
          '0000000000',
          '+1234567890',
          'not-a-phone'
        ];

        invalidPhones.forEach(phone => {
          expect(InputValidator.validatePhone(phone)).toBe(false);
        });
      });
    });

    describe('validatePassword', () => {
      it('should validate strong passwords', () => {
        const strongPassword = 'StrongPass123!';
        const result = InputValidator.validatePassword(strongPassword);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject weak passwords', () => {
        const weakPassword = 'weak';
        const result = InputValidator.validatePassword(weakPassword);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should provide specific error messages', () => {
        const result = InputValidator.validatePassword('short');
        
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors).toContain('Password must contain at least one special character');
      });
    });
  });
});