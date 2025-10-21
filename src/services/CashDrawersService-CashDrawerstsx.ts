import { Env } from '../types';

export class CashDrawersService_CashDrawerstsx {
  constructor(private env: Env) {}

  async list(tenantId: string) {
    const res = await this.env.DB.prepare(`SELECT * FROM cash_drawers WHERE tenant_id = ? ORDER BY created_at DESC`).bind(tenantId).all<any>();
    return res.results || [];
  }

  async open(tenant_id: string, drawer_id: string, opened_by: string, starting_balance: number = 0) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await this.env.DB.prepare(`INSERT INTO cash_drawer_sessions (id, tenant_id, drawer_id, opened_by, opened_at, starting_balance, status) VALUES (?, ?, ?, ?, ?, ?, 'open')`).bind(id, tenant_id, drawer_id, opened_by, now, starting_balance).run();
    await this.env.DB.prepare(`UPDATE cash_drawers SET is_open = 1, last_opened_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, drawer_id).run();
    await this.env.DB.prepare(`INSERT INTO cash_drawer_transactions (id, tenant_id, drawer_id, session_id, transaction_type, amount, description, created_by, created_at) VALUES (?, ?, ?, ?, 'open', ?, 'Drawer opened', ?, ?)`).bind(crypto.randomUUID(), tenant_id, drawer_id, id, starting_balance, opened_by, now).run();
    return await this.env.DB.prepare(`SELECT * FROM cash_drawer_sessions WHERE id = ?`).bind(id).first<any>();
  }

  async close(tenant_id: string, drawer_id: string, closed_by: string, actual_balance: number) {
    const session = await this.env.DB.prepare(`SELECT * FROM cash_drawer_sessions WHERE drawer_id = ? AND status = 'open'`).bind(drawer_id).first<any>();
    if (!session) throw new Error('No open session');
    const now = new Date().toISOString();
    await this.env.DB.prepare(`UPDATE cash_drawer_sessions SET closed_by = ?, closed_at = ?, ending_balance = ?, status = 'closed', updated_at = ? WHERE id = ?`).bind(closed_by, now, actual_balance, now, session.id).run();
    await this.env.DB.prepare(`UPDATE cash_drawers SET is_open = 0, last_closed_at = ?, current_balance = ?, updated_at = ? WHERE id = ?`).bind(now, actual_balance, now, drawer_id).run();
    await this.env.DB.prepare(`INSERT INTO cash_drawer_transactions (id, tenant_id, drawer_id, session_id, transaction_type, amount, description, created_by, created_at) VALUES (?, ?, ?, ?, 'close', ?, 'Drawer closed', ?, ?)`).bind(crypto.randomUUID(), tenant_id, drawer_id, session.id, actual_balance, closed_by, now).run();
    return await this.env.DB.prepare(`SELECT * FROM cash_drawer_sessions WHERE id = ?`).bind(session.id).first<any>();
  }
}

export default CashDrawersService_CashDrawerstsx;

