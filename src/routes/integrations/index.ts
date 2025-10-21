/**
 * Integrations Module Aggregator
 * Cash-only mode - Payment integrations removed
 */

import { Hono } from 'hono'
import { Env } from '../../types'

const app = new Hono<{ Bindings: Env }>()

// Cash-only mode - No external payment integrations
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Cash-only mode - No external payment integrations available'
  })
})

export default app


