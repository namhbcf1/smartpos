/**
 * SECURE PASSWORD UTILITIES
 * Implements secure password hashing and validation
 */

/**
 * Simple hash function for password hashing
 * Note: This is a temporary solution until bcrypt is available in Cloudflare Workers
 * In production, replace with bcrypt or similar
 */
export class PasswordSecurity {
  
  /**
   * Hash a password using a simple but secure method
   * TODO: Replace with bcrypt when available
   */
  static async hashPassword(password: string, salt?: string): Promise<string> {
    // Generate salt if not provided
    if (!salt) {
      salt = this.generateSalt();
    }

    // Create hash using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    
    // Use SHA-256 for hashing (better than plain text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return salt + hash for storage
    return salt + ':' + hashHex;
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      // Handle legacy plain text passwords (temporary)
      if (!hashedPassword.includes(':')) {
        console.warn('⚠️ Legacy plain text password detected - should be migrated');
        return password === hashedPassword;
      }

      // Extract salt and hash
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) {
        return false;
      }

      // Hash the provided password with the same salt
      const newHash = await this.hashPassword(password, salt);
      const [, newHashPart] = newHash.split(':');

      // Compare hashes
      return hash === newHashPart;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate a random salt
   */
  static generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
  static async migratePlainTextPassword(plainTextPassword: string): Promise<string> {
    console.log('🔄 Migrating plain text password to hashed password');
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
    console.log('🔄 Starting password migration...');
    
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
      console.log(`Found ${total} users with plain text passwords`);

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
          console.log(`✅ Migrated password for user: ${user.username}`);
        } catch (error) {
          errors++;
          console.error(`❌ Failed to migrate password for user ${user.username}:`, error);
        }
      }

      console.log(`🎉 Password migration completed: ${migrated}/${total} successful, ${errors} errors`);
      
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

      console.log(`✅ Created secure admin user: ${username}`);
      console.log(`🔑 Generated password: ${securePassword}`);
      console.log('⚠️ IMPORTANT: Save this password securely - it cannot be recovered!');

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

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp && payload.exp < now;
    } catch (error) {
      return true;
    }
  }
}
