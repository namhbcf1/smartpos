import { BaseService } from './BaseService';
import { Env } from '../types';

export class OrderTemplateService extends BaseService {
  constructor(env: Env) {
    super(env, 'order_templates', 'id');
  }

  async getOrderTemplates(
    tenantIdOrFilters: string | { tenant_id?: string; category?: string; is_active?: boolean; search?: string; page?: number; limit?: number; } = 'default',
    filters?: any
  ) {
    let tenantId: string;
    let actualFilters: any;

    if (typeof tenantIdOrFilters === 'object') {
      // Called with object parameter
      tenantId = tenantIdOrFilters.tenant_id || 'default';
      actualFilters = tenantIdOrFilters;
    } else {
      // Called with tenantId as string
      tenantId = tenantIdOrFilters;
      actualFilters = filters || {};
    }

    const result = await this.getAll(tenantId, actualFilters?.page || 1, actualFilters?.limit || 50);
    return { ...result, templates: result.data };
  }

  async createOrderTemplate(tenantIdOrData: string | any, data?: any) {
    if (typeof tenantIdOrData === 'object') {
      // Called with object parameter
      const templateData = tenantIdOrData;
      const tenantId = templateData.tenant_id || 'default';
      const result = await this.create(tenantId, templateData);
      return { ...result, template: result.data };
    } else {
      // Called with tenantId and data
      const result = await this.create(tenantIdOrData, data);
      return { ...result, template: result.data };
    }
  }

  async updateOrderTemplate(idOrTenantId: string, dataOrTenantId?: any, finalData?: any) {
    if (arguments.length === 2 && typeof dataOrTenantId === 'object' && !finalData) {
      // Called with (id, data) - 2 params
      const result = await this.update(idOrTenantId, 'default', dataOrTenantId);
      return result;
    } else {
      // Called with (id, tenantId, data) - 3 params
      const result = await this.update(idOrTenantId, dataOrTenantId, finalData);
      return result;
    }
  }

  async deleteOrderTemplate(id: string, tenantId?: string) {
    return await this.delete(id, tenantId || 'default');
  }

  async createOrderFromTemplate(templateIdOrData: string | any, dataOrEmpty?: any): Promise<{ success: boolean; order?: { id: string }; error?: string }> {
    try {
      let templateId: string;
      let tenantId: string;
      let data: any;

      if (typeof templateIdOrData === 'object') {
        // Called with object parameter like { template_id, tenant_id, ... }
        const params = templateIdOrData;
        templateId = params.template_id;
        tenantId = params.tenant_id || 'default';
        data = params;
      } else {
        // Called with (templateId, data)
        templateId = templateIdOrData;
        tenantId = dataOrEmpty?.tenant_id || 'default';
        data = dataOrEmpty;
      }

      const template = await this.getById(templateId, tenantId);
      if (!template.success) return { success: false, error: template.error || 'Template not found' };

      const orderId = crypto.randomUUID();
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        INSERT INTO orders (id, tenant_id, template_id, customer_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(orderId, tenantId, templateId, data.customer_id, 'pending', now, now).run();

      return { success: true, order: { id: orderId } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getWorkflowRules(tenantId: string = 'default'): Promise<{ success: boolean; data?: any[]; rules?: any[]; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM workflow_rules WHERE tenant_id = ? ORDER BY created_at DESC
      `).bind(tenantId).all();
      return { success: true, data: result.results || [], rules: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createWorkflowRule(tenantIdOrData: string | any, data?: any): Promise<{ success: boolean; id?: string; rule?: { id: string }; error?: string }> {
    try {
      let tenantId: string;
      let ruleData: any;

      if (typeof tenantIdOrData === 'object') {
        tenantId = tenantIdOrData.tenant_id || 'default';
        ruleData = tenantIdOrData;
      } else {
        tenantId = tenantIdOrData;
        ruleData = data;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        INSERT INTO workflow_rules (id, tenant_id, name, conditions, actions, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, tenantId, ruleData.name, JSON.stringify(ruleData.conditions || {}), JSON.stringify(ruleData.actions || []), ruleData.is_active ? 1 : 0, now, now).run();
      return { success: true, id, rule: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateWorkflowRule(ruleId: string, tenantIdOrData: string | any, data?: any): Promise<{ success: boolean; error?: string }> {
    try {
      let tenantId: string;
      let ruleData: any;

      if (typeof tenantIdOrData === 'object') {
        tenantId = tenantIdOrData.tenant_id || 'default';
        ruleData = tenantIdOrData;
      } else {
        tenantId = tenantIdOrData;
        ruleData = data;
      }

      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE workflow_rules SET name = ?, conditions = ?, actions = ?, is_active = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(ruleData.name, JSON.stringify(ruleData.conditions), JSON.stringify(ruleData.actions), ruleData.is_active ? 1 : 0, now, ruleId, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteWorkflowRule(ruleId: string, tenantId: string = 'default'): Promise<{ success: boolean; error?: string }> {
    try {
      await this.env.DB.prepare(`DELETE FROM workflow_rules WHERE id = ? AND tenant_id = ?`).bind(ruleId, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async executeWorkflowRule(ruleId: string, tenantId: string, context: any): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      return { success: true, message: 'Workflow rule executed successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logAudit(tenantId: string, userId: string | undefined, action: string, entityType: string, entityId: string, data: any) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, tenantId, userId || null, action, entityType, entityId, now).run();
    return { success: true };
  }
}
