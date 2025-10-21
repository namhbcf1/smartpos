import { api } from './api';

// Report Types
export interface Report {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'financial' | 'customer' | 'product' | 'custom';
  description: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  created_by: string;
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string;
    enabled: boolean;
  };
  last_run?: string;
  next_run?: string;
  data?: any[];
  chart_config?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'table';
    x_axis: string;
    y_axis: string;
    colors: string[];
  };
}

export interface CreateReportData {
  name: string;
  type: 'sales' | 'inventory' | 'financial' | 'customer' | 'product' | 'custom';
  description: string;
  status: 'active' | 'inactive' | 'draft';
  parameters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string;
    enabled: boolean;
  };
  chart_config?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'table';
    x_axis: string;
    y_axis: string;
    colors: string[];
  };
}

export interface UpdateReportData extends Partial<CreateReportData> {
  id: string;
}

export interface ReportFilters {
  search?: string;
  type?: string;
  status?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReportAnalytics {
  total_reports: number;
  active_reports: number;
  scheduled_reports: number;
  reports_by_type: Record<string, number>;
  reports_by_status: Record<string, number>;
  recent_reports: Report[];
  popular_reports: Report[];
}

export interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface ReportRunResult {
  success: boolean;
  data?: ReportData;
  error?: string;
  execution_time?: number;
  record_count?: number;
}

// Reports API
export const reportsAPI = {
  // Get all reports with filtering and pagination
  getReports: (page: number = 1, limit: number = 20, filters?: ReportFilters) =>
    api.get('/reports', { 
      params: { 
        page, 
        limit, 
        ...filters 
      } 
    }),

  // Get single report by ID
  getReport: (id: string) =>
    api.get(`/reports/${id}`),

  // Create new report
  createReport: (data: CreateReportData) =>
    api.post('/reports', data),

  // Update existing report
  updateReport: (id: string, data: Partial<CreateReportData>) =>
    api.put(`/reports/${id}`, data),

  // Delete report
  deleteReport: (id: string) =>
    api.delete(`/reports/${id}`),

  // Run report and get data
  runReport: (id: string, parameters?: Record<string, any>) =>
    api.post(`/reports/${id}/run`, { parameters }),

  // Get report analytics
  getAnalytics: () =>
    api.get('/reports/analytics'),

  // Export report data
  exportReport: (id: string, format: 'csv' | 'excel' | 'pdf' = 'csv') =>
    api.get(`/reports/${id}/export`, { 
      params: { format },
      responseType: 'blob'
    }),

  // Schedule report
  scheduleReport: (id: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string;
    enabled: boolean;
  }) =>
    api.post(`/reports/${id}/schedule`, schedule),

  // Unschedule report
  unscheduleReport: (id: string) =>
    api.delete(`/reports/${id}/schedule`),

  // Get report templates
  getTemplates: () =>
    api.get('/reports/templates'),

  // Create report from template
  createFromTemplate: (templateId: string, data: Partial<CreateReportData>) =>
    api.post(`/reports/templates/${templateId}/create`, data),

  // Duplicate report
  duplicateReport: (id: string, newName: string) =>
    api.post(`/reports/${id}/duplicate`, { name: newName }),

  // Bulk operations
  bulkDelete: (ids: string[]) =>
    api.post('/reports/bulk/delete', { ids }),

  bulkUpdate: (ids: string[], data: Partial<CreateReportData>) =>
    api.post('/reports/bulk/update', { ids, data }),

  // Get report history
  getReportHistory: (id: string) =>
    api.get(`/reports/${id}/history`),

  // Get report performance metrics
  getPerformanceMetrics: (id: string) =>
    api.get(`/reports/${id}/performance`),

  // Share report
  shareReport: (id: string, permissions: {
    users?: string[];
    roles?: string[];
    public?: boolean;
    expires_at?: string;
  }) =>
    api.post(`/reports/${id}/share`, permissions),

  // Get shared reports
  getSharedReports: () =>
    api.get('/reports/shared'),

  // Unshare report
  unshareReport: (id: string) =>
    api.delete(`/reports/${id}/share`),

  // Get report comments
  getComments: (id: string) =>
    api.get(`/reports/${id}/comments`),

  // Add comment to report
  addComment: (id: string, comment: {
    content: string;
    is_internal?: boolean;
  }) =>
    api.post(`/reports/${id}/comments`, comment),

  // Update comment
  updateComment: (reportId: string, commentId: string, content: string) =>
    api.put(`/reports/${reportId}/comments/${commentId}`, { content }),

  // Delete comment
  deleteComment: (reportId: string, commentId: string) =>
    api.delete(`/reports/${reportId}/comments/${commentId}`),

  // Get report subscriptions
  getSubscriptions: (id: string) =>
    api.get(`/reports/${id}/subscriptions`),

  // Subscribe to report
  subscribeToReport: (id: string, email?: string) =>
    api.post(`/reports/${id}/subscribe`, { email }),

