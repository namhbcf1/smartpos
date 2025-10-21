import { api } from './api';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: 'general' | 'technical' | 'billing' | 'feature' | 'bug';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  assigned_to?: string;
  customer_id?: string;
  tags?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: 'general' | 'technical' | 'billing' | 'feature' | 'bug';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  assigned_to?: string;
  customer_id?: string;
  tags?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  category?: 'general' | 'technical' | 'billing' | 'feature' | 'bug';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  assigned_to?: string;
  customer_id?: string;
  tags?: string;
}

export interface TicketFilters {
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'general' | 'technical' | 'billing' | 'feature' | 'bug';
  search?: string;
  sortBy?: 'created_at' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  resolutionRate: number;
  averageResolutionTime: number;
  ticketsByStatus: Array<{
    status: string;
    count: number;
  }>;
  ticketsByPriority: Array<{
    priority: string;
    count: number;
  }>;
  ticketsByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentTickets: SupportTicket[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  author_name: string;
  is_internal: boolean;
  created_at: string;
}

export const supportAPI = {
  // Get all tickets with pagination and filtering
  getTickets: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    filters?: TicketFilters
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/support/tickets?${params.toString()}`);
    return response.data;
  },

  // Get ticket by ID
  getTicket: async (id: string) => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },

  // Create new ticket
  createTicket: async (data: CreateTicketRequest) => {
    const response = await api.post('/support/tickets', data);
    return response.data;
  },

  // Update ticket
  updateTicket: async (id: string, data: UpdateTicketRequest) => {
    const response = await api.put(`/support/tickets/${id}`, data);
    return response.data;
  },

  // Delete ticket
  deleteTicket: async (id: string) => {
    const response = await api.delete(`/support/tickets/${id}`);
    return response.data;
  },

  // Get ticket analytics
  getTicketAnalytics: async () => {
    const response = await api.get('/support/tickets/analytics');
    return response.data;
  },

  // Add comment to ticket
  addComment: async (ticketId: string, content: string, isInternal: boolean = false) => {
    const response = await api.post(`/support/tickets/${ticketId}/comments`, {
      content,
      is_internal: isInternal
    });
    return response.data;
  },

  // Get ticket comments
  getTicketComments: async (ticketId: string) => {
    const response = await api.get(`/support/tickets/${ticketId}/comments`);
    return response.data;
  },

  // Assign ticket
  assignTicket: async (ticketId: string, userId: string) => {
    const response = await api.post(`/support/tickets/${ticketId}/assign`, {
      assigned_to: userId
    });
    return response.data;
  },

  // Change ticket status
  changeTicketStatus: async (ticketId: string, status: string) => {
    const response = await api.post(`/support/tickets/${ticketId}/status`, {
      status
    });
    return response.data;
  },

  // Bulk operations
  bulkDeleteTickets: async (ids: string[]) => {
    const response = await api.delete('/support/tickets/bulk', { data: { ids } });
    return response.data;
  },

  bulkUpdateTickets: async (ids: string[], data: Partial<UpdateTicketRequest>) => {
    const response = await api.put('/support/tickets/bulk', { ids, data });
    return response.data;
  },

  // Export tickets
  exportTickets: async (format: 'csv' | 'excel' = 'csv') => {
    const response = await api.get(`/support/tickets/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import tickets
  importTickets: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/support/tickets/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get knowledge base articles
  getKnowledgeBase: async (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await api.get(`/support/knowledge-base?${params.toString()}`);
    return response.data;
  },

  // Create knowledge base article
  createKnowledgeBaseArticle: async (data: {
    title: string;
    content: string;
    category: string;
    tags?: string;
  }) => {
    const response = await api.post('/support/knowledge-base', data);
    return response.data;
  },
};