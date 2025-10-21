import { Hono } from 'hono'
import { Env } from '../../types'

import checkoutRouter from './checkout'
import simpleCartRouter from './simple-cart'

const app = new Hono<{ Bindings: Env }>()

// Use simple cart for basic cart operations (no auth required)
app.route('/', simpleCartRouter)

// Keep checkout for advanced operations
app.route('/checkout', checkoutRouter)

export default app