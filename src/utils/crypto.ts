import * as crypto from 'node:crypto';

/**
 * Generates a random salt for password hashing
 * @returns {string} A random hex string
 */
export function generateRandomSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hashes a password with the given salt using SHA-256
 * @param {string} password - The plain text password
 * @param {string} salt - The salt to use for hashing
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve) => {
    // Create a hash using SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    resolve(hash.digest('hex'));
  });
}

/**
 * Verifies a password against a stored hash and salt
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash from the database
 * @param {string} salt - The salt used for hashing
 * @returns {Promise<boolean>} True if the password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  const hashedPassword = await hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hashedPassword, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @param {string} key - The encryption key (must be 32 bytes)
 * @returns {string} The encrypted data as a hex string with IV and auth tag
 */
export function encrypt(text: string, key: string): string {
  // Create a unique initialization vector for each encryption
  const iv = crypto.randomBytes(16);
  
  // Create cipher with key and iv
  const cipher = crypto.createCipheriv(
    'aes-256-gcm', 
    Buffer.from(key), 
    iv
  );
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the auth tag (for integrity verification during decryption)
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return IV + encrypted data + auth tag
  // Format: iv:authTag:encryptedData
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

/**
 * Decrypts data that was encrypted using the encrypt function
 * @param {string} encryptedData - The encrypted data (format: iv:authTag:encryptedData)
 * @param {string} key - The encryption key (must be 32 bytes)
 * @returns {string} The decrypted text
 */
export function decrypt(encryptedData: string, key: string): string {
  // Split the encrypted data into IV, auth tag and encrypted content
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0] || '', 'hex');
  const authTag = Buffer.from(parts[1] || '', 'hex');
  const encryptedText = parts[2];
  
  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm', 
    Buffer.from(key), 
    iv
  );
  
  // Set auth tag for verification
  decipher.setAuthTag(authTag);
  
  // Decrypt the data
  let decrypted = decipher.update(encryptedText || '', 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generates a secure random token
 * @param {number} byteLength - The length of the token in bytes
 * @returns {string} A random token as a hex string
 */
export function generateToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
} 