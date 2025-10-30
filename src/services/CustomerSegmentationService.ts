/**
 * Customer Segmentation Service
 *
 * Implements RFM (Recency, Frequency, Monetary) analysis
 * to segment customers and enable targeted marketing.
 *
 * RFM Scoring:
 * - Recency (R): How recently did the customer make a purchase?
 * - Frequency (F): How often do they purchase?
 * - Monetary (M): How much do they spend?
 *
 * Each metric is scored 1-5, with 5 being the best.
 */

import { D1Database } from '@cloudflare/workers-types';

export interface RFMScore {
  customerId: string;
  recencyScore: number;  // 1-5
  frequencyScore: number;  // 1-5
  monetaryScore: number;  // 1-5
  rfmScore: string;  // e.g., "555" for best customers
  segment: CustomerSegment;
  recencyDays: number;
  frequency: number;
  monetary: number;
}

export enum CustomerSegment {
  CHAMPIONS = 'Champions',  // 555, 554, 544, 545
  LOYAL_CUSTOMERS = 'Loyal Customers',  // 543, 444, 435, 355
  POTENTIAL_LOYALISTS = 'Potential Loyalists',  // 553, 551, 552
  NEW_CUSTOMERS = 'New Customers',  // 512, 511, 422, 421
  PROMISING = 'Promising',  // 525, 524, 523, 522, 521
  NEED_ATTENTION = 'Need Attention',  // 535, 534, 443, 434
  ABOUT_TO_SLEEP = 'About to Sleep',  // 331, 321, 312, 221
  AT_RISK = 'At Risk',  // 255, 254, 245, 244
  CANNOT_LOSE = 'Cannot Lose Them',  // 155, 154, 144, 145
  HIBERNATING = 'Hibernating',  // 332, 322, 231, 241, 233
  LOST = 'Lost'  // 111, 112, 121, 122, 211
}

export class CustomerSegmentationService {
  constructor(private db: D1Database) {}

  /**
   * Calculate RFM scores for all customers
   */
  async calculateRFM(tenantId: string = 'default'): Promise<RFMScore[]> {
    // Get customer purchase data
    const customers = await this.db.prepare(`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.last_visit,
        c.total_orders,
        c.total_spent_cents,
        JULIANDAY('now') - JULIANDAY(COALESCE(c.last_visit, c.created_at)) as recency_days
      FROM customers c
      WHERE c.tenant_id = ?
        AND c.is_active = 1
    `).bind(tenantId).all();

    if (!customers.results || customers.results.length === 0) {
      return [];
    }

    // Extract values for quartile calculation
    const recencies = customers.results.map((c: any) => c.recency_days || 999).filter(r => r !== null);
    const frequencies = customers.results.map((c: any) => c.total_orders || 0);
    const monetaries = customers.results.map((c: any) => c.total_spent_cents || 0);

    // Calculate quintiles (20%, 40%, 60%, 80%)
    const recencyQuintiles = this.calculateQuintiles(recencies);
    const frequencyQuintiles = this.calculateQuintiles(frequencies);
    const monetaryQuintiles = this.calculateQuintiles(monetaries);

    // Score each customer
    const rfmScores: RFMScore[] = customers.results.map((customer: any) => {
      const recency = customer.recency_days || 999;
      const frequency = customer.total_orders || 0;
      const monetary = customer.total_spent_cents || 0;

      // Score 1-5 (5 is best)
      // For recency, lower is better, so we invert the score
      const recencyScore = 6 - this.getScore(recency, recencyQuintiles);
      const frequencyScore = this.getScore(frequency, frequencyQuintiles);
      const monetaryScore = this.getScore(monetary, monetaryQuintiles);

      const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
      const segment = this.getSegment(recencyScore, frequencyScore, monetaryScore);

      return {
        customerId: customer.id,
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmScore,
        segment,
        recencyDays: recency,
        frequency,
        monetary
      };
    });

    return rfmScores;
  }

  /**
   * Calculate quintiles for a dataset
   */
  private calculateQuintiles(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    return [
      sorted[Math.floor(n * 0.2)],
      sorted[Math.floor(n * 0.4)],
      sorted[Math.floor(n * 0.6)],
      sorted[Math.floor(n * 0.8)]
    ];
  }

  /**
   * Get score (1-5) based on quintiles
   */
  private getScore(value: number, quintiles: number[]): number {
    if (value <= quintiles[0]) return 1;
    if (value <= quintiles[1]) return 2;
    if (value <= quintiles[2]) return 3;
    if (value <= quintiles[3]) return 4;
    return 5;
  }

  /**
   * Get customer segment based on RFM scores
   */
  private getSegment(r: number, f: number, m: number): CustomerSegment {
    const score = `${r}${f}${m}`;

    // Champions - Best customers
    if (['555', '554', '544', '545', '455'].includes(score)) {
      return CustomerSegment.CHAMPIONS;
    }

    // Loyal Customers
    if (['543', '444', '435', '355', '354', '345', '344', '335'].includes(score)) {
      return CustomerSegment.LOYAL_CUSTOMERS;
    }

    // Potential Loyalists
    if (['553', '551', '552', '541', '542', '533', '532', '531'].includes(score)) {
      return CustomerSegment.POTENTIAL_LOYALISTS;
    }

    // New Customers
    if (['512', '511', '422', '421', '412', '411', '311'].includes(score)) {
      return CustomerSegment.NEW_CUSTOMERS;
    }

    // Promising
    if (['525', '524', '523', '522', '521', '515', '514', '513'].includes(score)) {
      return CustomerSegment.PROMISING;
    }

    // Need Attention
    if (['535', '534', '443', '434', '343', '334', '325', '324'].includes(score)) {
      return CustomerSegment.NEED_ATTENTION;
    }

    // About to Sleep
    if (['331', '321', '312', '221', '213', '222', '223'].includes(score)) {
      return CustomerSegment.ABOUT_TO_SLEEP;
    }

    // At Risk
    if (['255', '254', '245', '244', '253', '252', '243', '242', '235', '234'].includes(score)) {
      return CustomerSegment.AT_RISK;
    }

    // Can't Lose Them
    if (['155', '154', '144', '145', '143', '142', '135', '134'].includes(score)) {
      return CustomerSegment.CANNOT_LOSE;
    }

    // Hibernating
    if (['332', '322', '231', '241', '233', '232', '223', '222', '132', '123'].includes(score)) {
      return CustomerSegment.HIBERNATING;
    }

    // Lost
    return CustomerSegment.LOST;
  }

