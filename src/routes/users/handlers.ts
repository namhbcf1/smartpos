import { Context } from 'hono';
import { Env } from '../../types';
import { UserService } from './service';
import { UserQueryParams, UserCreateData, UserUpdateData, UserResponse } from './types';
import { getUser } from '../../middleware/auth';

export class UserHandlers {
  private service: UserService;

  constructor(env: Env) {
    this.service = new UserService(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.service.initialize();
  }

  // GET /users - Get all users with filtering and pagination
  async getUsers(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const query = c.req.query();
      const params: any = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        search: query.search,
        role: query.role as any,
        store_id: query.store_id ? parseInt(query.store_id) : undefined,
        is_active: query.is_active ? query.is_active === 'true' : undefined,
        sort_by: query.sort_by as any || 'created_at',
        sort_order: query.sort_order as 'asc' | 'desc' || 'desc'
      };

      const result = await this.service.getUsers(params);

      const response: UserResponse = {
        success: true,
        data: result.users,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: result.total,
          pages: Math.ceil(result.total / (params.limit || 20))
        },
        stats: result.stats
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getUsers handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get users'
      }, 500);
    }
  }

  // GET /users/:id - Get user by ID
  async getUserById(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid user ID'
        }, 400);
      }

      const user = await this.service.getUserById(id);
      if (!user) {
        return c.json({
          success: false,
          message: 'User not found'
        }, 404);
      }

      const response: UserResponse = {
        success: true,
        data: user
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getUserById handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user'
      }, 500);
    }
  }

  // GET /users/username/:username - Get user by username
  async getUserByUsername(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const username = c.req.param('username');
      if (!username) {
        return c.json({
          success: false,
          message: 'Username is required'
        }, 400);
      }

      const user = await this.service.getUserByUsername(username);
      if (!user) {
        return c.json({
          success: false,
          message: 'User not found'
        }, 404);
      }

      const response: UserResponse = {
        success: true,
        data: user
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getUserByUsername handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user'
      }, 500);
    }
  }

  // GET /users/employee/:employeeId - Get user by employee ID
  async getUserByEmployeeId(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const employeeId = parseInt(c.req.param('employeeId'));
      if (isNaN(employeeId)) {
        return c.json({
          success: false,
          message: 'Invalid employee ID'
        }, 400);
      }

      const user = await this.service.getUserByEmployeeId(employeeId);
      if (!user) {
        return c.json({
          success: false,
          message: 'User not found for this employee'
        }, 404);
      }

      const response: UserResponse = {
        success: true,
        data: user
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getUserByEmployeeId handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user'
      }, 500);
    }
  }

  // POST /users - Create new user
  async createUser(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const data = await c.req.json<UserCreateData>();
      
      // Basic validation
      if (!data.username || !data.email || !data.password || !data.full_name || !data.role) {
        return c.json({
          success: false,
          message: 'Missing required fields: username, email, password, full_name, role'
        }, 400);
      }

      // Validate role
      const validRoles = ['admin', 'manager', 'cashier', 'staff', 'sales_agent', 'affiliate', 'inventory'];
      if (!validRoles.includes(data.role)) {
        return c.json({
          success: false,
          message: 'Invalid role. Must be one of: admin, manager, cashier, staff, sales_agent, affiliate, inventory'
        }, 400);
      }

      // Only admins can create admin users
      if (data.role === 'admin' && currentUser.role !== 'admin') {
        return c.json({
          success: false,
          message: 'Only administrators can create admin users'
        }, 403);
      }

      const user = await this.service.createUser(data, currentUser.id);

      const response: UserResponse = {
        success: true,
        data: user,
        message: 'User created successfully'
      };

      return c.json(response, 201);
    } catch (error) {
      console.error('Error in createUser handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user'
      }, 500);
    }
  }

  // PUT /users/:id - Update user
  async updateUser(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid user ID'
        }, 400);
      }

      // Users can only update themselves unless they're admin/manager
      if (id !== currentUser.id && !['admin', 'manager'].includes(currentUser.role)) {
        return c.json({
          success: false,
          message: 'Insufficient permissions'
        }, 403);
      }

      const data = await c.req.json<UserUpdateData>();

      // Validate role change permissions
      if (data.role) {
        const validRoles = ['admin', 'manager', 'cashier', 'staff', 'sales_agent', 'affiliate', 'inventory'];
        if (!validRoles.includes(data.role)) {
          return c.json({
            success: false,
            message: 'Invalid role'
          }, 400);
        }

        // Only admins can change roles to/from admin
        if ((data.role === 'admin' || currentUser.role === 'admin') && currentUser.role !== 'admin') {
          return c.json({
            success: false,
            message: 'Only administrators can manage admin roles'
          }, 403);
        }
      }

      const user = await this.service.updateUser(id, data, currentUser.id);

      const response: UserResponse = {
        success: true,
        data: user,
        message: 'User updated successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in updateUser handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      }, 500);
    }
  }

  // DELETE /users/:id - Delete user
  async deleteUser(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid user ID'
        }, 400);
      }

      // Users cannot delete themselves
      if (id === currentUser.id) {
        return c.json({
          success: false,
          message: 'Cannot delete your own account'
        }, 400);
      }

      await this.service.deleteUser(id, currentUser.id);

      const response: UserResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in deleteUser handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      }, 500);
    }
  }

  // GET /users/stats - Get user statistics
  async getStats(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const stats = await this.service.getStats();

      const response: UserResponse = {
        success: true,
        stats
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getStats handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get statistics'
      }, 500);
    }
  }

  // GET /users/me - Get current user profile
  async getCurrentUser(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const user = await this.service.getUserById(currentUser.id);
      if (!user) {
        return c.json({
          success: false,
          message: 'User not found'
        }, 404);
      }

      const response: UserResponse = {
        success: true,
        data: user
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getCurrentUser handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get current user'
      }, 500);
    }
  }

  // PUT /users/me - Update current user profile
  async updateCurrentUser(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const currentUser = getUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const data = await c.req.json<UserUpdateData>();
      
      // Users cannot change their own role
      delete data.role;
      delete data.is_active;

      const user = await this.service.updateUser(currentUser.id, data, currentUser.id);

      const response: UserResponse = {
        success: true,
        data: user,
        message: 'Profile updated successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in updateCurrentUser handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile'
      }, 500);
    }
  }
}
