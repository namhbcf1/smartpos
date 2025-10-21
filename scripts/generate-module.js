#!/usr/bin/env node

/**
 * 🚀 AUTO CODE GENERATOR - Smart POS
 *
 * Tự động generate:
 * - Backend Service (extends BaseService)
 * - Backend Route (Hono + Zod validation)
 * - Frontend Page (Ant Design CRUD)
 *
 * Usage: node scripts/generate-module.js <module-name>
 * Example: node scripts/generate-module.js store-locations
 */

const fs = require('fs');
const path = require('path');

// Colors for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

// Get module name from command line
const moduleName = process.argv[2];

if (!moduleName) {
  log.error('Module name is required!');
  console.log('\nUsage: node scripts/generate-module.js <module-name>');
  console.log('Example: node scripts/generate-module.js store-locations\n');
  process.exit(1);
}

// Convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Convert kebab-case to camelCase
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Get plural form (simple)
function toPlural(str) {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s')) {
    return str + 'es';
  }
  return str + 's';
}

const modulePascal = toPascalCase(moduleName);
const moduleCamel = toCamelCase(moduleName);
const modulePlural = toPlural(moduleName.split('-').pop());
const tableName = moduleName.replace(/-/g, '_') + 's';

log.title('🚀 Smart POS Auto Code Generator');
log.info(`Module: ${moduleName}`);
log.info(`Class: ${modulePascal}Service`);
log.info(`Table: ${tableName}`);
log.info('');

