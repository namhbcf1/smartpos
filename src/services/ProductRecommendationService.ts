import { D1Database } from '@cloudflare/workers-types';

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  sku: string;
  price_cents: number;
  image_url?: string;
  category_name?: string;
  brand_name?: string;
  recommendation_score: number;
  recommendation_reason: string;
  confidence: number;
}

export interface RecommendationContext {
  customerId?: string;
  productId?: string;
  categoryId?: string;
  cartItems?: string[];
  limit?: number;
}

export class ProductRecommendationService {
  constructor(private db: D1Database) {}

  /**
   * Get personalized recommendations for a customer
   * Based on purchase history, browsing behavior, and collaborative filtering
   */
  async getPersonalizedRecommendations(
    customerId: string,
    tenantId: string = 'default',
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    // Get customer's purchase history
    const purchaseHistory = await this.db.prepare(`
      SELECT DISTINCT p.id, p.category_id, p.brand_id
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE o.customer_id = ? AND o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')
      ORDER BY o.created_at DESC
      LIMIT 50
    `).bind(customerId, tenantId).all();

    if (!purchaseHistory.results.length) {
      // New customer - return popular products
      return this.getPopularProducts(tenantId, limit);
    }

    const purchasedProductIds = (purchaseHistory.results as any[]).map(p => p.id);
    const categoryIds = [...new Set((purchaseHistory.results as any[]).map(p => p.category_id).filter(Boolean))];
    const brandIds = [...new Set((purchaseHistory.results as any[]).map(p => p.brand_id).filter(Boolean))];

    // Find similar products using collaborative filtering
    // Customers who bought X also bought Y
    const collaborativeQuery = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        COUNT(DISTINCT oi2.order_id) as co_purchase_count,
        'Customers who bought your items also bought this' as recommendation_reason
      FROM order_items oi1
      INNER JOIN orders o1 ON o1.id = oi1.order_id AND o1.tenant_id = oi1.tenant_id
      INNER JOIN order_items oi2 ON oi2.order_id = o1.id AND oi2.tenant_id = o1.tenant_id
      INNER JOIN products p ON p.id = oi2.product_id AND p.tenant_id = oi2.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE oi1.tenant_id = ?
        AND oi1.product_id IN (${purchasedProductIds.map(() => '?').join(',')})
        AND oi2.product_id NOT IN (${purchasedProductIds.map(() => '?').join(',')})
        AND p.is_active = 1
        AND o1.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id
      ORDER BY co_purchase_count DESC
      LIMIT ?
    `;

    const collaborativeResults = await this.db.prepare(collaborativeQuery)
      .bind(tenantId, ...purchasedProductIds, ...purchasedProductIds, Math.ceil(limit / 2))
      .all();

    // Content-based filtering: similar category/brand
    let contentBasedQuery = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        CASE
          WHEN p.category_id IN (${categoryIds.map(() => '?').join(',')}) AND p.brand_id IN (${brandIds.map(() => '?').join(',')})
          THEN 'Based on your favorite brands and categories'
          WHEN p.category_id IN (${categoryIds.map(() => '?').join(',')})
          THEN 'Based on your favorite categories'
          ELSE 'Based on your favorite brands'
        END as recommendation_reason,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id AND oi.tenant_id = p.tenant_id) as popularity
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE p.tenant_id = ?
        AND p.is_active = 1
        AND p.id NOT IN (${purchasedProductIds.map(() => '?').join(',')})
        AND (p.category_id IN (${categoryIds.map(() => '?').join(',')}) OR p.brand_id IN (${brandIds.map(() => '?').join(',')}))
      ORDER BY popularity DESC
      LIMIT ?
    `;

    const bindings = [
      ...categoryIds, ...brandIds,
      ...categoryIds,
      tenantId,
      ...purchasedProductIds,
      ...categoryIds, ...brandIds,
      Math.ceil(limit / 2)
    ];

    const contentResults = await this.db.prepare(contentBasedQuery).bind(...bindings).all();

    // Merge and score results
    const recommendations: ProductRecommendation[] = [];

    // Add collaborative filtering results with higher score
    (collaborativeResults.results as any[]).forEach((item, index) => {
      recommendations.push({
        ...item,
        recommendation_score: 100 - (index * 5),
        confidence: Math.min(95, 70 + (item.co_purchase_count * 5))
      });
    });

    // Add content-based results with lower score
    (contentResults.results as any[]).forEach((item, index) => {
      if (!recommendations.find(r => r.product_id === item.product_id)) {
        recommendations.push({
          ...item,
          recommendation_score: 50 - (index * 2),
          confidence: 60
        });
      }
    });

    return recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score).slice(0, limit);
  }

  /**
   * Get products frequently bought together with a given product
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    tenantId: string = 'default',
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        COUNT(DISTINCT oi2.order_id) as co_purchase_count,
        'Frequently bought together' as recommendation_reason
      FROM order_items oi1
      INNER JOIN orders o ON o.id = oi1.order_id AND o.tenant_id = oi1.tenant_id
      INNER JOIN order_items oi2 ON oi2.order_id = o.id AND oi2.tenant_id = o.tenant_id AND oi2.product_id != oi1.product_id
      INNER JOIN products p ON p.id = oi2.product_id AND p.tenant_id = oi2.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE oi1.tenant_id = ? AND oi1.product_id = ? AND p.is_active = 1
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id
      ORDER BY co_purchase_count DESC
      LIMIT ?
    `;

    const results = await this.db.prepare(query).bind(tenantId, productId, limit).all();

    return (results.results as any[]).map((item, index) => ({
      ...item,
      recommendation_score: 100 - (index * 10),
      confidence: Math.min(95, 60 + (item.co_purchase_count * 5))
    }));
  }

  /**
   * Get similar products based on category, brand, and price range
   */
  async getSimilarProducts(
    productId: string,
    tenantId: string = 'default',
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    // Get the source product details
    const sourceProduct = await this.db.prepare(`
      SELECT id, name, category_id, brand_id, price_cents
      FROM products
      WHERE id = ? AND tenant_id = ?
    `).bind(productId, tenantId).first();

    if (!sourceProduct) {
      return [];
    }

    const source = sourceProduct as any;
    const priceMin = source.price_cents * 0.7; // -30%
    const priceMax = source.price_cents * 1.3; // +30%

    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        CASE
          WHEN p.category_id = ? AND p.brand_id = ? THEN 'Same category and brand'
          WHEN p.category_id = ? THEN 'Same category'
          WHEN p.brand_id = ? THEN 'Same brand'
          ELSE 'Similar price range'
        END as recommendation_reason,
        CASE
          WHEN p.category_id = ? AND p.brand_id = ? THEN 3
          WHEN p.category_id = ? THEN 2
          WHEN p.brand_id = ? THEN 1
          ELSE 0
        END as similarity_score,
        ABS(p.price_cents - ?) as price_diff
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE p.tenant_id = ?
        AND p.id != ?
        AND p.is_active = 1
        AND p.price_cents BETWEEN ? AND ?
        AND (p.category_id = ? OR p.brand_id = ? OR 1=1)
      ORDER BY similarity_score DESC, price_diff ASC
      LIMIT ?
    `;

    const results = await this.db.prepare(query).bind(
      source.category_id, source.brand_id, // CASE conditions
      source.category_id,
      source.brand_id,
      source.category_id, source.brand_id, // similarity_score
      source.category_id,
      source.brand_id,
      source.price_cents, // price_diff
      tenantId, productId, priceMin, priceMax,
      source.category_id, source.brand_id,
      limit
    ).all();

    return (results.results as any[]).map((item, index) => ({
      ...item,
      recommendation_score: 100 - (item.similarity_score * 30) - (index * 3),
      confidence: 70 + (item.similarity_score * 10)
    }));
  }

  /**
   * Get popular/trending products
   */
  async getPopularProducts(
    tenantId: string = 'default',
    limit: number = 10,
    days: number = 30
  ): Promise<ProductRecommendation[]> {
    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as quantity_sold,
        'Popular product' as recommendation_reason
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      LEFT JOIN order_items oi ON oi.product_id = p.id AND oi.tenant_id = p.tenant_id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
        AND o.created_at >= datetime('now', '-' || ? || ' days')
        AND o.status NOT IN ('cancelled', 'refunded')
      WHERE p.tenant_id = ? AND p.is_active = 1
      GROUP BY p.id
      HAVING order_count > 0
      ORDER BY quantity_sold DESC, order_count DESC
      LIMIT ?
    `;

    const results = await this.db.prepare(query).bind(days, tenantId, limit).all();

    return (results.results as any[]).map((item, index) => ({
      ...item,
      recommendation_score: 100 - (index * 5),
      confidence: 80
    }));
  }

  /**
   * Get cart-based recommendations
   * Analyze current cart and suggest complementary products
   */
  async getCartRecommendations(
    cartProductIds: string[],
    tenantId: string = 'default',
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    if (!cartProductIds.length) {
      return this.getPopularProducts(tenantId, limit);
    }

    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        COUNT(DISTINCT oi2.order_id) as co_purchase_count,
        'Complete your purchase with this' as recommendation_reason
      FROM order_items oi1
      INNER JOIN orders o ON o.id = oi1.order_id AND o.tenant_id = oi1.tenant_id
      INNER JOIN order_items oi2 ON oi2.order_id = o.id AND oi2.tenant_id = o.tenant_id
      INNER JOIN products p ON p.id = oi2.product_id AND p.tenant_id = oi2.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE oi1.tenant_id = ?
        AND oi1.product_id IN (${cartProductIds.map(() => '?').join(',')})
        AND oi2.product_id NOT IN (${cartProductIds.map(() => '?').join(',')})
        AND p.is_active = 1
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY p.id
      ORDER BY co_purchase_count DESC
      LIMIT ?
    `;

    const results = await this.db.prepare(query)
      .bind(tenantId, ...cartProductIds, ...cartProductIds, limit)
      .all();

    return (results.results as any[]).map((item, index) => ({
      ...item,
      recommendation_score: 100 - (index * 8),
      confidence: Math.min(90, 65 + (item.co_purchase_count * 5))
    }));
  }

  /**
   * Get new arrivals recommendations
   */
  async getNewArrivals(
    tenantId: string = 'default',
    limit: number = 10,
    days: number = 30
  ): Promise<ProductRecommendation[]> {
    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price_cents,
        p.image_url,
        c.name as category_name,
        b.name as brand_name,
        'New arrival' as recommendation_reason
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.is_active = 1
        AND p.created_at >= datetime('now', '-' || ? || ' days')
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

    const results = await this.db.prepare(query).bind(tenantId, days, limit).all();

    return (results.results as any[]).map((item, index) => ({
      ...item,
      recommendation_score: 90 - (index * 4),
      confidence: 75
    }));
  }

  /**
   * Get comprehensive recommendations for a context
   */
  async getRecommendations(
    context: RecommendationContext,
    tenantId: string = 'default'
  ): Promise<{
    personalized?: ProductRecommendation[];
    frequentlyBoughtTogether?: ProductRecommendation[];
    similar?: ProductRecommendation[];
    cart?: ProductRecommendation[];
    popular?: ProductRecommendation[];
    newArrivals?: ProductRecommendation[];
  }> {
    const limit = context.limit || 10;
    const results: any = {};

    if (context.customerId) {
      results.personalized = await this.getPersonalizedRecommendations(context.customerId, tenantId, limit);
    }

    if (context.productId) {
      results.frequentlyBoughtTogether = await this.getFrequentlyBoughtTogether(context.productId, tenantId, 5);
      results.similar = await this.getSimilarProducts(context.productId, tenantId, limit);
    }

    if (context.cartItems && context.cartItems.length > 0) {
      results.cart = await this.getCartRecommendations(context.cartItems, tenantId, 5);
    }

    results.popular = await this.getPopularProducts(tenantId, limit);
    results.newArrivals = await this.getNewArrivals(tenantId, limit);

    return results;
  }
}