  /**
   * Get segment statistics
   */
  async getSegmentStats(tenantId: string = 'default'): Promise<Record<CustomerSegment, {
    count: number;
    totalValue: number;
    avgValue: number;
    percentage: number;
  }>> {
    const rfmScores = await this.calculateRFM(tenantId);
    const total = rfmScores.length;

    const stats: any = {};

    for (const segment of Object.values(CustomerSegment)) {
      const segmentCustomers = rfmScores.filter(s => s.segment === segment);
      const totalValue = segmentCustomers.reduce((sum, c) => sum + c.monetary, 0);

      stats[segment] = {
        count: segmentCustomers.length,
        totalValue,
        avgValue: segmentCustomers.length > 0 ? totalValue / segmentCustomers.length : 0,
        percentage: total > 0 ? (segmentCustomers.length / total) * 100 : 0
      };
    }

    return stats;
  }

  /**
   * Get recommended actions for a segment
   */
  getRecommendedActions(segment: CustomerSegment): string[] {
    const actions: Record<CustomerSegment, string[]> = {
      [CustomerSegment.CHAMPIONS]: [
        'Thưởng cho sự trung thành với ưu đãi đặc biệt',
        'Yêu cầu đánh giá/feedback',
        'Upsell sản phẩm cao cấp',
        'Chương trình VIP độc quyền'
      ],
      [CustomerSegment.LOYAL_CUSTOMERS]: [
        'Tăng mức độ tương tác',
        'Chương trình giới thiệu bạn bè',
        'Ưu đãi sinh nhật',
        'Early access sản phẩm mới'
      ],
      [CustomerSegment.POTENTIAL_LOYALISTS]: [
        'Chương trình tích điểm',
        'Khuyến mãi khi mua nhiều',
        'Email marketing định kỳ',
        'Cross-sell sản phẩm liên quan'
      ],
      [CustomerSegment.NEW_CUSTOMERS]: [
        'Chào mừng khách hàng mới',
        'Giới thiệu sản phẩm/dịch vụ',
        'Khuyến mãi lần mua thứ 2',
        'Survey để hiểu nhu cầu'
      ],
      [CustomerSegment.PROMISING]: [
        'Ưu đãi độc quyền',
        'Tăng tần suất mua hàng',
        'Reminder sản phẩm yêu thích',
        'Bundle deals'
      ],
      [CustomerSegment.NEED_ATTENTION]: [
        'Gửi email quan tâm',
        'Khuyến mãi đặc biệt',
        'Survey lý do giảm tương tác',
        'Tặng voucher'
      ],
      [CustomerSegment.ABOUT_TO_SLEEP]: [
        'Win-back campaign',
        'Discount sâu',
        'Email nhắc nhở',
        'Limited time offers'
      ],
      [CustomerSegment.AT_RISK]: [
        'Win-back campaign khẩn cấp',
        'Gọi điện hỏi thăm',
        'Ưu đãi lớn để giữ chân',
        'Survey lý do rời bỏ'
      ],
      [CustomerSegment.CANNOT_LOSE]: [
        'Retention campaign tối đa',
        'Liên hệ trực tiếp',
        'Ưu đãi VIP độc quyền',
        'Compensation cho bất tiện'
      ],
      [CustomerSegment.HIBERNATING]: [
        'Reactivation campaign',
        'Deep discounts',
        'Sản phẩm mới/trending',
        'Survey để tái thu hút'
      ],
      [CustomerSegment.LOST]: [
        'Phân tích lý do rời bỏ',
        'Last chance offer',
        'Xem xét bỏ khỏi danh sách',
        'Feedback survey'
      ]
    };

    return actions[segment] || [];
  }

  /**
   * Auto-tag customers based on RFM segment
   */
  async autoTagCustomers(tenantId: string = 'default'): Promise<{ tagged: number; errors: string[] }> {
    const rfmScores = await this.calculateRFM(tenantId);
    let tagged = 0;
    const errors: string[] = [];

    for (const score of rfmScores) {
      try {
        // Update customer with segment tag
        await this.db.prepare(`
          UPDATE customers
          SET
            customer_type = ?,
            updated_at = datetime('now')
          WHERE id = ? AND tenant_id = ?
        `).bind(
          this.mapSegmentToType(score.segment),
          score.customerId,
          tenantId
        ).run();

        tagged++;
      } catch (error: any) {
        errors.push(`Failed to tag customer ${score.customerId}: ${error.message}`);
      }
    }

    return { tagged, errors };
  }

  /**
   * Map segment to customer_type
   */
  private mapSegmentToType(segment: CustomerSegment): string {
    if ([CustomerSegment.CHAMPIONS, CustomerSegment.CANNOT_LOSE].includes(segment)) {
      return 'vip';
    }
    if ([CustomerSegment.LOYAL_CUSTOMERS, CustomerSegment.POTENTIAL_LOYALISTS].includes(segment)) {
      return 'premium';
    }
    return 'regular';
  }
}
