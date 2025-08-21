import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Badge,
  LinearProgress,
  Autocomplete,
  ButtonGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Avatar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Collapse,
  Skeleton,
  Snackbar,
  Slide,
  Fade,
  Zoom,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  AppBar,
  Toolbar,
  Container,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Assignment as RoleIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  PointOfSale as CashierIcon,
  BusinessCenter as SalesIcon,
  Group as CollaboratorIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Crown as CrownIcon,
  Work as WorkIcon,
  ShoppingCart as ShoppingCartIcon,
  Package as PackageIcon,
  Description as DescriptionIcon,
  Storage as StorageIcon,
  Public as PublicIcon,
  PhoneAndroid as SmartphoneIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  ContentCopy as CopyIcon,
  GetApp as DownloadIcon,
  Publish as UploadIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Insights as InsightsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Bolt as BoltIcon,
  FlashOn as FlashOnIcon,
  Verified as VerifiedIcon,
  NewReleases as NewReleasesIcon,
  Tune as TuneIcon,
  Build as BuildIcon,
  Extension as ExtensionIcon,
  Psychology as PsychologyIcon,
  SmartToy as SmartToyIcon,
  AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiClient from '../services/api';
import { Employee } from '../services/employeeApi';

interface Permission {
  permission_key: string;
  permission_display_name: string;
  resource_name: string;
  resource_display_name: string;
  action_name: string;
  action_display_name: string;
  has_permission: boolean;
  permission_source?: 'role' | 'individual';
}

interface PermissionMatrix {
  resources: Array<{
    id: number;
    name: string;
    display_name: string;
    resource_type: string;
    actions: Array<{
      id: number;
      name: string;
      display_name: string;
      permission_key: string;
      has_permission: boolean;
      permission_source?: 'role' | 'individual';
    }>;
  }>;
}

interface RoleTemplate {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_template: boolean;
  is_system: boolean;
  permission_count: number;
  color?: string;
  icon?: string;
  categories?: string[];
  key_permissions?: string[];
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  permissions: Permission[];
  granted_count: number;
  total_count: number;
}

