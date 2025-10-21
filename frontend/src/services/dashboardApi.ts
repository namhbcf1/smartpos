import { api } from './api';

// Dashboard Types
export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  trend?: number[];
  unit?: string;
  format?: 'currency' | 'number' | 'percentage';
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list' | 'alert' | 'gauge' | 'progress';
  title: string;
  description?: string;
  data: any;
  position: { x: number; y: number; w: number; h: number };
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'doughnut';
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    responsive?: boolean;
  };
  refreshInterval?: number;
  lastUpdated?: string;
}

export interface DashboardActivity {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'customer' | 'system' | 'user';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
  metadata?: Record<string, any>;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  type: 'system' | 'business' | 'security';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: Array<{
    label: string;
    action: string;
    color?: string;
  }>;
}

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  widgets: DashboardWidget[];
  permissions: {
    canEdit: boolean;
    canAdd: boolean;
    canDelete: boolean;
    canShare: boolean;
  };
}

export interface DashboardAnalytics {
  totalViews: number;
  uniqueUsers: number;
  avgSessionTime: number;
  popularWidgets: string[];
  lastActivity: string;
}

// Dashboard API
export const dashboardAPI = {
  // Get dashboard overview data
  getOverview: (period: 'today' | 'week' | 'month' | 'year' = 'today') =>
    api.get('/dashboard/overview', { 
      params: { period } 
    }),

  // Get dashboard metrics
  getMetrics: (metricIds?: string[]) =>
    api.get('/dashboard/metrics', { 
      params: metricIds ? { ids: metricIds.join(',') } : {} 
    }),

  // Get dashboard widgets
  getWidgets: () =>
    api.get('/dashboard/widgets'),

  // Create new widget
  createWidget: (widget: Partial<DashboardWidget>) =>
    api.post('/dashboard/widgets', widget),

  // Update widget
  updateWidget: (id: string, widget: Partial<DashboardWidget>) =>
    api.put(`/dashboard/widgets/${id}`, widget),

  // Delete widget
  deleteWidget: (id: string) =>
    api.delete(`/dashboard/widgets/${id}`),

  // Get widget data
  getWidgetData: (id: string, params?: Record<string, any>) =>
    api.get(`/dashboard/widgets/${id}/data`, { 
      params 
    }),

  // Refresh widget data
  refreshWidget: (id: string) =>
    api.post(`/dashboard/widgets/${id}/refresh`),

  // Get recent activities
  getActivities: (limit: number = 10, type?: string) =>
    api.get('/dashboard/activities', { 
      params: { limit, type } 
    }),

  // Get system alerts
  getAlerts: (severity?: string, isRead?: boolean) =>
    api.get('/dashboard/alerts', { 
      params: { severity, isRead } 
    }),

  // Mark alert as read
  markAlertAsRead: (id: string) =>
    api.post(`/dashboard/alerts/${id}/read`),

  // Dismiss alert
  dismissAlert: (id: string) =>
    api.delete(`/dashboard/alerts/${id}`),

  // Get dashboard configuration
  getConfig: () =>
    api.get('/dashboard/config'),

  // Update dashboard configuration
  updateConfig: (config: Partial<DashboardConfig>) =>
    api.put('/dashboard/config', config),

  // Get dashboard analytics
  getAnalytics: (period: 'day' | 'week' | 'month' = 'week') =>
    api.get('/dashboard/analytics', { 
      params: { period } 
    }),

  // Export dashboard data
  exportDashboard: (format: 'pdf' | 'excel' | 'csv' = 'pdf') =>
    api.get('/dashboard/export', { 
      params: { format },
      responseType: 'blob'
    }),

  // Share dashboard
  shareDashboard: (permissions: {
    users?: string[];
    roles?: string[];
    public?: boolean;
    expiresAt?: string;
  }) =>
    api.post('/dashboard/share', permissions),

  // Get shared dashboards
  getSharedDashboards: () =>
    api.get('/dashboard/shared'),

  // Get dashboard templates
  getTemplates: () =>
    api.get('/dashboard/templates'),

  // Create dashboard from template
  createFromTemplate: (templateId: string, name: string) =>
    api.post(`/dashboard/templates/${templateId}/create`, { name }),

  // Save dashboard as template
  saveAsTemplate: (name: string, description?: string) =>
    api.post('/dashboard/save-template', { name, description }),

  // Get dashboard performance metrics
  getPerformance: () =>
    api.get('/dashboard/performance'),

  // Get system health status
  getSystemHealth: () =>
    api.get('/dashboard/health'),

  // Get real-time data
  getRealtimeData: (widgetIds?: string[]) =>
    api.get('/dashboard/realtime', { 
      params: widgetIds ? { widgets: widgetIds.join(',') } : {} 
    }),

  // Subscribe to real-time updates
  subscribeRealtime: (callback: (data: any) => void) => {
    // WebSocket implementation would go here
    // For now, return a mock subscription
    const interval = setInterval(() => {
      callback({
        timestamp: new Date().toISOString(),
        data: {}
      });
    }, 5000);
    
    return () => clearInterval(interval);
  },

  // Get dashboard shortcuts
  getShortcuts: () =>
    api.get('/dashboard/shortcuts'),

  // Add dashboard shortcut
  addShortcut: (shortcut: {
    title: string;
    url: string;
    icon?: string;
    description?: string;
  }) =>
    api.post('/dashboard/shortcuts', shortcut),

  // Remove dashboard shortcut
  removeShortcut: (id: string) =>
    api.delete(`/dashboard/shortcuts/${id}`),

  // Get dashboard notifications
  getNotifications: (unreadOnly: boolean = false) =>
    api.get('/dashboard/notifications', { 
      params: { unreadOnly } 
    }),

  // Mark notification as read
  markNotificationAsRead: (id: string) =>
    api.post(`/dashboard/notifications/${id}/read`),

  // Get dashboard search suggestions
  getSearchSuggestions: (query: string) =>
    api.get('/dashboard/search/suggestions', { 
      params: { q: query } 
    }),

  // Search dashboard content
  searchDashboard: (query: string, filters?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    api.get('/dashboard/search', { 
      params: { q: query, ...filters } 
    }),

  // Get dashboard favorites
  getFavorites: () =>
    api.get('/dashboard/favorites'),

  // Add to favorites
  addToFavorites: (type: 'widget' | 'dashboard', id: string) =>
    api.post('/dashboard/favorites', { type, id }),

  // Remove from favorites
  removeFromFavorites: (type: 'widget' | 'dashboard', id: string) =>
    api.delete('/dashboard/favorites', { 
      params: { type, id } 
    }),

  // Get dashboard history
  getHistory: (limit: number = 20) =>
    api.get('/dashboard/history', { 
      params: { limit } 
    }),

  // Restore dashboard version
  restoreVersion: (versionId: string) =>
    api.post(`/dashboard/restore/${versionId}`),

  // Get dashboard insights
  getInsights: () =>
    api.get('/dashboard/insights'),

  // Get dashboard recommendations
  getRecommendations: () =>
    api.get('/dashboard/recommendations'),

  // Apply recommendation
  applyRecommendation: (recommendationId: string) =>
    api.post(`/dashboard/recommendations/${recommendationId}/apply`),

  // Get dashboard usage statistics
  getUsageStats: (period: 'day' | 'week' | 'month' = 'week') =>
    api.get('/dashboard/usage', { 
      params: { period } 
    }),

  // Get dashboard collaboration data
  getCollaboration: () =>
    api.get('/dashboard/collaboration'),

  // Add dashboard comment
  addComment: (comment: {
    content: string;
    widgetId?: string;
    isInternal?: boolean;
  }) =>
    api.post('/dashboard/comments', comment),

  // Get dashboard comments
  getComments: (widgetId?: string) =>
    api.get('/dashboard/comments', { 
      params: widgetId ? { widgetId } : {} 
    }),

  // Update dashboard comment
  updateComment: (commentId: string, content: string) =>
    api.put(`/dashboard/comments/${commentId}`, { content }),

  // Delete dashboard comment
  deleteComment: (commentId: string) =>
    api.delete(`/dashboard/comments/${commentId}`),

  // Get dashboard permissions
  getPermissions: () =>
    api.get('/dashboard/permissions'),

  // Update dashboard permissions
  updatePermissions: (permissions: {
    users: Array<{ id: string; role: string; permissions: string[] }>;
    roles: Array<{ id: string; permissions: string[] }>;
    public: boolean;
  }) =>
    api.put('/dashboard/permissions', permissions),

  // Get dashboard audit log
  getAuditLog: (limit: number = 50) =>
    api.get('/dashboard/audit', { 
      params: { limit } 
    }),

  // Get dashboard backup
  createBackup: () =>
    api.post('/dashboard/backup'),

  // Restore dashboard from backup
  restoreBackup: (backupId: string) =>
    api.post(`/dashboard/restore-backup/${backupId}`),

  // Get dashboard backups
  getBackups: () =>
    api.get('/dashboard/backups'),

  // Delete dashboard backup
  deleteBackup: (backupId: string) =>
    api.delete(`/dashboard/backups/${backupId}`),

  // Get dashboard integrations
  getIntegrations: () =>
    api.get('/dashboard/integrations'),

  // Connect integration
  connectIntegration: (integrationId: string, config: any) =>
    api.post(`/dashboard/integrations/${integrationId}/connect`, config),

  // Disconnect integration
  disconnectIntegration: (integrationId: string) =>
    api.delete(`/dashboard/integrations/${integrationId}/disconnect`),

  // Test integration connection
  testIntegration: (integrationId: string) =>
    api.post(`/dashboard/integrations/${integrationId}/test`),

  // Get dashboard API documentation
  getApiDocs: () =>
    api.get('/dashboard/api-docs'),

  // Get dashboard examples
  getExamples: (category?: string) =>
    api.get('/dashboard/examples', { 
      params: category ? { category } : {} 
    }),

  // Clone dashboard example
  cloneExample: (exampleId: string, name: string) =>
    api.post(`/dashboard/examples/${exampleId}/clone`, { name }),

  // Get dashboard help
  getHelp: (topic?: string) =>
    api.get('/dashboard/help', { 
      params: topic ? { topic } : {} 
    }),

  // Submit dashboard feedback
  submitFeedback: (feedback: {
    rating: number;
    comment: string;
    category: string;
  }) =>
    api.post('/dashboard/feedback', feedback),

  // Get dashboard changelog
  getChangelog: () =>
    api.get('/dashboard/changelog'),

  // Get dashboard status
  getStatus: () =>
    api.get('/dashboard/status'),

  // Get dashboard version
  getVersion: () =>
    api.get('/dashboard/version'),
};