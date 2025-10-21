/**
 * Promos Module Aggregator
 * Combines promotions, discounts, and tax routes
 */

import { Hono } from 'hono'
import { Env } from '../../types'

import promotionsRouter from '../promotions/index'
import discountsRouter from '../discounts/index'
import taxRouter from '../taxes/index'

const app = new Hono<{ Bindings: Env }>()

app.route('/promotions', promotionsRouter)
app.route('/discounts', discountsRouter)
app.route('/taxes', taxRouter)

export default app


