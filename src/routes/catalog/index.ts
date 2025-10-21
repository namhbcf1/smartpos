import { Hono } from 'hono'
import { Env } from '../../types'

import productsRouter from './products'
import categoriesRouter from './categories'
import brandsRouter from './brands'

const app = new Hono<{ Bindings: Env }>()

app.route('/products', productsRouter)
app.route('/categories', categoriesRouter)
app.route('/brands', brandsRouter)

export default app


