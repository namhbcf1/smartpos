/**
 * Advanced User Management API
 * Production-ready user management with role-based access control
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { UserManagementService } from '../services/UserManagementService';
import { RealTimeNotificationService } from '../services/RealTimeNotificationService';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateBody } from '../middleware/validation';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1).max(100),
  role_id: z.number().positive()
});

const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  full_name: z.string().min(1).max(100).optional(),
  role_id: z.number().positive().optional(),
  is_active: z.boolean().optional()
});

const UserFiltersSchema = z.object({
  role_id: z.number().optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

const NotificationPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  inventory_alerts: z.boolean().optional(),
  sales_alerts: z.boolean().optional(),
  system_alerts: z.boolean().optional(),
  low_stock_threshold: z.number().min(0).max(1000).optional()
});

// Apply authentication to all routes
app.use('*', authenticate);

/**
 * Get all users with filtering and pagination
 * GET /user-management/users
 */
app.get('/users', validateQuery(UserFiltersSchema), async (c) => {
  try {
    const filters = c.req.valid('query');
    const userService = new UserManagementService(c.env);
    
    const result = await userService.getUsers(filters);

    return c.json({
      success: true,
      data: result,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return c.json({
      success: false,
      message: 'Failed to get users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Create new user
 * POST /user-management/users
 */
app.post('/users', validateBody(CreateUserSchema), async (c) => {
  try {
    const userData = c.req.valid('json');
    const currentUser = c.get('user');
    
    // Check if current user has permission to create users
    const userService = new UserManagementService(c.env);
    const hasPermission = await userService.hasPermission(currentUser.id, 'users', 'create');
    
    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to create users'
      }, 403);
    }

    const newUser = await userService.createUser(userData);

    // Log activity
    await userService.logActivity({
      user_id: currentUser.id,
      action: 'create_user',
      resource: 'users',
      details: `Created user: ${newUser.username}`,
      ip_address: c.req.header('CF-Connecting-IP') || 'unknown',
      user_agent: c.req.header('User-Agent') || 'unknown'
    });

    // Send notification
    const notificationService = new RealTimeNotificationService(c.env);
    await notificationService.sendToUser(newUser.id, {
      type: 'info',
      category: 'user',
      title: 'Welcome to SmartPOS',
      message: `Your account has been created successfully. Username: ${newUser.username}`,
      is_persistent: true
    });

    return c.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get user by ID
 * GET /user-management/users/:id
 */
app.get('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    const userService = new UserManagementService(c.env);
    
    // Check if user can view this user (self or has permission)
    if (userId !== currentUser.id) {
      const hasPermission = await userService.hasPermission(currentUser.id, 'users', 'read');
      if (!hasPermission) {
        return c.json({
          success: false,
          message: 'Insufficient permissions to view user'
        }, 403);
      }
    }

    const user = await userService.getUserById(userId);
    
    if (!user) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return c.json({
      success: false,
      message: 'Failed to get user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Update user
 * PUT /user-management/users/:id
 */
app.put('/users/:id', validateBody(UpdateUserSchema), async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const updates = c.req.valid('json');
    const currentUser = c.get('user');
    
    const userService = new UserManagementService(c.env);
    
    // Check permissions
    if (userId !== currentUser.id) {
      const hasPermission = await userService.hasPermission(currentUser.id, 'users', 'update');
      if (!hasPermission) {
        return c.json({
          success: false,
          message: 'Insufficient permissions to update user'
        }, 403);
      }
    }

    const updatedUser = await userService.updateUser(userId, updates);

    // Log activity
    await userService.logActivity({
      user_id: currentUser.id,
      action: 'update_user',
      resource: 'users',
      details: `Updated user: ${updatedUser.username}`,
      ip_address: c.req.header('CF-Connecting-IP') || 'unknown',
      user_agent: c.req.header('User-Agent') || 'unknown'
    });

    return c.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get all roles
 * GET /user-management/roles
 */
app.get('/roles', async (c) => {
  try {
    const userService = new UserManagementService(c.env);
    const roles = await userService.getRoles();

    return c.json({
      success: true,
      data: roles,
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting roles:', error);
    return c.json({
      success: false,
      message: 'Failed to get roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get user activity history
 * GET /user-management/users/:id/activity
 */
app.get('/users/:id/activity', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const currentUser = c.get('user');
    
    const userService = new UserManagementService(c.env);
    
    // Check permissions
    if (userId !== currentUser.id) {
      const hasPermission = await userService.hasPermission(currentUser.id, 'users', 'read');
      if (!hasPermission) {
        return c.json({
          success: false,
          message: 'Insufficient permissions to view user activity'
        }, 403);
      }
    }

    const activities = await userService.getUserActivity(userId, limit);

    return c.json({
      success: true,
      data: activities,
      message: 'User activity retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user activity:', error);
    return c.json({
      success: false,
      message: 'Failed to get user activity',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get user notification preferences
 * GET /user-management/users/:id/preferences
 */
app.get('/users/:id/preferences', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    // Users can only access their own preferences
    if (userId !== currentUser.id) {
      return c.json({
        success: false,
        message: 'Can only access your own preferences'
      }, 403);
    }

    const notificationService = new RealTimeNotificationService(c.env);
    const preferences = await notificationService.getUserPreferences(userId);

    return c.json({
      success: true,
      data: preferences,
      message: 'Notification preferences retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return c.json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Update user notification preferences
 * PUT /user-management/users/:id/preferences
 */
app.put('/users/:id/preferences', validateBody(NotificationPreferencesSchema), async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const preferences = c.req.valid('json');
    const currentUser = c.get('user');
    
    // Users can only update their own preferences
    if (userId !== currentUser.id) {
      return c.json({
        success: false,
        message: 'Can only update your own preferences'
      }, 403);
    }

    const notificationService = new RealTimeNotificationService(c.env);
    await notificationService.updateUserPreferences(userId, preferences);

    return c.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return c.json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Initialize user management system
 * POST /user-management/init
 */
app.post('/init', async (c) => {
  try {
    const currentUser = c.get('user');
    const userService = new UserManagementService(c.env);
    
    // Check if user has system configuration permission
    const hasPermission = await userService.hasPermission(currentUser.id, 'system', 'configure');
    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to initialize system'
      }, 403);
    }

    await userService.initializeTables();
    
    const notificationService = new RealTimeNotificationService(c.env);
    await notificationService.initializeTables();

    return c.json({
      success: true,
      message: 'User management system initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing user management:', error);
    return c.json({
      success: false,
      message: 'Failed to initialize user management system',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
