import { Env } from '../types';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string;
  is_active: boolean;
  created_at: string;
}

export class RoleService_UsersManagementtsx {
  constructor(private env: Env) {}

  async getRoles() {
    try {
      const roles = await this.env.DB.prepare(`
        SELECT * FROM roles WHERE is_active = 1
        ORDER BY name
      `).all();

      return {
        success: true,
        roles: (roles.results || []).map((role: any) => ({
          ...role,
          permissions: JSON.parse(role.permissions || '[]')
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải vai trò' };
    }
  }

  async getRoleById(id: string) {
    try {
      const role = await this.env.DB.prepare(`
        SELECT * FROM roles WHERE id = ?
      `).bind(id).first();

      if (!role) {
        return { success: false, error: 'Không tìm thấy vai trò' };
      }

      return {
        success: true,
        role: {
          ...role,
          permissions: JSON.parse((role as any).permissions || '[]')
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải vai trò' };
    }
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
  }) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO roles (id, name, description, permissions, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
      `).bind(
        id,
        data.name,
        data.description || null,
        JSON.stringify(data.permissions || []),
        now
      ).run();

      return this.getRoleById(id);
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tạo vai trò' };
    }
  }

  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
    is_active?: boolean;
  }) {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
      if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
      if (data.permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(data.permissions)); }
      if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

      if (fields.length === 0) {
        return { success: false, error: 'Không có dữ liệu để cập nhật' };
      }

      values.push(id);

      await this.env.DB.prepare(`
        UPDATE roles SET ${fields.join(', ')}
        WHERE id = ?
      `).bind(...values).run();

      return this.getRoleById(id);
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi cập nhật vai trò' };
    }
  }

  async deleteRole(id: string) {
    try {
      const result = await this.env.DB.prepare(`
        UPDATE roles SET is_active = 0 WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return { success: false, error: 'Không tìm thấy vai trò' };
      }

      return { success: true, message: 'Đã xóa vai trò' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi xóa vai trò' };
    }
  }

  async assignRoleToUser(userId: string, roleId: string) {
    try {
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO user_roles (user_id, role_id, assigned_at)
        VALUES (?, ?, ?)
      `).bind(userId, roleId, now).run();

      return { success: true, message: 'Đã gán vai trò cho người dùng' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi gán vai trò' };
    }
  }

  async getUserRoles(userId: string) {
    try {
      const roles = await this.env.DB.prepare(`
        SELECT r.* FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ? AND r.is_active = 1
      `).bind(userId).all();

      return {
        success: true,
        roles: (roles.results || []).map((role: any) => ({
          ...role,
          permissions: JSON.parse(role.permissions || '[]')
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải vai trò của người dùng' };
    }
  }
}
