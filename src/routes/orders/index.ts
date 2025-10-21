import { Hono } from 'hono'
import { Env } from '../../types'

import ordersRouter from './orders'
import completedOrdersRouter from './completed-orders'
import cancelledOrdersRouter from './cancelled-orders'
import posRouter from './pos'
import orderTemplatesRouter from './order-templates'

const app = new Hono<{ Bindings: Env }>()

app.route('/orders', ordersRouter)
app.route('/orders/completed', completedOrdersRouter)
app.route('/orders/cancelled', cancelledOrdersRouter)
app.route('/pos', posRouter)
app.route('/order-templates', orderTemplatesRouter)

export default app