interface PermissionAnalytics {
  total_permissions: number;
  granted_permissions: number;
  role_permissions: number;
  individual_permissions: number;
  coverage_percentage: number;
  categories: Array<{
    name: string;
    granted: number;
    total: number;
    percentage: number;
  }>;
  recent_changes: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface BulkOperation {
  type: 'grant' | 'revoke' | 'assign_role' | 'remove_role';
  permissions?: string[];
  role_id?: number;
  reason: string;
  employee_ids: number[];
}

interface PermissionComparison {
  employee_a: Employee;
  employee_b: Employee;
  differences: Array<{
    permission_key: string;
    permission_name: string;
    employee_a_has: boolean;
    employee_b_has: boolean;
    category: string;
  }>;
  similarity_percentage: number;
}

interface AuditLogEntry {
  id: number;
  permission_key: string;
  permission_display_name: string;
  action: 'granted' | 'revoked' | 'role_assigned' | 'role_removed';
  changed_by_name: string;
  changed_by_id: number;
  changed_at: string;
  reason?: string;
  old_value?: boolean;
  new_value?: boolean;
  role_name?: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  display_name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface PermissionManagementModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onPermissionsUpdated: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`permission-tabpanel-${index}`}
      aria-labelledby={`permission-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}



const PermissionManagementModal: React.FC<PermissionManagementModalProps> = ({
  open,
  onClose,
  employee,
  onPermissionsUpdated
}) => {
  // Core state
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<RoleTemplate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [selectedRoleTemplate, setSelectedRoleTemplate] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  // Enhanced UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'list' | 'cards'>('matrix');
  const [showOnlyGranted, setShowOnlyGranted] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  // Advanced features state
  const [permissionAnalytics, setPermissionAnalytics] = useState<PermissionAnalytics | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonEmployee, setComparisonEmployee] = useState<Employee | null>(null);
  const [bulkOperationMode, setBulkOperationMode] = useState(false);
  const [selectedBulkOperation, setSelectedBulkOperation] = useState<'grant' | 'revoke' | 'assign_role'>('grant');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [permissionHistory, setPermissionHistory] = useState<AuditLogEntry[]>([]);
  const [roleRecommendations, setRoleRecommendations] = useState<RoleTemplate[]>([]);
  const [showRoleWizard, setShowRoleWizard] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDescription, setCustomRoleDescription] = useState('');

  // Mobile responsiveness
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open && employee) {
      loadPermissionData();
    }
  }, [open, employee]);

  // Fallback data for when APIs are not available
  const getFallbackPermissionMatrix = (): PermissionMatrix => ({
    resources: [
      {
        id: 1,
        name: 'sales',
        display_name: 'Bán hàng',
        resource_type: 'module',
        actions: [
          {
            id: 1,
            name: 'access',
            display_name: 'Truy cập điểm bán hàng',
            permission_key: 'sales.pos.access',
            has_permission: true,
            permission_source: 'role'
          },
          {
            id: 2,
            name: 'create',
            display_name: 'Tạo đơn hàng',
            permission_key: 'sales.orders.create',
            has_permission: true,
            permission_source: 'role'
          },
          {
            id: 3,
            name: 'view',
            display_name: 'Xem đơn hàng',
            permission_key: 'sales.orders.view',
            has_permission: true,
            permission_source: 'role'
          },
          {
            id: 4,
            name: 'apply_discount',
            display_name: 'Áp dụng giảm giá',
            permission_key: 'sales.discounts.apply',
            has_permission: false,
            permission_source: 'role'
          }
        ]
      },
      {
        id: 2,
        name: 'inventory',
        display_name: 'Kho hàng',
        resource_type: 'module',
        actions: [
          {
            id: 5,
            name: 'view',
            display_name: 'Xem sản phẩm',
            permission_key: 'inventory.products.view',
            has_permission: true,
            permission_source: 'role'
          },
          {
            id: 6,
            name: 'edit',
            display_name: 'Chỉnh sửa sản phẩm',
            permission_key: 'inventory.products.edit',
            has_permission: false,
            permission_source: 'role'
          },
          {
            id: 7,
            name: 'manage',
            display_name: 'Quản lý tồn kho',
            permission_key: 'inventory.stock.manage',
            has_permission: false,
            permission_source: 'role'
          }
        ]
      },
      {
        id: 3,
        name: 'administration',
        display_name: 'Quản trị',
        resource_type: 'module',
        actions: [
          {
            id: 8,
            name: 'manage_users',
            display_name: 'Quản lý người dùng',
            permission_key: 'admin.users.manage',
            has_permission: false,
            permission_source: 'role'
          },
          {
            id: 9,
            name: 'manage_roles',
            display_name: 'Quản lý vai trò',
            permission_key: 'admin.roles.manage',
            has_permission: false,
            permission_source: 'role'
          }
        ]
      }
    ]
  });

  const getFallbackRoleTemplates = (): RoleTemplate[] => [
    {
      id: 1,
      name: 'cashier',
      display_name: 'Thu ngân',
      description: 'Nhân viên thu ngân, xử lý thanh toán',
      color: '#2196F3',
      is_system: true,
      is_template: true,
      permission_count: 8
    },
    {
      id: 2,
      name: 'sales_agent',
      display_name: 'Nhân viên kinh doanh',
      description: 'Nhân viên bán hàng và tư vấn khách hàng',
      color: '#4CAF50',
      is_system: true,
      is_template: true,
      permission_count: 12
    },
    {
      id: 3,
      name: 'inventory_manager',
      display_name: 'Quản lý kho',
      description: 'Quản lý kho hàng và nhập xuất',
      color: '#FF9800',
      is_system: true,
      is_template: true,
      permission_count: 15
    },
    {
      id: 4,
      name: 'store_manager',
      display_name: 'Quản lý cửa hàng',
      description: 'Quản lý toàn bộ hoạt động cửa hàng',
      color: '#9C27B0',
      is_system: true,
      is_template: true,
      permission_count: 25
    },
    {
      id: 5,
      name: 'admin',
      display_name: 'Quản trị viên',
      description: 'Toàn quyền quản trị hệ thống',
      color: '#F44336',
      is_system: true,
      is_template: true,
      permission_count: 50
    }
  ];

  const getFallbackAuditLog = (): AuditLogEntry[] => [
    {
      id: 1,
      permission_key: 'sales.pos.access',
      permission_display_name: 'Truy cập điểm bán hàng',
      action: 'granted',
      changed_by_name: 'Admin User',
      changed_by_id: 1,
      changed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      reason: 'Gán vai trò Thu ngân',
      old_value: false,
      new_value: true
    },
    {
      id: 2,
      permission_key: 'sales.orders.create',
      permission_display_name: 'Tạo đơn hàng',
      action: 'granted',
      changed_by_name: 'Admin User',
      changed_by_id: 1,
      changed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      reason: 'Nhân viên mới',
      old_value: false,
      new_value: true
    },
    {
      id: 3,
      permission_key: '',
      permission_display_name: 'Gán vai trò Thu ngân',
      action: 'role_assigned',
      changed_by_name: 'Admin User',
      changed_by_id: 1,
      changed_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      reason: 'Nhân viên mới gia nhập',
      role_name: 'Thu ngân'
    },
    {
      id: 4,
      permission_key: 'inventory.products.view',
      permission_display_name: 'Xem sản phẩm',
      action: 'revoked',
      changed_by_name: 'Store Manager',
      changed_by_id: 2,
      changed_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      reason: 'Điều chỉnh quyền hạn theo vai trò',
      old_value: true,
      new_value: false
    }
  ];

  const loadPermissionData = async () => {
    if (!employee) return;

    setLoading(true);
    try {
      // Load core permission data with robust fallback handling
      let matrixResponse = null;
      let templatesResponse = null;
      let rolesResponse = null;
      let auditResponse = null;

      try {
        const promises = [
          apiClient.get(`/permissions/employees/${employee.id}/matrix`).catch((error) => {
            console.log('🔄 Matrix API failed, using fallback');
            return null;
          }),
          apiClient.get('/permissions/roles/templates').catch((error) => {
            console.log('🔄 Templates API failed, using fallback');
            return null;
          }),
          apiClient.get(`/permissions/employees/${employee.id}/roles`).catch((error) => {
            console.log('🔄 Roles API failed, using fallback');
            return null;
          }),
          apiClient.get(`/permissions/employees/${employee.id}/audit?limit=20`).catch((error) => {
            console.log('🔄 Audit API failed, using fallback');
            return null;
          })
        ];

        [matrixResponse, templatesResponse, rolesResponse, auditResponse] = await Promise.all(promises);
      } catch (promiseError) {
        console.log('🔄 Promise.all failed, using fallback data for all APIs');
        // All responses will remain null, triggering fallback logic below
      }

      // Track if we're using any fallback data
      let hasFallbackData = false;

      // Set permission matrix with fallback
      if (matrixResponse && matrixResponse.data?.success) {
        setPermissionMatrix(matrixResponse.data.data);
      } else {
        console.log('🔄 Using fallback permission matrix data');
        setPermissionMatrix(getFallbackPermissionMatrix());
        hasFallbackData = true;
      }

      // Set role templates with fallback
      if (templatesResponse && templatesResponse.data?.success) {
        setRoleTemplates(templatesResponse.data.data);
      } else {
        console.log('🔄 Using fallback role templates data');
        setRoleTemplates(getFallbackRoleTemplates());
        hasFallbackData = true;
      }

      // Set employee roles with fallback
      if (rolesResponse && rolesResponse.data?.success) {
        setEmployeeRoles(rolesResponse.data.data);
      } else {
        console.log('🔄 Using fallback employee roles data');
        // For demo purposes, assign a role based on employee role
        const employeeRole = employee.role?.toLowerCase();
        const matchingTemplate = getFallbackRoleTemplates().find(template =>
          template.name === employeeRole ||
          (employeeRole === 'thu ngân' && template.name === 'cashier') ||
          (employeeRole === 'nhân viên kinh doanh' && template.name === 'sales_agent') ||
          (employeeRole === 'quản trị viên' && template.name === 'admin')
        );

        if (matchingTemplate) {
          setEmployeeRoles([matchingTemplate]);
        } else {
          setEmployeeRoles([]);
        }
        hasFallbackData = true;
      }

      // Set audit log with fallback
      if (auditResponse && auditResponse.data?.success) {
        setAuditLog(auditResponse.data.data);
      } else {
        console.log('🔄 Using fallback audit log data');
        setAuditLog(getFallbackAuditLog());
        hasFallbackData = true;
      }

      // Update fallback data flag
      setUsingFallbackData(hasFallbackData);

      // Load analytics and recommendations (optional)
      try {
        const [analyticsResponse, recommendationsResponse] = await Promise.all([
          apiClient.get(`/permissions/employees/${employee.id}/analytics`),
          apiClient.get(`/permissions/employees/${employee.id}/recommendations`)
        ]);

        setPermissionAnalytics(analyticsResponse.data);
        setRoleRecommendations(recommendationsResponse.data);
      } catch (analyticsError) {
        console.warn('Analytics data not available:', analyticsError);
        // Analytics are optional - continue without them
      }
    } catch (error) {
      console.error('Error loading permission data:', error);

      // Use fallback data even on complete failure
      console.log('🔄 Using complete fallback data due to API failure');
      setPermissionMatrix(getFallbackPermissionMatrix());
      setRoleTemplates(getFallbackRoleTemplates());
      setEmployeeRoles([]);
      setAuditLog(getFallbackAuditLog());
      setUsingFallbackData(true);

      enqueueSnackbar('Đang sử dụng dữ liệu mẫu. Một số tính năng có thể bị hạn chế.', {
        variant: 'warning',
        autoHideDuration: 5000
      });
    } finally {
      setLoading(false);
    }
  };



  const handlePermissionToggle = (permissionKey: string, granted: boolean) => {
    const newChanges = new Map(pendingChanges);
    newChanges.set(permissionKey, granted);
    setPendingChanges(newChanges);

    // Update the matrix display
    if (permissionMatrix) {
      const updatedMatrix = { ...permissionMatrix };
      updatedMatrix.resources = updatedMatrix.resources.map(resource => ({
        ...resource,
        actions: resource.actions.map(action =>
          action.permission_key === permissionKey
            ? { ...action, has_permission: granted, permission_source: 'individual' as const }
            : action
        )
      }));
      setPermissionMatrix(updatedMatrix);
    }
  };

  // Enhanced utility functions
  const getResourceIcon = (resourceType: string) => {
    // Default icons for different resource types
    switch (resourceType) {
      case 'sales': return <StoreIcon />;
      case 'inventory': return <InventoryIcon />;
      case 'customers': return <PeopleIcon />;
      case 'reports': return <ReportsIcon />;
      case 'administration': return <SettingsIcon />;
      case 'dashboard': return <DashboardIcon />;
      default: return <SecurityIcon />;
    }
  };

  const getResourceColor = (resourceType: string) => {
    // Default colors for different resource types
    switch (resourceType) {
      case 'sales': return 'success';
      case 'inventory': return 'warning';
      case 'customers': return 'info';
      case 'reports': return 'secondary';
      case 'administration': return 'error';
      case 'dashboard': return 'primary';
      default: return 'default';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin': return <AdminIcon />;
      case 'manager': return <ManagerIcon />;
      case 'cashier': return <CashierIcon />;
      case 'sales_agent': return <SalesIcon />;
      case 'collaborator': return <CollaboratorIcon />;
      default: return <PersonIcon />;
    }
  };

  const filteredResources = permissionMatrix?.resources.filter(resource => {
    const matchesSearch = searchTerm === '' ||
      resource.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.actions.some(action =>
        action.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory = selectedCategory === 'all' || resource.name === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  const handleBulkPermissionChange = (granted: boolean) => {
    const newChanges = new Map(pendingChanges);
    bulkSelection.forEach(permissionKey => {
      newChanges.set(permissionKey, granted);
    });
    setPendingChanges(newChanges);

    // Update matrix display
    if (permissionMatrix) {
      const updatedMatrix = { ...permissionMatrix };
      updatedMatrix.resources = updatedMatrix.resources.map(resource => ({
        ...resource,
        actions: resource.actions.map(action =>
          bulkSelection.has(action.permission_key)
            ? { ...action, has_permission: granted, permission_source: 'individual' as const }
            : action
        )
      }));
      setPermissionMatrix(updatedMatrix);
    }
    setBulkSelection(new Set());
  };

  const toggleAccordion = (resourceId: string) => {
    const newExpanded = new Set(expandedAccordions);
    if (newExpanded.has(resourceId)) {
      newExpanded.delete(resourceId);
    } else {
      newExpanded.add(resourceId);
    }
    setExpandedAccordions(newExpanded);
  };

  const expandAllAccordions = () => {
    const allResourceIds = new Set(filteredResources.map(r => r.id.toString()));
    setExpandedAccordions(allResourceIds);
  };

  const collapseAllAccordions = () => {
    setExpandedAccordions(new Set());
  };

  // Advanced utility functions
  const handleBulkSelectAll = () => {
    const allPermissions = new Set<string>();
    filteredResources.forEach(resource => {
      resource.actions.forEach(action => {
        if (!showOnlyGranted || action.has_permission) {
          allPermissions.add(action.permission_key);
        }
      });
    });
    setBulkSelection(allPermissions);
  };

  const handleBulkSelectNone = () => {
    setBulkSelection(new Set());
  };

  const handleBulkSelectCategory = (categoryName: string) => {
    const categoryPermissions = new Set<string>();
    filteredResources
      .filter(resource => resource.name === categoryName)
      .forEach(resource => {
        resource.actions.forEach(action => {
          categoryPermissions.add(action.permission_key);
        });
      });
    setBulkSelection(categoryPermissions);
  };

  const exportPermissions = () => {
    if (!permissionMatrix || !employee) return;

    const exportData = {
      employee: {
        id: employee.id,
        name: employee.full_name,
        email: employee.email || '',
        role: employee.role
      },
      permissions: permissionMatrix.resources.map(resource => ({
        category: resource.display_name,
        permissions: resource.actions.map(action => ({
          name: action.display_name,
          key: action.permission_key,
          granted: action.has_permission,
          source: action.permission_source
        }))
      })),
      analytics: permissionAnalytics,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-${employee.full_name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    enqueueSnackbar('Đã xuất dữ liệu quyền hạn', { variant: 'success' });
  };

  const copyPermissionsFromRole = (roleId: number) => {
    const role = roleTemplates.find(r => r.id === roleId);
    if (!role || !permissionMatrix) return;

    // This would typically fetch the role's permissions from the API
    // For now, we'll simulate it
    enqueueSnackbar(`Đã sao chép quyền từ vai trò ${role.display_name}`, { variant: 'info' });
  };

  const resetToRoleDefaults = () => {
    if (!employeeRoles.length || !permissionMatrix) return;

    const newChanges = new Map<string, boolean>();

    // Reset all individual permissions
    permissionMatrix.resources.forEach(resource => {
      resource.actions.forEach(action => {
        if (action.permission_source === 'individual') {
          newChanges.set(action.permission_key, false);
        }
      });
    });

    setPendingChanges(newChanges);
    enqueueSnackbar('Đã đặt lại về quyền mặc định của vai trò', { variant: 'info' });
  };

  const handleSavePermissions = async () => {
    if (!employee || pendingChanges.size === 0) return;

    setSaving(true);
    try {
      const permissions = Array.from(pendingChanges.entries()).map(([permission_key, granted]) => ({
        permission_key,
        granted
      }));

      await apiClient.put(`/permissions/employees/${employee.id}/bulk`, {
        permissions,
        reason: reason.trim() || undefined
      });

      enqueueSnackbar('Cập nhật quyền hạn thành công', { variant: 'success' });
      setPendingChanges(new Map());
      setReason('');
      onPermissionsUpdated();
      await loadPermissionData(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving permissions:', error);
      enqueueSnackbar('Lỗi khi lưu quyền hạn', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRoleTemplate = async () => {
    if (!employee || !selectedRoleTemplate) return;

    setSaving(true);
    try {
      await apiClient.post(`/permissions/employees/${employee.id}/roles`, {
        role_id: selectedRoleTemplate
      });

      enqueueSnackbar('Gán vai trò thành công', { variant: 'success' });
      setSelectedRoleTemplate('');
      onPermissionsUpdated();
      await loadPermissionData();
    } catch (error) {
      console.error('Error assigning role:', error);
      enqueueSnackbar('Lỗi khi gán vai trò', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!employee) return;

    setSaving(true);
    try {
      await apiClient.delete(`/permissions/employees/${employee.id}/roles/${roleId}`);
      enqueueSnackbar('Xóa vai trò thành công', { variant: 'success' });
      onPermissionsUpdated();
      await loadPermissionData();
    } catch (error) {
      console.error('Error removing role:', error);
      enqueueSnackbar('Lỗi khi xóa vai trò', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100vh' : '90vh',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SecurityIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                Quản lý quyền hạn - {employee.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.email} • {employee.role}
              </Typography>
              {pendingChanges.size > 0 && (
                <Chip
                  label={`${pendingChanges.size} thay đổi chưa lưu`}
                  color="warning"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {/* Analytics Summary */}
            {permissionAnalytics && (
              <Box display="flex" alignItems="center" gap={1} mr={2}>
                <Chip
                  icon={<BarChartIcon />}
                  label={`${permissionAnalytics.coverage_percentage}% quyền`}
                  color={permissionAnalytics.risk_level === 'high' ? 'error' :
                         permissionAnalytics.risk_level === 'medium' ? 'warning' : 'success'}
                  size="small"
                />
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${permissionAnalytics.granted_permissions}/${permissionAnalytics.total_permissions}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Tooltip title="Xuất dữ liệu quyền hạn">
              <IconButton onClick={exportPermissions} disabled={loading}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="So sánh quyền hạn">
              <IconButton
                onClick={() => setComparisonMode(!comparisonMode)}
                disabled={loading}
                color={comparisonMode ? 'primary' : 'default'}
              >
                <CompareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton onClick={loadPermissionData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Fallback Data Banner */}
            {usingFallbackData && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={loadPermissionData}
                    disabled={loading}
                  >
                    Thử lại
                  </Button>
                }
              >
                <AlertTitle>Đang sử dụng dữ liệu mẫu</AlertTitle>
                Hệ thống đang hiển thị dữ liệu mẫu do không thể kết nối với API phân quyền.
                Một số tính năng có thể bị hạn chế. Bạn có thể thử lại để kết nối với dữ liệu thực.
              </Alert>
            )}

            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile={isMobile}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={
                  <Badge badgeContent={pendingChanges.size} color="warning">
                    <SecurityIcon />
                  </Badge>
                }
                label="Ma trận quyền hạn"
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={
                  <Badge badgeContent={employeeRoles.length} color="primary">
                    <RoleIcon />
                  </Badge>
                }
                label="Vai trò"
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={
                  <Badge badgeContent={auditLog.length} color="info">
                    <HistoryIcon />
                  </Badge>
                }
                label="Lịch sử thay đổi"
                sx={{ minHeight: 72 }}
              />
              <Tab
                icon={
                  <Badge
                    badgeContent={permissionAnalytics?.risk_level === 'high' ? '!' : null}
                    color="error"
                  >
                    <AnalyticsIcon />
                  </Badge>
                }
                label="Phân tích"
                sx={{ minHeight: 72 }}
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Enhanced Controls Section */}
              <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Tìm kiếm quyền hạn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Danh mục</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Danh mục"
                      >
                        <MenuItem value="all">Tất cả danh mục</MenuItem>
                        {permissionMatrix?.resources.map(resource => (
                          <MenuItem key={resource.id} value={resource.name}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getResourceIcon(resource.name)}
                              {!isMobile && resource.display_name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={(_, newMode) => newMode && setViewMode(newMode)}
                      size="small"
                      fullWidth={isMobile}
                    >
                      <ToggleButton value="matrix">
                        <Tooltip title="Xem dạng ma trận">
                          <SecurityIcon />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="list">
                        <Tooltip title="Xem dạng danh sách">
                          <ViewIcon />
                        </Tooltip>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                  <Grid item xs={6} sm={3} md={3}>
                    <ButtonGroup size="small" variant="outlined" fullWidth={isMobile}>
                      <Button onClick={expandAllAccordions} startIcon={!isMobile && <ExpandMoreIcon />}>
                        {isMobile ? 'Mở' : 'Mở rộng'}
                      </Button>
                      <Button onClick={collapseAllAccordions} startIcon={!isMobile && <ClearIcon />}>
                        {isMobile ? 'Đóng' : 'Thu gọn'}
                      </Button>
                    </ButtonGroup>
                  </Grid>
                </Grid>

                {/* Advanced Controls Row */}
                <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <ButtonGroup size="small" variant="outlined" fullWidth>
                      <Button onClick={handleBulkSelectAll} startIcon={!isMobile && <SelectAllIcon />}>
                        {isMobile ? 'Chọn tất cả' : 'Chọn tất cả'}
                      </Button>
                      <Button onClick={handleBulkSelectNone} startIcon={!isMobile && <ClearIcon />}>
                        {isMobile ? 'Bỏ chọn' : 'Bỏ chọn'}
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOnlyGranted}
                          onChange={(e) => setShowOnlyGranted(e.target.checked)}
                          size="small"
                        />
                      }
                      label={isMobile ? "Chỉ quyền đã cấp" : "Chỉ hiện quyền đã cấp"}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ButtonGroup size="small" variant="outlined" fullWidth>
                      <Button onClick={resetToRoleDefaults} startIcon={!isMobile && <RefreshIcon />}>
                        {isMobile ? 'Đặt lại' : 'Đặt lại mặc định'}
                      </Button>
                      <Button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} startIcon={!isMobile && <TuneIcon />}>
                        {isMobile ? 'Lọc' : 'Bộ lọc'}
                      </Button>
                    </ButtonGroup>
                  </Grid>
                </Grid>

                {/* Advanced Controls Row */}
                <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <ButtonGroup size="small" variant="outlined" fullWidth>
                      <Button onClick={handleBulkSelectAll} startIcon={<SelectAllIcon />}>
                        Chọn tất cả
                      </Button>
                      <Button onClick={handleBulkSelectNone} startIcon={<ClearIcon />}>
                        Bỏ chọn
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOnlyGranted}
                          onChange={(e) => setShowOnlyGranted(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Chỉ hiện quyền đã cấp"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ButtonGroup size="small" variant="outlined" fullWidth>
                      <Button onClick={resetToRoleDefaults} startIcon={<RefreshIcon />}>
                        Đặt lại mặc định
                      </Button>
                      <Button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} startIcon={<TuneIcon />}>
                        Bộ lọc
                      </Button>
                    </ButtonGroup>
                  </Grid>
                </Grid>

                {/* Bulk Actions */}
                {bulkSelection.size > 0 && (
                  <Box mt={2}>
                    <Alert
                      severity="info"
                      action={
                        <ButtonGroup size="small">
                          <Button onClick={() => handleBulkPermissionChange(true)}>
                            Cấp quyền
                          </Button>
                          <Button onClick={() => handleBulkPermissionChange(false)}>
                            Thu hồi
                          </Button>
                          <Button onClick={() => setBulkSelection(new Set())}>
                            Hủy
                          </Button>
                        </ButtonGroup>
                      }
                    >
                      Đã chọn {bulkSelection.size} quyền hạn
                    </Alert>
                  </Box>
                )}

                {/* Pending Changes Alert */}
                {pendingChanges.size > 0 && (
                  <Box mt={2}>
                    <Alert severity="warning">
                      Bạn có {pendingChanges.size} thay đổi chưa lưu. Nhấn "Lưu thay đổi" để áp dụng.
                    </Alert>
                  </Box>
                )}
              </Paper>

              {/* Reason Field */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Lý do thay đổi (tùy chọn)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                sx={{ mb: 3 }}
                placeholder="Nhập lý do thay đổi quyền hạn..."
              />

              {/* Permission Matrix Display */}
              {viewMode === 'matrix' ? (
                // Matrix View
                filteredResources.map((resource) => (
                  <Accordion
                    key={resource.id}
                    expanded={expandedAccordions.has(resource.id.toString())}
                    onChange={() => toggleAccordion(resource.id.toString())}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Box display="flex" alignItems="center" gap={1}>
                          {getResourceIcon(resource.resource_type)}
                          <Typography variant="h6">
                            {resource.display_name}
                          </Typography>
                        </Box>
                        <Chip
                          label={resource.resource_type}
                          size="small"
                          color={getResourceColor(resource.resource_type) as any}
                        />
                        <Box flexGrow={1} />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            {resource.actions.filter(a => a.has_permission).length}/{resource.actions.length} quyền
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(resource.actions.filter(a => a.has_permission).length / resource.actions.length) * 100}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                            color={getResourceColor(resource.resource_type) as any}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {resource.actions.map((action) => (
                          <Grid item xs={12} sm={6} md={4} key={action.permission_key}>
                            <Card
                              variant="outlined"
                              sx={{
                                height: '100%',
                                border: bulkSelection.has(action.permission_key) ? 2 : 1,
                                borderColor: bulkSelection.has(action.permission_key) ? 'primary.main' : 'divider'
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                  <Box flex={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Checkbox
                                        size="small"
                                        checked={bulkSelection.has(action.permission_key)}
                                        onChange={(e) => {
                                          const newSelection = new Set(bulkSelection);
                                          if (e.target.checked) {
                                            newSelection.add(action.permission_key);
                                          } else {
                                            newSelection.delete(action.permission_key);
                                          }
                                          setBulkSelection(newSelection);
                                        }}
                                      />
                                      <Typography variant="subtitle2">
                                        {action.display_name}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {action.permission_key}
                                    </Typography>
                                    {action.permission_source && (
                                      <Chip
                                        label={action.permission_source === 'role' ? 'Từ vai trò' : 'Cá nhân'}
                                        size="small"
                                        color={action.permission_source === 'role' ? 'primary' : 'secondary'}
                                        sx={{ mt: 0.5, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={action.has_permission}
                                        onChange={(e) => handlePermissionToggle(action.permission_key, e.target.checked)}
                                        color="primary"
                                      />
                                    }
                                    label=""
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                // List View - Table format for better overview
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={bulkSelection.size > 0 && bulkSelection.size < filteredResources.reduce((acc, r) => acc + r.actions.length, 0)}
                            checked={filteredResources.reduce((acc, r) => acc + r.actions.length, 0) > 0 && bulkSelection.size === filteredResources.reduce((acc, r) => acc + r.actions.length, 0)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allPermissions = new Set<string>();
                                filteredResources.forEach(resource => {
                                  resource.actions.forEach(action => {
                                    allPermissions.add(action.permission_key);
                                  });
                                });
                                setBulkSelection(allPermissions);
                              } else {
                                setBulkSelection(new Set());
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>Quyền hạn</TableCell>
                        <TableCell>Danh mục</TableCell>
                        <TableCell>Nguồn</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredResources.map(resource =>
                        resource.actions.map(action => (
                          <TableRow key={action.permission_key}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={bulkSelection.has(action.permission_key)}
                                onChange={(e) => {
                                  const newSelection = new Set(bulkSelection);
                                  if (e.target.checked) {
                                    newSelection.add(action.permission_key);
                                  } else {
                                    newSelection.delete(action.permission_key);
                                  }
                                  setBulkSelection(newSelection);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2">
                                  {action.display_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {action.permission_key}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getResourceIcon(resource.resource_type)}
                                {resource.display_name}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={action.permission_source === 'role' ? 'Từ vai trò' : 'Cá nhân'}
                                size="small"
                                color={action.permission_source === 'role' ? 'primary' : 'secondary'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={action.has_permission ? <CheckCircleIcon /> : <CancelIcon />}
                                label={action.has_permission ? 'Có quyền' : 'Không có quyền'}
                                color={action.has_permission ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={action.has_permission}
                                onChange={(e) => handlePermissionToggle(action.permission_key, e.target.checked)}
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Role Templates Section */}
              <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <RoleIcon />
                  Gán vai trò mẫu
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Chọn một vai trò mẫu để tự động gán tập quyền hạn tương ứng cho nhân viên
                </Typography>

                {/* Role Template Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {roleTemplates.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          border: selectedRoleTemplate === template.id ? 2 : 1,
                          borderColor: selectedRoleTemplate === template.id ? 'primary.main' : 'divider',
                          '&:hover': { borderColor: 'primary.main' }
                        }}
                        onClick={() => setSelectedRoleTemplate(template.id)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            {getRoleIcon(template.name)}
                            <Typography variant="h6" color={template.color}>
                              {template.display_name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {template.description}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={`${template.permission_count} quyền`}
                              size="small"
                              color={template.color as any}
                            />
                            {template.is_system && (
                              <Chip
                                label="Hệ thống"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box display="flex" gap={2} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={handleAssignRoleTemplate}
                    disabled={!selectedRoleTemplate || saving}
                    startIcon={<AddIcon />}
                  >
                    Gán vai trò đã chọn
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedRoleTemplate('')}
                    disabled={!selectedRoleTemplate}
                  >
                    Bỏ chọn
                  </Button>
                </Box>
              </Paper>

              {/* Current Roles Section */}
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <PersonIcon />
                  Vai trò hiện tại ({employeeRoles.length})
                </Typography>
                {employeeRoles.length === 0 ? (
                  <Alert severity="info" icon={<InfoIcon />}>
                    Nhân viên chưa được gán vai trò nào. Hãy chọn một vai trò mẫu ở trên để bắt đầu.
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {employeeRoles.map((role) => (
                      <Grid item xs={12} sm={6} md={4} key={role.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="start">
                              <Box flex={1}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                  {getRoleIcon(role.name)}
                                  <Typography variant="h6" color={role.color}>
                                    {role.display_name}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {role.description}
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                  <Chip
                                    label={`${role.permission_count} quyền`}
                                    size="small"
                                    color={role.color as any}
                                  />
                                  {role.is_system && (
                                    <Chip
                                      label="Hệ thống"
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {role.is_template && (
                                    <Chip
                                      label="Mẫu"
                                      size="small"
                                      color="info"
                                    />
                                  )}
                                </Box>
                              </Box>
                              <Tooltip title="Gỡ bỏ vai trò">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveRole(role.id)}
                                  disabled={saving}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  <HistoryIcon />
                  Lịch sử thay đổi quyền hạn
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Theo dõi tất cả các thay đổi quyền hạn của nhân viên này
                </Typography>

                {auditLog.length === 0 ? (
                  <Alert severity="info" icon={<InfoIcon />}>
                    Chưa có lịch sử thay đổi quyền hạn. Các thay đổi sẽ được ghi lại tự động.
                  </Alert>
                ) : (
                  <Box>
                    {auditLog.map((log) => (
                      <Card key={log.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="start">
                            <Box flex={1}>
                              <Box display="flex" alignItems="center" gap={1} mb={1}>
                                {log.action === 'granted' && <CheckCircleIcon color="success" />}
                                {log.action === 'revoked' && <CancelIcon color="error" />}
                                {log.action === 'role_assigned' && <AddIcon color="primary" />}
                                {log.action === 'role_removed' && <DeleteIcon color="error" />}

                                <Typography variant="subtitle1">
                                  {log.permission_display_name || log.permission_key}
                                </Typography>

                                <Chip
                                  label={
                                    log.action === 'granted' ? 'Cấp quyền' :
                                    log.action === 'revoked' ? 'Thu hồi' :
                                    log.action === 'role_assigned' ? 'Gán vai trò' :
                                    'Gỡ vai trò'
                                  }
                                  size="small"
                                  color={
                                    log.action === 'granted' ? 'success' :
                                    log.action === 'revoked' ? 'error' :
                                    log.action === 'role_assigned' ? 'primary' :
                                    'default'
                                  }
                                />
                              </Box>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Thực hiện bởi: <strong>{log.changed_by_name}</strong>
                              </Typography>

                              {log.role_name && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Vai trò: <strong>{log.role_name}</strong>
                                </Typography>
                              )}

                              {log.reason && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    <strong>Lý do:</strong> {log.reason}
                                  </Typography>
                                </Box>
                              )}

                              {(log.old_value !== undefined && log.new_value !== undefined) && (
                                <Box display="flex" alignItems="center" gap={1} mt={1}>
                                  <Chip
                                    label={log.old_value ? 'Có quyền' : 'Không có quyền'}
                                    size="small"
                                    color={log.old_value ? 'success' : 'default'}
                                    variant="outlined"
                                  />
                                  <Typography variant="caption">→</Typography>
                                  <Chip
                                    label={log.new_value ? 'Có quyền' : 'Không có quyền'}
                                    size="small"
                                    color={log.new_value ? 'success' : 'default'}
                                  />
                                </Box>
                              )}
                            </Box>

                            <Box textAlign="right">
                              <Typography variant="caption" color="text.secondary">
                                {new Date(log.changed_at).toLocaleString('vi-VN')}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Paper>
            </TabPanel>

            {/* Analytics Tab */}
            <TabPanel value={tabValue} index={3}>
              {permissionAnalytics ? (
                <Grid container spacing={3}>
                  {/* Overview Cards */}
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                              <SecurityIcon />
                            </Avatar>
                            <Typography variant="h4" color="primary">
                              {permissionAnalytics.coverage_percentage}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Tỷ lệ quyền hạn
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                              <CheckCircleIcon />
                            </Avatar>
                            <Typography variant="h4" color="success.main">
                              {permissionAnalytics.granted_permissions}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Quyền đã cấp
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                              <RoleIcon />
                            </Avatar>
                            <Typography variant="h4" color="info.main">
                              {permissionAnalytics.role_permissions}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Từ vai trò
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Avatar sx={{
                              bgcolor: permissionAnalytics.risk_level === 'high' ? 'error.main' :
                                       permissionAnalytics.risk_level === 'medium' ? 'warning.main' : 'success.main',
                              width: 48, height: 48
                            }}>
                              <WarningIcon />
                            </Avatar>
                            <Typography variant="h6" color={
                              permissionAnalytics.risk_level === 'high' ? 'error.main' :
                              permissionAnalytics.risk_level === 'medium' ? 'warning.main' : 'success.main'
                            }>
                              {permissionAnalytics.risk_level === 'high' ? 'Cao' :
                               permissionAnalytics.risk_level === 'medium' ? 'Trung bình' : 'Thấp'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Mức độ rủi ro
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Category Breakdown */}
                  <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                        <BarChartIcon />
                        Phân tích theo danh mục
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {permissionAnalytics.categories.map((category, index) => (
                          <Box key={index} sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" fontWeight="medium">
                                {category.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {category.granted}/{category.total} ({category.percentage}%)
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={category.percentage}
                              sx={{ height: 8, borderRadius: 4 }}
                              color={category.percentage >= 80 ? 'success' :
                                     category.percentage >= 50 ? 'warning' : 'error'}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>

                  {/* Quick Actions */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                        <SpeedIcon />
                        Hành động nhanh
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<CopyIcon />}
                          onClick={() => setComparisonMode(true)}
                        >
                          So sánh quyền hạn
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={exportPermissions}
                        >
                          Xuất báo cáo
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AutoAwesomeIcon />}
                          onClick={() => setShowRoleWizard(true)}
                        >
                          Gợi ý vai trò
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={resetToRoleDefaults}
                        >
                          Đặt lại mặc định
                        </Button>
                      </Stack>
                    </Card>
                  </Grid>

                  {/* Recent Activity */}
                  <Grid item xs={12}>
                    <Card sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                        <TimelineIcon />
                        Hoạt động gần đây
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {auditLog.slice(0, 5).map((log, index) => (
                          <Box key={index} display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                            <Avatar sx={{
                              bgcolor: log.action === 'granted' ? 'success.main' :
                                       log.action === 'revoked' ? 'error.main' : 'info.main',
                              width: 32, height: 32
                            }}>
                              {log.action === 'granted' ? <CheckCircleIcon /> :
                               log.action === 'revoked' ? <CancelIcon /> : <RoleIcon />}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="body2">
                                <strong>{log.permission_key}</strong> - {
                                  log.action === 'granted' ? 'Cấp quyền' :
                                  log.action === 'revoked' ? 'Thu hồi quyền' :
                                  log.action === 'role_assigned' ? 'Gán vai trò' : 'Gỡ vai trò'
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(log.changed_at).toLocaleString('vi-VN')} bởi {log.changed_by_name}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                  <Typography variant="body1" color="text.secondary">
                    Đang tải dữ liệu phân tích...
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          {pendingChanges.size > 0 && (
            <Alert severity="warning" sx={{ flex: 1 }}>
              Có {pendingChanges.size} thay đổi chưa lưu
            </Alert>
          )}
        </Box>

        <ButtonGroup>
          <Button
            onClick={onClose}
            disabled={saving}
            variant="outlined"
          >
            Đóng
          </Button>

          {tabValue === 0 && (
            <Button
              onClick={loadPermissionData}
              disabled={loading || saving}
              startIcon={<RefreshIcon />}
            >
              Làm mới
            </Button>
          )}

          {tabValue === 0 && pendingChanges.size > 0 && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSavePermissions}
              disabled={saving || !reason.trim()}
              color="primary"
            >
              {saving ? 'Đang lưu...' : `Lưu thay đổi (${pendingChanges.size})`}
            </Button>
          )}
        </ButtonGroup>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionManagementModal;
