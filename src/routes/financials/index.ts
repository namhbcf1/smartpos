/**
 * Financials Module Aggregator
 * Combines invoices, payments, and debts routes
 */

import { Hono } from 'hono'
import { Env } from '../../types'

import invoicesRouter from '../invoices/index'
import paymentsRouter from '../payments/index'
import debtsRouter from '../debts/index'
import financialRouter from '../financial/index'

const app = new Hono<{ Bindings: Env }>()

app.route('/invoices', invoicesRouter)
app.route('/payments', paymentsRouter)
app.route('/debts', debtsRouter)
app.route('/financial', financialRouter)

export default app


