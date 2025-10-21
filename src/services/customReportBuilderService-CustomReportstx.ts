/**
 * CustomReportBuilderService-CustomReportstx
 * New canonical file name matching frontend page. Re-implements builder.
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  data_source: string;
  query_config: QueryConfig;
  visualization_config: VisualizationConfig;
  filters: ReportFilter[];
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface QueryConfig {
  tables: string[];
  joins: JoinConfig[];
  fields: FieldConfig[];
  where_conditions: WhereCondition[];
  group_by: string[];
  order_by: OrderByConfig[];
  limit?: number;
  offset?: number;
}

export interface JoinConfig { table: string; type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'; condition: string; }
export interface FieldConfig { name: string; alias?: string; function?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT'; table?: string; }
export interface WhereCondition { field: string; operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'; value: any; value2?: any; table?: string; }
export interface OrderByConfig { field: string; direction: 'ASC' | 'DESC'; table?: string; }
export interface VisualizationConfig { type: 'table' | 'chart' | 'dashboard' | 'export'; chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap'; x_axis?: string; y_axis?: string; series?: string[]; colors?: string[]; title?: string; subtitle?: string; show_legend?: boolean; show_grid?: boolean; show_labels?: boolean; }
export interface ReportFilter { id: string; name: string; type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'; field: string; operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'; options?: any[]; default_value?: any; required: boolean; placeholder?: string; }
export interface ColumnInfo { name: string; type: 'string' | 'number' | 'date' | 'boolean'; format?: string; sortable: boolean; filterable: boolean; }
export interface ReportMetadata { generated_at: string; data_source: string; filters_applied: any; query_hash: string; cache_hit: boolean; }
export interface ReportData { columns: ColumnInfo[]; rows: any[]; total_rows: number; execution_time: number; metadata: ReportMetadata; }
export interface ReportExecution { id: string; template_id: string; status: 'pending' | 'running' | 'completed' | 'failed'; started_at: string; completed_at?: string; error_message?: string; execution_time?: number; rows_returned?: number; file_url?: string; created_by: string; }
export interface ScheduledReport { id: string; template_id: string; name: string; schedule: ScheduleConfig; recipients: string[]; format: 'pdf' | 'excel' | 'csv' | 'json'; is_active: boolean; last_run?: string; next_run?: string; created_at: string; updated_at: string; }
export interface ScheduleConfig { frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; day_of_week?: number; day_of_month?: number; hour: number; minute: number; timezone: string; }

class CustomReportBuilderService_CustomReportstx {
  private baseUrl = '/api/reports';

  async getTemplates(category?: string, isPublic?: boolean): Promise<ReportTemplate[]> {
    const params = new URLSearchParams(); if (category) params.append('category', category); if (isPublic !== undefined) params.append('is_public', String(isPublic));
    const res = await fetch(`${this.baseUrl}/templates?${params}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }); if (!res.ok) throw new Error('Failed to fetch report templates'); const result = await res.json(); return result.data;
  }

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ReportTemplate> {
    const res = await fetch(`${this.baseUrl}/templates`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(template) }); if (!res.ok) throw new Error('Failed to create report template'); const result = await res.json(); return result.data;
  }

  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const res = await fetch(`${this.baseUrl}/templates/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); if (!res.ok) throw new Error('Failed to update report template'); const result = await res.json(); return result.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/templates/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to delete report template');
  }

  async executeReport(templateId: string, filters: any = {}, format: 'json' | 'csv' | 'excel' = 'json'): Promise<ReportData> {
    const res = await fetch(`${this.baseUrl}/templates/${templateId}/execute`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ filters, format }) }); if (!res.ok) throw new Error('Failed to execute report'); const result = await res.json(); return result.data;
  }

  async getExecutionHistory(templateId: string, page = 1, limit = 50): Promise<{ executions: ReportExecution[], total: number, page: number, limit: number }>{
    const res = await fetch(`${this.baseUrl}/templates/${templateId}/executions?page=${page}&limit=${limit}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to fetch execution history'); const result = await res.json(); return result.data;
  }

  async testQuery(queryConfig: QueryConfig): Promise<{ columns: ColumnInfo[], sample_rows: any[], execution_time: number }>{
    const res = await fetch(`${this.baseUrl}/test-query`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(queryConfig) }); if (!res.ok) throw new Error('Failed to test query'); const result = await res.json(); return result.data;
  }

  async getAvailableTables(): Promise<{ name: string, columns: ColumnInfo[], description: string }[]>{
    const res = await fetch(`${this.baseUrl}/tables`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to fetch available tables'); const result = await res.json(); return result.data;
  }

  async getTableRelationships(tableName: string): Promise<{ table: string, relationship: string, condition: string }[]>{
    const res = await fetch(`${this.baseUrl}/tables/${tableName}/relationships`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to fetch table relationships'); const result = await res.json(); return result.data;
  }

  async createScheduledReport(scheduledReport: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduledReport>{
    const res = await fetch(`${this.baseUrl}/scheduled`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(scheduledReport) }); if (!res.ok) throw new Error('Failed to create scheduled report'); const result = await res.json(); return result.data;
  }

  async getScheduledReports(): Promise<ScheduledReport[]>{
    const res = await fetch(`${this.baseUrl}/scheduled`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to fetch scheduled reports'); const result = await res.json(); return result.data;
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport>{
    const res = await fetch(`${this.baseUrl}/scheduled/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); if (!res.ok) throw new Error('Failed to update scheduled report'); const result = await res.json(); return result.data;
  }

  async deleteScheduledReport(id: string): Promise<void>{
    const res = await fetch(`${this.baseUrl}/scheduled/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to delete scheduled report');
  }

  async exportReport(templateId: string, format: 'csv' | 'excel' | 'pdf', filters: any = {}): Promise<Blob>{
    const res = await fetch(`${this.baseUrl}/templates/${templateId}/export`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ format, filters }) }); if (!res.ok) throw new Error('Failed to export report'); return res.blob();
  }

  async getReportAnalytics(period: string = '30d'){
    const res = await fetch(`${this.baseUrl}/analytics?period=${period}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to fetch report analytics'); const result = await res.json(); return result.data;
  }

  async cloneTemplate(templateId: string, newName: string): Promise<ReportTemplate>{
    const res = await fetch(`${this.baseUrl}/templates/${templateId}/clone`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) }); if (!res.ok) throw new Error('Failed to clone report template'); const result = await res.json(); return result.data;
  }

  async getCategories(): Promise<{ name: string, count: number, description: string }[]>{
    const res = await fetch(`${this.baseUrl}/categories`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (!res.ok) throw new Error('Failed to fetch report categories'); const result = await res.json(); return result.data;
  }
}

export const customReportBuilderService = new CustomReportBuilderService_CustomReportstx();


