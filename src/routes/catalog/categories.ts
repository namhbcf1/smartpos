import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate, getUser } from '../../middleware/auth'
import { CategoryService_CategoriesManagementtsx } from '../../services/CategoryService-CategoriesManagementtsx'
import { SimpleCategoryService } from '../../services/CategoryService'
import { ProductService } from '../../services/ProductService'
import { ProductService_ProductListtsx } from '../../services/ProductService-ProductListtsx'

const app = new Hono<{ Bindings: Env }>()

// Public routes - no authentication required
app.get('/', async (c: any) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '100')
  const svc = new CategoryService_CategoriesManagementtsx(c.env)
  const result = await svc.getCategories({}, { page, limit })
  return c.json({ success: true, categories: result.data, pagination: result.pagination })
})

app.get('/:id', async (c: any) => {
  const id = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || (c.get as any)('tenantId') || 'default'
  const svc = new SimpleCategoryService(c.env)
  const result = await svc.getCategories(1, 100)
  const category = result.categories.find((cat: any) => cat.id === id)
  if (!category) return c.json({ success: false, message: 'Category not found' }, 404)
  return c.json({ success: true, data: category })
})

// Protected routes - authentication required for write operations
app.post('/', authenticate, async (c: any) => {
  const user = getUser(c)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const { name, description, parent_id, is_active } = await c.req.json()
  if (!name) return c.json({ success: false, message: 'Category name is required' }, 400)
  const productService = new ProductService(c.env)
  const result = await productService.createCategory({ tenant_id: tenantId, name, description, parent_id, is_active })
  if (!result.success) return c.json({ success: false, message: result.error }, 400)
  return c.json({ success: true, data: result.category, message: 'Category created successfully' }, 201)
})

app.put('/:id', authenticate, async (c: any) => {
  const user = getUser(c)
  const categoryId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const { name, description, parent_id, is_active } = await c.req.json()
  const productService = new ProductService(c.env)
  const result = await productService.updateCategory(categoryId, tenantId, { name, description, parent_id, is_active })
  if (!result.success) return c.json({ success: false, message: result.error }, 400)
  return c.json({ success: true, data: result.category, message: 'Category updated successfully' })
})

app.delete('/:id', authenticate, async (c: any) => {
  const user = getUser(c)
  const categoryId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const productService = new ProductService(c.env)
  const result = await productService.deleteCategory(categoryId, tenantId)
  if (!result.success) return c.json({ success: false, message: result.error }, 400)
  return c.json({ success: true, message: 'Category deleted successfully' })
})

app.get('/:id/products', async (c: any) => {
  const categoryId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const { page = '1', limit = '50', search, sort_by = 'name', sort_order = 'asc' } = c.req.query()
  const productService = new ProductService(c.env)
  const result = await productService.getCategoryProducts(categoryId, tenantId, {
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sort_by,
    sort_order: sort_order as 'asc' | 'desc'
  })
  if (!result.success) return c.json({ success: false, message: result.error }, 400)
  return c.json({ success: true, data: result.products, pagination: result.pagination })
})

export default app
