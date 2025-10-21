/**
 * Admin Routes
 * Cloudflare Workers - Hono Framework
 *
 * Administrative endpoints for system management
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import seedRouter from './seed'
import dataValidationRouter from './data-validation'

const app = new Hono<{ Bindings: Env }>()

// Apply authentication to all admin routes
app.use('*', authenticate)

// Mount admin sub-routes
app.route('/seed', seedRouter)
app.route('/data-validation', dataValidationRouter)

export default app