// ============================================
// BACKEND SERVICE TEMPLATE
// ============================================
const serviceTemplate = `import { BaseService } from './BaseService';
import { logAudit } from '../utils/audit';
import { formatPaginationResponse } from '../utils/pagination';

export interface ${modulePascal} {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ${modulePascal}Filters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export class ${modulePascal}Service extends BaseService {
  /**
   * Get list of ${modulePlural} with pagination and filters
   */
  async get${modulePascal}s(tenantId: string, filters: ${modulePascal}Filters = {}) {
    const { page = 1, limit = 20, search, is_active } = filters;
    const offset = (page - 1) * limit;

    let query = \`
      SELECT * FROM ${tableName}
      WHERE tenant_id = ? AND deleted_at IS NULL
    \`;
    const params: any[] = [tenantId];

    if (search) {
      query += \` AND (name LIKE ? OR description LIKE ?)\`;
      params.push(\`%\${search}%\`, \`%\${search}%\`);
    }

    if (is_active !== undefined) {
      query += \` AND is_active = ?\`;
      params.push(is_active ? 1 : 0);
    }

    query += \` ORDER BY created_at DESC LIMIT ? OFFSET ?\`;
    params.push(limit, offset);

    const items = await this.db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = \`SELECT COUNT(*) as total FROM ${tableName} WHERE tenant_id = ? AND deleted_at IS NULL\`;
    const countParams: any[] = [tenantId];

    if (search) {
      countQuery += \` AND (name LIKE ? OR description LIKE ?)\`;
      countParams.push(\`%\${search}%\`, \`%\${search}%\`);
    }

    if (is_active !== undefined) {
      countQuery += \` AND is_active = ?\`;
      countParams.push(is_active ? 1 : 0);
    }

    const totalResult = await this.db.prepare(countQuery).bind(...countParams).first();
    const total = totalResult?.total || 0;

    return {
      data: items.results,
      pagination: formatPaginationResponse(page, limit, total)
    };
  }

  /**
   * Get ${moduleCamel} by ID
   */
  async get${modulePascal}ById(tenantId: string, id: string): Promise<${modulePascal} | null> {
    const cacheKey = \`\${tenantId}:${moduleCamel}:\${id}\`;

    // Try cache first
    const cached = await this.kv.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const query = \`
      SELECT * FROM ${tableName}
      WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL
    \`;

    const result = await this.db.prepare(query).bind(tenantId, id).first();

    if (result) {
      // Cache for 5 minutes
      await this.kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    }

    return result;
  }

  /**
   * Create new ${moduleCamel}
   */
  async create${modulePascal}(
    tenantId: string,
    data: Omit<${modulePascal}, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
    userId?: string
  ) {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const query = \`
        INSERT INTO ${tableName} (
          id, tenant_id, name, description, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      \`;

      await this.db.prepare(query).bind(
        id,
        tenantId,
        data.name,
        data.description || null,
        data.is_active ? 1 : 0,
        now,
        now
      ).run();

      // Log audit
      if (userId) {
        await logAudit(this.kv, tenantId, userId, 'CREATE', '${moduleCamel}', id, data);
      }

      return { success: true, id };
    } catch (error) {
      console.error('Create ${moduleCamel} error:', error);
      return { success: false, error: 'Failed to create ${moduleCamel}' };
    }
  }

  /**
   * Update ${moduleCamel}
   */
  async update${modulePascal}(
    tenantId: string,
    id: string,
    updateData: Partial<${modulePascal}>,
    userId?: string
  ) {
    try {
      // Check if exists
      const existing = await this.get${modulePascal}ById(tenantId, id);
      if (!existing) {
        return { success: false, error: '${modulePascal} not found' };
      }

      const now = new Date().toISOString();
      const fields = [];
      const params = [];

      if (updateData.name !== undefined) {
        fields.push('name = ?');
        params.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        fields.push('description = ?');
        params.push(updateData.description);
      }
      if (updateData.is_active !== undefined) {
        fields.push('is_active = ?');
        params.push(updateData.is_active ? 1 : 0);
      }

      if (fields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      fields.push('updated_at = ?');
      params.push(now, tenantId, id);

      const query = \`
        UPDATE ${tableName}
        SET \${fields.join(', ')}
        WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL
      \`;

      await this.db.prepare(query).bind(...params).run();

      // Invalidate cache
      await this.kv.delete(\`\${tenantId}:${moduleCamel}:\${id}\`);

      // Log audit
      if (userId) {
        await logAudit(this.kv, tenantId, userId, 'UPDATE', '${moduleCamel}', id, updateData);
      }

      return { success: true };
    } catch (error) {
      console.error('Update ${moduleCamel} error:', error);
      return { success: false, error: 'Failed to update ${moduleCamel}' };
    }
  }

  /**
   * Delete ${moduleCamel} (soft delete)
   */
  async delete${modulePascal}(tenantId: string, id: string, userId?: string) {
    try {
      const existing = await this.get${modulePascal}ById(tenantId, id);
      if (!existing) {
        return { success: false, error: '${modulePascal} not found' };
      }

      const now = new Date().toISOString();
      const query = \`
        UPDATE ${tableName}
        SET deleted_at = ?, updated_at = ?
        WHERE tenant_id = ? AND id = ? AND deleted_at IS NULL
      \`;

      await this.db.prepare(query).bind(now, now, tenantId, id).run();

      // Invalidate cache
      await this.kv.delete(\`\${tenantId}:${moduleCamel}:\${id}\`);

      // Log audit
      if (userId) {
        await logAudit(this.kv, tenantId, userId, 'DELETE', '${moduleCamel}', id, {});
      }

      return { success: true };
    } catch (error) {
      console.error('Delete ${moduleCamel} error:', error);
      return { success: false, error: 'Failed to delete ${moduleCamel}' };
    }
  }
}
`;

