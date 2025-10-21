/**
 * SECURE PASSWORD UTILITIES
 * Implements secure password hashing and validation
 */
export class PasswordSecurity {
  /**
   * Hash a password using PBKDF2-HMAC-SHA256 with a random salt.
   * Storage format: v1$pbkdf2$sha256$ITERATIONS$SALT_B64$HASH_B64
   */
  static async hashPassword(password: string, saltBase64?: string, iterations: number = 210000): Promise {
    const encoder = new TextEncoder();
    const salt = saltBase64 ? PasswordSecurity.base64ToBytes(saltBase64) : PasswordSecurity.generateSaltBytes(16);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: salt as BufferSource,
        iterations
      },
      keyMaterial,
      256
    );

    const hashBytes = new Uint8Array(derivedBits);
    const saltB64 = PasswordSecurity.bytesToBase64(salt);
    const hashB64 = PasswordSecurity.bytesToBase64(hashBytes);
    return `v1$pbkdf2$sha256$${iterations}$${saltB64}$${hashB64}`;
  }

  /**
   * Verify password against a stored hash (supports legacy formats).
   */
  static async verifyPassword(password: string, stored: string): Promise<boolean> {
    try {
      // New format
      if (stored.startsWith('v1$pbkdf2$sha256$')) {
        const parts = stored.split('$');
        if (parts.length !== 6) return false;
        const iterations = parseInt(parts[3] || '100000', 10);
        const saltB64 = parts[4];
        const expectedHashB64 = parts[5];
        const recomputed = await this.hashPassword(password, saltB64, iterations);
        const actualHashB64 = recomputed.split('$')[5];
        return PasswordSecurity.timingSafeEqualBase64(actualHashB64 || '', expectedHashB64 || '');
      }

      // Legacy salt:hash (SHA-256) format
      if (stored.includes(':')) {
        const [salt, hashHex] = stored.split(':');
        if (!salt || !hashHex) return false;
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const newHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return PasswordSecurity.timingSafeEqualHex(newHex, hashHex);
      }

      // Very legacy plain text fallback (should be migrated)
      return password === stored;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  static generateSaltBytes(length: number = 16): Uint8Array {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }

  static bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] || 0);
    // btoa is available in Workers; fall back if needed
    return btoa(binary);
  }

  static base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  static timingSafeEqualBase64(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
  }

  static timingSafeEqualHex(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Contains uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Contains lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Contains number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Contains special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check for common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score
    };
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  /**
   * Migrate plain text password to hashed password
   */
  static async migratePlainTextPassword(plainTextPassword: string): Promise {
    return await this.hashPassword(plainTextPassword);
  }
}

/**
 * Database migration utility for password hashing
 */
export class PasswordMigration {
  
  /**
   * Migrate all plain text passwords in the database
   */
  static async migrateAllPasswords(db: any): Promise<{
    migrated: number;
    errors: number;
    total: number;
  }> {
    
    let migrated = 0;
    let errors = 0;
    let total = 0;

    try {
      // Get all users with plain text passwords (no colon in password_hash)
      const users = await db.prepare(`
        SELECT id, username, password_hash 
        FROM users 
        WHERE password_hash NOT LIKE '%:%'
      `).all();
      total = users.results?.length || 0;

      if (total === 0) {
        return { migrated: 0, errors: 0, total: 0 };
      }

      // Migrate each user
      for (const user of users.results || []) {
        try {
          const hashedPassword = await PasswordSecurity.hashPassword(user.password_hash);
          
          await db.prepare(`
            UPDATE users 
            SET password_hash = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(hashedPassword, user.id).run();
          migrated++;
        } catch (error) {
          errors++;
          console.error(`❌ Failed to migrate password for user ${user.username}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Password migration failed:', error);
      errors = total;
    }

    return { migrated, errors, total };
  }

  /**
   * Create a secure admin user with hashed password
   */
  static async createSecureAdminUser(db: any, username: string = 'admin'): Promise<{
    success: boolean;
    password?: string;
    error?: string;
  }> {
    try {
      // Check if admin user already exists
      const existingUser = await db.prepare(`
        SELECT id FROM users WHERE username = ?
      `).bind(username).first();
      if (existingUser) {
        return {
          success: false,
          error: 'Admin user already exists'
        };
      }

      // Generate secure password
      const securePassword = PasswordSecurity.generateSecurePassword(16);
      const hashedPassword = await PasswordSecurity.hashPassword(securePassword);

      // Create admin user
      await db.prepare(`
        INSERT INTO users (
          username, password_hash, full_name, email, role, is_active, store_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        username,
        hashedPassword,
        'System Administrator',
        'admin@smartpos.com',
        'admin',
        1,
        1
      ).run();
      return {
        success: true,
        password: securePassword
      };

    } catch (error) {
      console.error('❌ Failed to create secure admin user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  
  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate session token format
   */
  static validateSessionToken(token: string): boolean {
    // JWT tokens should have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Each part should be base64url encoded
    try {
      for (const part of parts) {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob((parts[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp && payload.exp < now;
    } catch (error) {
      return true;
    }
  }
}