  // Unsubscribe from report
  unsubscribeFromReport: (id: string) =>
    api.delete(`/reports/${id}/subscribe`),

  // Get report data sources
  getDataSources: () =>
    api.get('/reports/data-sources'),

  // Test report connection
  testConnection: (dataSource: string) =>
    api.post('/reports/test-connection', { data_source: dataSource }),

  // Get report categories
  getCategories: () =>
    api.get('/reports/categories'),

  // Get report tags
  getTags: () =>
    api.get('/reports/tags'),

  // Search reports
  searchReports: (query: string, filters?: ReportFilters) =>
    api.get('/reports/search', { 
      params: { 
        q: query, 
        ...filters 
      } 
    }),

  // Get report statistics
  getStatistics: (id: string) =>
    api.get(`/reports/${id}/statistics`),

  // Validate report parameters
  validateParameters: (id: string, parameters: Record<string, any>) =>
    api.post(`/reports/${id}/validate`, { parameters }),

  // Get report preview
  getPreview: (id: string, parameters?: Record<string, any>) =>
    api.post(`/reports/${id}/preview`, { parameters }),

  // Save report as template
  saveAsTemplate: (id: string, templateName: string) =>
    api.post(`/reports/${id}/save-as-template`, { name: templateName }),

  // Get report dependencies
  getDependencies: (id: string) =>
    api.get(`/reports/${id}/dependencies`),

  // Update report dependencies
  updateDependencies: (id: string, dependencies: string[]) =>
    api.put(`/reports/${id}/dependencies`, { dependencies }),

  // Get report logs
  getLogs: (id: string, page: number = 1, limit: number = 50) =>
    api.get(`/reports/${id}/logs`, { 
      params: { page, limit } 
    }),

  // Clear report cache
  clearCache: (id: string) =>
    api.post(`/reports/${id}/clear-cache`),

  // Get report health status
  getHealthStatus: (id: string) =>
    api.get(`/reports/${id}/health`),

  // Repair report
  repairReport: (id: string) =>
    api.post(`/reports/${id}/repair`),

  // Archive report
  archiveReport: (id: string) =>
    api.post(`/reports/${id}/archive`),

  // Restore archived report
  restoreReport: (id: string) =>
    api.post(`/reports/${id}/restore`),

  // Get archived reports
  getArchivedReports: (page: number = 1, limit: number = 20) =>
    api.get('/reports/archived', { 
      params: { page, limit } 
    }),

  // Permanently delete report
  permanentDelete: (id: string) =>
    api.delete(`/reports/${id}/permanent`),

  // Get report usage analytics
  getUsageAnalytics: (id: string, period: 'day' | 'week' | 'month' | 'year' = 'month') =>
    api.get(`/reports/${id}/usage`, { 
      params: { period } 
    }),

  // Get report recommendations
  getRecommendations: (id: string) =>
    api.get(`/reports/${id}/recommendations`),

  // Apply recommendation
  applyRecommendation: (id: string, recommendationId: string) =>
    api.post(`/reports/${id}/recommendations/${recommendationId}/apply`),

  // Get report alerts
  getAlerts: (id: string) =>
    api.get(`/reports/${id}/alerts`),

  // Create report alert
  createAlert: (id: string, alert: {
    condition: string;
    threshold: number;
    message: string;
    enabled: boolean;
  }) =>
    api.post(`/reports/${id}/alerts`, alert),

  // Update report alert
  updateAlert: (reportId: string, alertId: string, alert: any) =>
    api.put(`/reports/${reportId}/alerts/${alertId}`, alert),

  // Delete report alert
  deleteAlert: (reportId: string, alertId: string) =>
    api.delete(`/reports/${reportId}/alerts/${alertId}`),

  // Test report alert
  testAlert: (reportId: string, alertId: string) =>
    api.post(`/reports/${reportId}/alerts/${alertId}/test`),

  // Get report dashboard
  getDashboard: () =>
    api.get('/reports/dashboard'),

  // Get report widgets
  getWidgets: () =>
    api.get('/reports/widgets'),

  // Create report widget
  createWidget: (widget: {
    name: string;
    type: string;
    config: any;
    position: { x: number; y: number; w: number; h: number };
  }) =>
    api.post('/reports/widgets', widget),

  // Update report widget
  updateWidget: (id: string, widget: any) =>
    api.put(`/reports/widgets/${id}`, widget),

  // Delete report widget
  deleteWidget: (id: string) =>
    api.delete(`/reports/widgets/${id}`),

  // Get report API documentation
  getApiDocs: () =>
    api.get('/reports/api-docs'),

  // Get report examples
  getExamples: (type?: string) =>
    api.get('/reports/examples', { 
      params: type ? { type } : {} 
    }),

  // Clone report example
  cloneExample: (exampleId: string, newName: string) =>
    api.post(`/reports/examples/${exampleId}/clone`, { name: newName }),
};