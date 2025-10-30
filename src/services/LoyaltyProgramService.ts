import { D1Database } from '@cloudflare/workers-types';

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export interface LoyaltyConfig {
  tier: LoyaltyTier;
  minPoints: number;
  maxPoints: number;
  pointsMultiplier: number;
  discountPercent: number;
  benefits: string[];
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  reason: string;
  orderId?: string;
  createdAt: string;
}

export class LoyaltyProgramService {
  private configs: LoyaltyConfig[] = [
    { tier: LoyaltyTier.BRONZE, minPoints: 0, maxPoints: 999, pointsMultiplier: 1, discountPercent: 0, benefits: [] },
    { tier: LoyaltyTier.SILVER, minPoints: 1000, maxPoints: 4999, pointsMultiplier: 1.2, discountPercent: 5, benefits: ['Birthday bonus', 'Free shipping'] },
    { tier: LoyaltyTier.GOLD, minPoints: 5000, maxPoints: 14999, pointsMultiplier: 1.5, discountPercent: 10, benefits: ['Birthday bonus', 'Free shipping', 'Priority support', 'Early access'] },
    { tier: LoyaltyTier.PLATINUM, minPoints: 15000, maxPoints: 49999, pointsMultiplier: 2, discountPercent: 15, benefits: ['Birthday bonus', 'Free shipping', 'Priority support', 'Early access', 'Exclusive deals', 'Personal shopper'] },
    { tier: LoyaltyTier.DIAMOND, minPoints: 50000, maxPoints: Infinity, pointsMultiplier: 3, discountPercent: 20, benefits: ['Birthday bonus', 'Free shipping', 'Priority support', 'Early access', 'Exclusive deals', 'Personal shopper', 'VIP events', 'Concierge service'] }
  ];

  constructor(private db: D1Database) {}

  getTierByPoints(points: number): LoyaltyConfig {
    return this.configs.find(c => points >= c.minPoints && points <= c.maxPoints) || this.configs[0];
  }

  calculatePointsForPurchase(amount: number, tier: LoyaltyTier): number {
    const config = this.configs.find(c => c.tier === tier) || this.configs[0];
    const basePoints = Math.floor(amount / 10000);
    return Math.floor(basePoints * config.pointsMultiplier);
  }

  async awardPoints(customerId: string, points: number, reason: string, orderId?: string, tenantId: string = 'default'): Promise<void> {
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO loyalty_transactions (id, customer_id, points, type, reason, order_id, tenant_id, created_at)
        VALUES (?, ?, ?, 'earn', ?, ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), customerId, points, reason, orderId || null, tenantId),

      this.db.prepare(`
        UPDATE customers
        SET loyalty_points = COALESCE(loyalty_points, 0) + ?,
            loyalty_tier = ?,
            updated_at = datetime('now')
        WHERE id = ? AND tenant_id = ?
      `).bind(points, this.getTierByPoints(points).tier, customerId, tenantId)
    ]);
  }

  async redeemPoints(customerId: string, points: number, reason: string, tenantId: string = 'default'): Promise<boolean> {
    const customer = await this.db.prepare(`
      SELECT loyalty_points FROM customers WHERE id = ? AND tenant_id = ?
    `).bind(customerId, tenantId).first() as any;

    if (!customer || (customer.loyalty_points || 0) < points) {
      return false;
    }

    const newPoints = customer.loyalty_points - points;
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO loyalty_transactions (id, customer_id, points, type, reason, tenant_id, created_at)
        VALUES (?, ?, ?, 'redeem', ?, ?, datetime('now'))
      `).bind(crypto.randomUUID(), customerId, -points, reason, tenantId),

      this.db.prepare(`
        UPDATE customers
        SET loyalty_points = ?,
            loyalty_tier = ?,
            updated_at = datetime('now')
        WHERE id = ? AND tenant_id = ?
      `).bind(newPoints, this.getTierByPoints(newPoints).tier, customerId, tenantId)
    ]);

    return true;
  }

  async getTransactions(customerId: string, tenantId: string = 'default', limit: number = 50): Promise<LoyaltyTransaction[]> {
    const result = await this.db.prepare(`
      SELECT * FROM loyalty_transactions
      WHERE customer_id = ? AND tenant_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(customerId, tenantId, limit).all();

    return result.results as any[];
  }

  async getTierStats(tenantId: string = 'default'): Promise<Record<LoyaltyTier, { count: number; totalPoints: number }>> {
    const result = await this.db.prepare(`
      SELECT loyalty_tier, COUNT(*) as count, SUM(loyalty_points) as total_points
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
      GROUP BY loyalty_tier
    `).bind(tenantId).all();

    const stats: any = {};
    Object.values(LoyaltyTier).forEach(tier => {
      stats[tier] = { count: 0, totalPoints: 0 };
    });

    result.results.forEach((row: any) => {
      if (row.loyalty_tier) {
        stats[row.loyalty_tier] = {
          count: row.count,
          totalPoints: row.total_points || 0
        };
      }
    });

    return stats;
  }

  async updateTiersForAllCustomers(tenantId: string = 'default'): Promise<{ updated: number }> {
    const customers = await this.db.prepare(`
      SELECT id, loyalty_points FROM customers WHERE tenant_id = ? AND is_active = 1
    `).bind(tenantId).all();

    let updated = 0;
    for (const customer of customers.results as any[]) {
      const tier = this.getTierByPoints(customer.loyalty_points || 0);
      await this.db.prepare(`
        UPDATE customers SET loyalty_tier = ?, updated_at = datetime('now')
        WHERE id = ? AND tenant_id = ?
      `).bind(tier.tier, customer.id, tenantId).run();
      updated++;
    }

    return { updated };
  }
}
