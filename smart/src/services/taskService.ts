/**
 * TaskService - Quản lý tasks theo chuẩn D1_COLUMNS.md
 * Sử dụng BaseService pattern với tenant_id support và Cloudflare integrations
 */

import { BaseService, ServiceResponse } from './BaseService';
import { Env } from '../types';

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  status: string; // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: string; // 'low' | 'medium' | 'high' | 'urgent'
type: string; // 'task' | 'subtask' | 'checklist'
  category?: string;
  assigned_to?: string;
  created_by: string;
  parent_task_id?: string;
  due_date?: string;
  completed_at?: string;
  tags?: string; // TEXT in D1 (JSON string)
  progress: number; // INTEGER in D1 (0-100)
  effort_hours?: number; // DECIMAL(15,2) in D1
  checklist_data?: string; // TEXT in D1 (JSON string)
  attachments?: string; // TEXT in D1 (JSON string)
  metadata?: string; // TEXT in D1 (JSON string)
  archived: number; // INTEGER in D1 (0/1)
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  assigned_to?: string;
  status?: string;
  priority?: string;
  category?: string;
  created_by?: string;
  parent_task_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  tenant_id?: string;
  page?: number;
  limit?: number;
}

export interface TaskClonationOptions {
  include_subtasks?: boolean;
  include_checklist?: boolean;
  include_attachments?: boolean;
  assign_to?: string;
  due_date_offset?: number; // days
}

export class TaskService extends BaseService {
  constructor(env: Env) {
    super(env, 'tasks', 'id');
  }

  // ===== CORE CRUD OPERATIONS =====

