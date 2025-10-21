// Authentication utilities for SmartPOS
import { Context } from 'hono';

// User interface - Following detailed schema
export interface User {
  id: string; // TEXT PK according to detailed schema
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

// Get user from context
export const getUser = async (c: Context): Promise<User | null> => {
  try {
    const token = c.get('token');
    if (!token) {
      return null;
    }

    // In production, decode JWT token and get user from database
    // For now, return a mock user for development
    return {
      id: 'admin-1', // TEXT PK per detailed schema
      username: 'admin',
      email: 'admin@smartpos.com',
      full_name: 'Administrator',
      role: 'admin',
      is_active: true
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Verify JWT token
export const verifyToken = async (token: string): Promise<any> => {
  try {
    // In production, implement proper JWT verification
    // For now, return mock payload
    return {
      userId: 'admin-1', // TEXT per detailed schema
      username: 'admin',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Generate JWT token
export const generateToken = async (user: User): Promise => {
  try {
    // In production, implement proper JWT generation
    // For now, return a mock token
    return `mock_token_${user.id}_${Date.now()}`;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
};

// Hash password
export const hashPassword = async (password: string): Promise => {
  try {
    // In production, use proper password hashing (bcrypt, etc.)
    // For now, return a simple hash
    return `hashed_${password}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    // In production, use proper password verification
    // For now, simple comparison
    return `hashed_${password}` === hashedPassword;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

// Check user permissions
export const hasPermission = (user: User, permission: string): boolean => {
  try {
    // In production, implement proper permission checking
    // For now, admin has all permissions
    if (user.role === 'admin') {
      return true;
    }
    
    // Basic role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'manager': ['read', 'write', 'delete'],
      'employee': ['read', 'write'],
      'cashier': ['read']
    };
    
    return rolePermissions[user.role]?.includes(permission) || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Get user by ID
export const getUserById = async (c: Context, userId: number): Promise<User | null> => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT id, username, email, full_name, role, store_id, is_active
      FROM users 
      WHERE id = ? AND is_active = 1
    `).bind(userId).first();
    if (!result) {
      return null;
    }
    
    return result as User;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

// Get user by username
export const getUserByUsername = async (c: Context, username: string): Promise<User | null> => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT id, username, email, full_name, role, store_id, is_active
      FROM users 
      WHERE username = ? AND is_active = 1
    `).bind(username).first();
    if (!result) {
      return null;
    }
    
    return result as User;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};