// ============================================
// BACKEND ROUTE TEMPLATE
// ============================================
const routeTemplate = `import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { ${modulePascal}Service } from '../../services/${modulePascal}Service';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();
app.use('*', authenticate);

const ${modulePascal}Schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

// GET /api/${moduleName} - List ${modulePlural}
app.get('/', async (c: any) => {
  try {
    const service = new ${modulePascal}Service(c.env);
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search');
    const is_active = c.req.query('is_active') === 'true' ? true : c.req.query('is_active') === 'false' ? false : undefined;

    const result = await service.get${modulePascal}s(tenantId, {
      page,
      limit,
      search,
      is_active
    });

    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('List ${modulePlural} error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch ${modulePlural}'
    }, 500);
  }
});

// GET /api/${moduleName}/:id - Get ${moduleCamel} details
app.get('/:id', async (c: any) => {
  try {
    const service = new ${modulePascal}Service(c.env);
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const id = c.req.param('id');

    const item = await service.get${modulePascal}ById(tenantId, id);

    if (!item) {
      return c.json({ success: false, error: '${modulePascal} not found' }, 404);
    }

    return c.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get ${moduleCamel} error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch ${moduleCamel}'
    }, 500);
  }
});

// POST /api/${moduleName} - Create ${moduleCamel}
app.post('/', validateRequest({ body: ${modulePascal}Schema }), async (c: any) => {
  try {
    const service = new ${modulePascal}Service(c.env);
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const user = getUser(c);
    const data = c.get('validatedBody');

    const result = await service.create${modulePascal}(tenantId, data, user?.id);

    if (result.success) {
      return c.json({
        success: true,
        data: { id: result.id },
        message: '${modulePascal} created successfully'
      }, 201);
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
  } catch (error) {
    console.error('Create ${moduleCamel} error:', error);
    return c.json({
      success: false,
      error: 'Failed to create ${moduleCamel}'
    }, 500);
  }
});

// PUT /api/${moduleName}/:id - Update ${moduleCamel}
app.put('/:id', validateRequest({ body: ${modulePascal}Schema.partial() }), async (c: any) => {
  try {
    const service = new ${modulePascal}Service(c.env);
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const user = getUser(c);
    const id = c.req.param('id');
    const updateData = c.get('validatedBody');

    const result = await service.update${modulePascal}(tenantId, id, updateData, user?.id);

    if (result.success) {
      return c.json({
        success: true,
        message: '${modulePascal} updated successfully'
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, result.error === '${modulePascal} not found' ? 404 : 400);
    }
  } catch (error) {
    console.error('Update ${moduleCamel} error:', error);
    return c.json({
      success: false,
      error: 'Failed to update ${moduleCamel}'
    }, 500);
  }
});

// DELETE /api/${moduleName}/:id - Delete ${moduleCamel}
app.delete('/:id', async (c: any) => {
  try {
    const service = new ${modulePascal}Service(c.env);
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const user = getUser(c);
    const id = c.req.param('id');

    const result = await service.delete${modulePascal}(tenantId, id, user?.id);

    if (result.success) {
      return c.json({
        success: true,
        message: '${modulePascal} deleted successfully'
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, result.error === '${modulePascal} not found' ? 404 : 400);
    }
  } catch (error) {
    console.error('Delete ${moduleCamel} error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete ${moduleCamel}'
    }, 500);
  }
});

export default app;
`;

// ============================================
// FRONTEND PAGE TEMPLATE (Ant Design)
// ============================================
const frontendTemplate = `import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  Tooltip,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useCrud } from '../../hooks/useCrud'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface ${modulePascal} {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const ${modulePascal}Page: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<${modulePascal} | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)

  const { state, setFilters, setPage, setPageSize, createItem, updateItem, deleteItem, fetchList } = useCrud<${modulePascal}>({
    endpoint: '/${moduleName}',
    initialPageSize: 20
  })

  useEffect(() => {
    setFilters({
      search: searchText || undefined,
      is_active: activeFilter
    })
  }, [searchText, activeFilter])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEdit = (item: ${modulePascal}) => {
    setEditingItem(item)
    form.setFieldsValue(item)
    setIsModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id)
      message.success('Đã xóa thành công')
    } catch (error) {
      message.error('Lỗi khi xóa')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, values)
        message.success('Đã cập nhật thành công')
      } else {
        await createItem(values)
        message.success('Đã thêm thành công')
      }
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('Lỗi khi lưu')
    }
  }

  const columns: ColumnsType<${modulePascal}> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} icon={isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: ${modulePascal}) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit2 size={16} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              ${modulePascal}
            </Title>
            <Text type="secondary">
              Quản lý ${modulePlural}
            </Text>
          </div>
          <Space>
            <Button
              icon={<RefreshCw size={16} />}
              onClick={() => fetchList()}
              loading={state.loading}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleAdd}
            >
              Thêm mới
            </Button>
          </Space>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số"
              value={state.pagination.total}
              prefix={<CheckCircle size={20} style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={state.data.filter(item => item.is_active).length}
              prefix={<CheckCircle size={20} style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Button
                type={activeFilter === undefined ? 'primary' : 'default'}
                onClick={() => setActiveFilter(undefined)}
              >
                Tất cả
              </Button>
              <Button
                type={activeFilter === true ? 'primary' : 'default'}
                onClick={() => setActiveFilter(true)}
              >
                Hoạt động
              </Button>
              <Button
                type={activeFilter === false ? 'primary' : 'default'}
                onClick={() => setActiveFilter(false)}
              >
                Tạm dừng
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={state.data}
          loading={state.loading}
          rowKey="id"
          pagination={{
            current: state.pagination.page,
            pageSize: state.pagination.pageSize,
            total: state.pagination.total,
            showSizeChanger: true,
            showTotal: (total) => \`Tổng \${total} bản ghi\`,
            onChange: (page, pageSize) => {
              setPage(page)
              setPageSize(pageSize || 20)
            }
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa' : 'Thêm mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Nhập tên" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả" />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ${modulePascal}Page
`;

