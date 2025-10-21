import { Hono } from 'hono'
import { Env } from '../../types'
import { BrandService } from '../../services/BrandService'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c: any) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '100')
  const svc = new BrandService(c.env)
  const result = await svc.getBrands('default', { page, limit })
  if (!result.success) return c.json({ success: false, message: result.error || 'Failed to fetch brands' }, 500)
  return c.json({
    success: true,
    brands: result.data || [],
    pagination: result.pagination
  })
})

app.get('/:id', async (c: any) => {
  const id = c.req.param('id')
  const svc = new BrandService(c.env)
  const result = await svc.getBrandById(id, 'default')
  if (!result.success) return c.json({ success: false, message: result.error || 'Brand not found' }, 404)
  return c.json({ success: true, data: result.data })
})

app.post('/', async (c: any) => {
  const data = await c.req.json()
  if (!data.name) return c.json({ success: false, message: 'Brand name is required' }, 400)
  const svc = new BrandService(c.env)
  const result = await svc.createBrand('default', {
    name: data.name,
    description: data.description,
    logo_url: data.logo_url,
    website: data.website,
    is_active: data.is_active !== false
  })
  if (!result.success) return c.json({ success: false, message: result.error || 'Failed to create brand' }, 500)
  return c.json({ success: true, data: result.data, message: 'Brand created successfully' }, 201)
})

app.put('/:id', async (c: any) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const svc = new BrandService(c.env)
  const result = await svc.updateBrand(id, 'default', {
    name: data.name,
    description: data.description,
    logo_url: data.logo_url,
    website: data.website,
    is_active: data.is_active
  })
  if (!result.success) return c.json({ success: false, message: result.error || 'Brand not found' }, 404)
  return c.json({ success: true, data: result.data, message: 'Brand updated successfully' })
})

app.delete('/:id', async (c: any) => {
  const id = c.req.param('id')
  const svc = new BrandService(c.env)
  const result = await svc.deleteBrand(id, 'default')
  if (!result.success) return c.json({ success: false, message: result.error || 'Brand not found' }, 404)
  return c.json({ success: true, message: 'Brand deleted successfully' })
})

export default app


