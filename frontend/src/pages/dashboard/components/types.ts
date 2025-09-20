// Dashboard Types
export interface DashboardStats {
  sales: {
    today: number;
    yesterday: number;
    this_week: number;
    this_month: number;
    growth_rate: number;
  };
  revenue: {
    today: number;
    yesterday: number;
    this_week: number;
    this_month: number;
    growth_rate: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    completion_rate: number;
  };
  customers: {
    total: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    growth_rate: number;
  };
  products: {
    total: number;
    low_stock: number;
    out_of_stock: number;
    featured: number;
    total_value: number;
  };
  inventory: {
    total_items: number;
    total_value: number;
    low_stock_alerts: number;
    reorder_needed: number;
    turnover_rate: number;
  };
}

export interface SalesChart {
  period: string;
  sales: number;
  revenue: number;
  orders: number;
  customers: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sku: string;
  image_url?: string;
  category_name: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
  growth_rate: number;
}

export interface TopCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  is_vip: boolean;
}

export interface RecentActivity {
  id: number;
  type: 'sale' | 'order' | 'customer' | 'product' | 'stock' | 'user';
  title: string;
  description: string;
  amount?: number;
  user_name?: string;
  created_at: string;
  status?: string;
  icon?: string;
  color?: string;
}

export interface LowStockAlert {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  category_name: string;
  last_restocked: string;
  supplier_name?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
  permission?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stats' | 'chart' | 'list' | 'table' | 'custom';
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number; w: number; h: number };
  data?: any;
  settings?: Record<string, any>;
  is_visible: boolean;
  is_removable: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  is_default: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardFilters {
  date_range: {
    start: string;
    end: string;
    preset?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
  };
  store_id?: number;
  category_id?: number;
  refresh_interval: number; // in seconds
}

export interface PerformanceMetrics {
  response_time: number;
  uptime: number;
  error_rate: number;
  active_users: number;
  database_size: number;
  cache_hit_rate: number;
  api_calls_today: number;
}

export interface WeatherInfo {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  icon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  published_at: string;
  source: string;
  category: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: number;
  assigned_to_name?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface SystemAlert {
  id: number;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  component: string;
  details?: Record<string, any>;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface DashboardPreferences {
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'list' | 'compact';
  refresh_interval: number;
  show_animations: boolean;
  show_notifications: boolean;
  default_date_range: string;
  widgets_order: string[];
  collapsed_sections: string[];
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

export interface ComparisonData {
  current: {
    value: number;
    label: string;
    period: string;
  };
  previous: {
    value: number;
    label: string;
    period: string;
  };
  change: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface GoalProgress {
  id: number;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  progress_percentage: number;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
  deadline?: string;
  created_at: string;
}

export interface DashboardResponse {
  success: boolean;
  data?: {
    stats?: DashboardStats;
    charts?: Record<string, ChartData>;
    top_products?: TopProduct[];
    top_customers?: TopCustomer[];
    recent_activities?: RecentActivity[];
    low_stock_alerts?: LowStockAlert[];
    notifications?: Notification[];
    system_alerts?: SystemAlert[];
    performance_metrics?: PerformanceMetrics;
    goals?: GoalProgress[];
  };
  message?: string;
}
