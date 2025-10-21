/**
 * Users Module Aggregator
 * User management, roles, and employees
 */

import { Hono } from 'hono'
import { Env } from '../../types'

import usersRouter from '../users/index'
import rolesRouter from '../roles/index'
import employeesRouter from '../employees/index'

const app = new Hono<{ Bindings: Env }>()

app.route('/users', usersRouter)
app.route('/roles', rolesRouter)
app.route('/employees', employeesRouter)

export default app


