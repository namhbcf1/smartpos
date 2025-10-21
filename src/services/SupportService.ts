import { BaseService } from './BaseService';
import { Env } from '../types';

export class SupportService extends BaseService {
  constructor(env: Env) {
    super(env, 'support_tickets', 'id');
  }

  async getTickets(tenantId: string, filters: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    return await this.getAll(tenantId, page, limit);
  }

  async getTicketById(id: string, tenantId: string) {
    const result = await this.getById(id, tenantId);
    return { ...result, ticket: result.data };
  }

  async createTicket(tenantId: string, data: any) {
    try {
      // Generate unique ticket number
      const ticketNumber = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Clean data - remove undefined values
      const cleanData: any = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          cleanData[key] = data[key];
        }
      });
      
      // Add required fields
      const ticketData = {
        ...cleanData,
        ticket_number: ticketNumber,
        created_by: cleanData.created_by || 'system'
      };
      
      const result = await this.create(tenantId, ticketData);
      return { ...result, ticket: result.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create support ticket' };
    }
  }

  async updateTicket(id: string, tenantId: string, data: any) {
    const result = await this.update(id, tenantId, data);
    return { ...result, ticket: result.data };
  }

  async deleteTicket(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }

  async addComment(ticketId: string, tenantId: string, userId: string, comment: string) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        INSERT INTO support_comments (id, ticket_id, tenant_id, user_id, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, ticketId, tenantId, userId, comment, now).run();
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTicketComments(ticketId: string, tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM support_comments WHERE ticket_id = ? AND tenant_id = ? ORDER BY created_at ASC
      `).bind(ticketId, tenantId).all();
      return { success: true, comments: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async assignTicket(ticketId: string, tenantId: string, assignedTo: string) {
    try {
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE support_tickets SET assigned_to = ?, updated_at = ? WHERE id = ? AND tenant_id = ?
      `).bind(assignedTo, now, ticketId, tenantId).run();
      const ticket = await this.getById(ticketId, tenantId);
      return { success: true, ticket: ticket.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async changeTicketStatus(ticketId: string, tenantId: string, status: string) {
    try {
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?
      `).bind(status, now, ticketId, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTicketAnalytics(tenantId: string) {
    try {
      const total = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM support_tickets WHERE tenant_id = ?
      `).bind(tenantId).first();

      const byStatus = await this.env.DB.prepare(`
        SELECT status, COUNT(*) as count FROM support_tickets WHERE tenant_id = ? GROUP BY status
      `).bind(tenantId).all();

      return {
        success: true,
        analytics: {
          total: total?.count || 0,
          by_status: byStatus.results || []
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async bulkDeleteTickets(ids: string[], tenantId: string) {
    try {
      let deletedCount = 0;
      for (const id of ids) {
        await this.delete(id, tenantId);
        deletedCount++;
      }
      return { success: true, deleted_count: deletedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async bulkUpdateTickets(ids: string[], tenantId: string, data: any) {
    try {
      let updatedCount = 0;
      for (const id of ids) {
        await this.update(id, tenantId, data);
        updatedCount++;
      }
      return { success: true, updated_count: updatedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportTickets(tenantId: string, format: string) {
    try {
      const tickets = await this.getAll(tenantId, 1, 10000);
      return { success: true, data: tickets.data, format };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async importTickets(tenantId: string, data: any[]) {
    try {
      let importedCount = 0;
      for (const ticket of data) {
        await this.create(tenantId, ticket);
        importedCount++;
      }
      return { success: true, imported_count: importedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