// ============================================
// CREATE FILES
// ============================================

// Create backend service
const servicePath = path.join(__dirname, '..', 'src', 'services', `${modulePascal}Service.ts`);
fs.writeFileSync(servicePath, serviceTemplate);
log.success(`Created service: src/services/${modulePascal}Service.ts`);

// Create backend route
const routePath = path.join(__dirname, '..', 'src', 'routes', 'api', `${moduleName}.ts`);
fs.writeFileSync(routePath, routeTemplate);
log.success(`Created route: src/routes/api/${moduleName}.ts`);

// Create frontend page
const pagePath = path.join(__dirname, '..', 'frontend', 'src', 'pages', moduleName, `${modulePascal}.tsx`);
const pageDir = path.dirname(pagePath);
if (!fs.existsSync(pageDir)) {
  fs.mkdirSync(pageDir, { recursive: true });
}
fs.writeFileSync(pagePath, frontendTemplate);
log.success(`Created page: frontend/src/pages/${moduleName}/${modulePascal}.tsx`);

// ============================================
// MIGRATION TEMPLATE
// ============================================
const migrationTemplate = `-- Migration: Create ${tableName} table
-- Date: ${new Date().toISOString().split('T')[0]}

CREATE TABLE IF NOT EXISTS ${tableName} (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant ON ${tableName}(tenant_id);
CREATE INDEX IF NOT EXISTS idx_${tableName}_active ON ${tableName}(is_active, deleted_at);
CREATE INDEX IF NOT EXISTS idx_${tableName}_created ON ${tableName}(created_at DESC);

-- Insert sample data (optional)
-- INSERT INTO ${tableName} (id, tenant_id, name, description, is_active, created_at, updated_at)
-- VALUES ('sample-id-1', 'default', 'Sample ${modulePascal}', 'This is a sample', 1, datetime('now'), datetime('now'));
`;

const migrationPath = path.join(__dirname, '..', 'migrations', `${Date.now()}_create_${tableName}.sql`);
const migrationDir = path.dirname(migrationPath);
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}
fs.writeFileSync(migrationPath, migrationTemplate);
log.success(`Created migration: migrations/${Date.now()}_create_${tableName}.sql`);

// ============================================
// INSTRUCTIONS
// ============================================
log.title('✅ Code generation completed!');
log.info('');
log.info('Next steps:');
log.info('1. Register route in src/routes/api/index.ts:');
console.log(`   ${colors.cyan}import ${moduleCamel}Routes from './${moduleName}';${colors.reset}`);
console.log(`   ${colors.cyan}app.route('/api/${moduleName}', ${moduleCamel}Routes);${colors.reset}`);
log.info('');
log.info('2. Run migration:');
console.log(`   ${colors.cyan}wrangler d1 migrations apply "Smart POS Free"${colors.reset}`);
log.info('');
log.info('3. Add route to frontend (App.tsx or router):');
console.log(`   ${colors.cyan}<Route path="/${moduleName}" element={<${modulePascal}Page />} />${colors.reset}`);
log.info('');
log.info('4. Add menu item to sidebar:');
console.log(`   ${colors.cyan}{ title: '${modulePascal}', path: '/${moduleName}', icon: <Icon /> }${colors.reset}`);
log.info('');
log.success('Happy coding! 🚀');