  /**
   * Lấy danh sách tasks với filters
   */
  async getTasks(filters: TaskFilters = {}): Promise<ServiceResponse> {
    try {
      const { page = 1, limit = 20, tenant_id = 'default', ...whereFilters } = filters;
      
      letwhere = this.addTenantFilter(whereFilters, tenant_id);

      // Handle search across multiple fields
      if (filters.search) {
        const searchQuery = `%${filters.search}%`;
        const searchConditions = [
          'title LIKE ?',
          'description LIKE ?'
        ];
        
        where = {
          ...where,
          _search: `(${searchConditions.join(' OR ')})`,
          _searchParams: [searchQuery, searchQuery]
        };
      }

      const pagination = this.createPaginationOptions(page, limit);

      return await this.findAll({
        where,
        orderBy: 'created_at',
        orderDirection: 'DESC',
        pagination
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Tạo task mới
   */
  async createTask(taskData: Partial<Task>): Promise<ServiceResponse> {
    try {
      if (!taskData.title) {
        return { success: false, error: 'Task title is required' };
      }

      const data = {
        ...taskData,
        tenant_id: taskData.tenant_id || 'default',
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        type: taskData.type || 'task',
        progress: taskData.progress || 0,
        archived: taskData.archived || 0,
        tags: typeof taskData.tags === 'object' 
          ? JSON.stringify(taskData.tags) 
          : taskData.tags || '[]',
        checklist_data: typeof taskData.checklist_data === 'object' 
          ? JSON.stringify(taskData.checklist_data) 
          : taskData.checklist_data || '[]',
        attachments: typeof taskData.attachments === 'object' 
          ? JSON.stringify(taskData.attachments) 
          : taskData.attachments || '[]',
        metadata: typeof taskData.metadata === 'object' 
          ? JSON.stringify(taskData.metadata) 
          : taskData.metadata || '{}'
      };

      return await this.create(data, { returnId: true });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cập nhật task
   */
  async updateTask(id: string, taskData: Partial<Task>): Promise<ServiceResponse> {
    try {
      const data = {
        ...taskData,
        tags: typeof taskData.tags === 'object' 
          ? JSON.stringify(taskData.tags) 
          : taskData.tags,
        checklist_data: typeof taskData.checklist_data === 'object' 
          ? JSON.stringify(taskData.checklist_data) 
          : taskData.checklist_data,
        attachments: typeof taskData.attachments === 'object' 
          ? JSON.stringify(taskData.attachments) 
          : taskData.attachments,
        metadata: typeof taskData.metadata === 'object' 
          ? JSON.stringify(taskData.metadata) 
          : taskData.metadata
      };

      // Auto-set completed_at when status changes to completed
      if (taskData.status === 'completed') {
        data.completed_at = new Date().toISOString();
      } else if (taskData.status && taskData.status !== 'completed') {
        data.completed_at = undefined; // Clear completed_at if status changes
      }

      return await this.update(id, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Xóa task
   */
  async deleteTask(id: string): Promise<ServiceResponse> {
    try {
      return await this.delete(id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== TASK RELATIONSHIPS =====

  /**
   * Lấy subtasks của task
   */
  async getSubtasks(parentTaskId: string, tenantId: string = 'default'): Promise<ServiceResponse> {
    try {
      return await this.findAll({
        where: {
          parent_task_id: parentTaskId,
          tenant_id: tenantId
        },
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Thêm subtask
   */
  async addSubtask(parentTaskId: string, subtaskData: Partial<Task>): Promise<ServiceResponse> {
    try {
      const subtask = {
        ...subtaskData,
        parent_task_id: parentTaskId,
        type: 'subtask',
        tenant_id: subtaskData.tenant_id || 'default'
      };

      return await this.createTask(subtask);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clone task với options
   */
  async cloneTask(taskId: string, options: TaskClonationOptions = {}, tenantId: string = 'default'): Promise<ServiceResponse> {
    try {
      const originalTask = await this.findById(taskId);
      if (!originalTask.success || !originalTask.data) {
        return originalTask;
      }

      const original = originalTask.data as Task;

      // Prepare clone data
      const cloneData: Partial<Task> = {
        title: `${original.title} (Copy)`,
        description: original.description,
        priority: original.priority,
        category: original.category,
        type: original.type,
        tags: original.tags,
        effort_hours: original.effort_hours,
        tenant_id: tenantId,
        created_by: options.assign_to || original.created_by
      };

      // Handle due date offset
      if (options.due_date_offset && original.due_date) {
        const originalDate = new Date(original.due_date);
        const newDate = new Date(originalDate.getTime() + options.due_date_offset * 24 * 60 * 60 * 1000);
        cloneData.due_date = newDate.toISOString();
      } else {
        cloneData.due_date = original.due_date;
      }

      // Clone attachments if requested
      if (options.include_attachments) {
        cloneData.attachments = original.attachments;
      }

      // Clone checklist if requested
      if (options.include_checklist) {
        cloneData.checklist_data = original.checklist_data;
      }

      // Create the clone
      const cloneResult = await this.createTask(cloneData);
      if (!cloneResult.success || !cloneResult.data) {
        return cloneResult;
      }

      const cloneId = cloneResult.data.id;

      // Clone subtasks if requested
      if (options.include_subtasks) {
        const subtasksResult = await this.getSubtasks(taskId, tenantId);
        if (subtasksResult.success && Array.isArray(subtasksResult.data)) {
          for (const subtask of subtasksResult.data) {
            await this.addSubtask(cloneId, {
              ...subtask,
              parent_task_id: cloneId,
              created_by: options.assign_to || subtask.created_by
            });
          }
        }
      }

      return {
        success: true,
        data: { 
          cloned_task_id: cloneId,
          original_task_id: taskId,
          subtasks_cloned: options.include_subtasks ? (await this.getSubtasks(cloneId, tenantId)).data?.length || 0 : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== TASK STATUS MANAGEMENT =====

  /**
   * Update task progress
   */
  async updateTaskProgress(id: string, progress: number): Promise<ServiceResponse> {
    try {
      if (progress < 0 || progress > 100) {
        return { success: false, error: 'Progress must be between 0 and 100' };
      }

      const data: Partial<Task> = { progress };

      // Auto-complete if progress is 100%
      if (progress === 100) {
        data.status = 'completed';
        data.completed_at = new Date().toISOString();
      } else if (progress > 0) {
        data.status = 'in_progress';
        data.completed_at = undefined;
      }

      return await this.update(id, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Archive task
   */
  async archiveTask(id: string): Promise<ServiceResponse> {
    try {
      return await this.update(id, { archived: 1 });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unarchive task
   */
  async unarchiveTask(id: string): Promise<ServiceResponse> {
    try {
      return await this.update(id, { archived: 0 });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== ANALYTICS =====

  /**
   * Lấy tasks analytics
   */
  async getTaskAnalytics(tenantId: string = 'default'): Promise<ServiceResponse> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks = ,
          COUNT(CASE WHEN archived = 1 THEN 1 END) as archived_tasks,
          COUNT(CASE WHEN parent_task_id IS NULL THEN 1 END) as main_tasks,
          COUNT(CASE WHEN parent_task_id IS NOT NULL THEN 1 END) as subtasks,
          AVG(progress) as avg_progress
        FROM tasks 
        WHERE tenant_id = ?
      `;

      const result = await this.env.DB.prepare(query).bind(tenantId).first();

      return {
        success: true,
        data: {
          total_tasks: Number(result?.total_tasks) || 0,
          completed_tasks: Number(result?.success_tasks) || 0,
          in_progress_tasks: Number(result?.in_progress_tasks) || 0,
          pending_tasks: Number(result?.pending_tasks) || 0,
          archived_tasks: Number(result?.archived_tasks) || 0,
          main_tasks: Number(result?.main_tasks) || 0,
          subtasks: Number(result?.subtasks) || 0,
          avg_progress: Number(result?.avg_progress) || 0,
          completion_rate: Number(result?.total_tasks) > 0 
            ? Number(((Number(result?.completed_tasks) / Number(result?.total_tasks)) * 100).toFixed(2)) 
            : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}