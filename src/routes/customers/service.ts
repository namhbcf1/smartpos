import { Env } from '../../types';
import { 
  Customer, 
  CustomerCreateData, 
  CustomerUpdateData, 
  CustomerQueryParams, 
  CustomerStats,
  LoyaltyTransaction,
  LoyaltyTransactionCreateData
} from './types';
import { CustomersDatabase } from './database';
import { CacheManager, CacheKeys } from '../../utils/cache';

export class CustomersService {
  private db: CustomersDatabase;
  private cache: CacheManager;

  constructor(private env: Env) {
    this.db = new CustomersDatabase(env);
    this.cache = new CacheManager(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.db.initializeTables();
    await this.db.createDefaultData();
  }

  // Get all customers with filtering and pagination
  async getCustomers(params: CustomerQueryParams): Promise<{ customers: Customer[]; total: number; stats?: CustomerStats }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        customer_type,
        is_vip,
        vip_level,
        city,
        is_active,
        registration_date_from,
        registration_date_to,
        last_order_date_from,
        last_order_date_to,
        min_total_spent,
        max_total_spent,
        min_orders,
        max_orders,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const bindings: any[] = [];

      if (search) {
        conditions.push('(c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.customer_code LIKE ?)');
        const searchTerm = `%${search}%`;
        bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (customer_type) {
        conditions.push('c.customer_type = ?');
        bindings.push(customer_type);
      }

      if (is_vip !== undefined) {
        conditions.push('c.is_vip = ?');
        bindings.push(is_vip ? 1 : 0);
      }

      if (vip_level) {
        conditions.push('c.vip_level = ?');
        bindings.push(vip_level);
      }

      if (city) {
        conditions.push('c.city = ?');
        bindings.push(city);
      }

      if (is_active !== undefined) {
        conditions.push('c.is_active = ?');
        bindings.push(is_active ? 1 : 0);
      }

      if (registration_date_from) {
        conditions.push('DATE(c.registration_date) >= ?');
        bindings.push(registration_date_from);
      }

      if (registration_date_to) {
        conditions.push('DATE(c.registration_date) <= ?');
        bindings.push(registration_date_to);
      }

      if (last_order_date_from) {
        conditions.push('DATE(c.last_order_date) >= ?');
        bindings.push(last_order_date_from);
      }

      if (last_order_date_to) {
        conditions.push('DATE(c.last_order_date) <= ?');
        bindings.push(last_order_date_to);
      }

      if (min_total_spent) {
        conditions.push('c.total_spent >= ?');
        bindings.push(min_total_spent);
      }

      if (max_total_spent) {
        conditions.push('c.total_spent <= ?');
        bindings.push(max_total_spent);
      }

      if (min_orders) {
        conditions.push('c.total_orders >= ?');
        bindings.push(min_orders);
      }

      if (max_orders) {
        conditions.push('c.total_orders <= ?');
        bindings.push(max_orders);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['created_at', 'full_name', 'total_spent', 'total_orders', 'last_order_date'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get customers with joined data
      const query = `
        SELECT 
          c.*,
          u.full_name as created_by_name
        FROM customers c
        LEFT JOIN users u ON c.created_by = u.id
        ${whereClause}
        ORDER BY c.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      const customers = await this.env.DB.prepare(query)
        .bind(...bindings, limit, offset)
        .all<Customer>();

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM customers c
        ${whereClause}
      `;

      const countResult = await this.env.DB.prepare(countQuery)
        .bind(...bindings)
        .first<{ total: number }>();

      const total = countResult?.total || 0;

      // Get stats if requested (first page only)
      let stats: CustomerStats | undefined;
      if (page === 1) {
        stats = await this.getStats();
      }

      return {
        customers: customers.results || [],
        total,
        stats
      };
    } catch (error) {
      console.error('Error getting customers:', error);
      throw new Error('Failed to get customers');
    }
  }

  // Get customer by ID with related data
  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const cacheKey = CacheKeys.customer(id);
      const cached = await this.cache.get<Customer>(cacheKey);
      if (cached) return cached;

      // Get customer with joined data
      const customer = await this.env.DB.prepare(`
        SELECT 
          c.*,
          u.full_name as created_by_name
        FROM customers c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
      `).bind(id).first<Customer>();

      if (!customer) return null;

      // Get recent orders
      const recentOrders = await this.env.DB.prepare(`
        SELECT 
          s.id as sale_id,
          s.sale_number as order_number,
          s.created_at as order_date,
          s.final_amount as total_amount,
          s.sale_status as status,
          COUNT(si.id) as items_count
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.customer_id = ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 10
      `).bind(id).all<any>();

      customer.recent_orders = recentOrders.results || [];

      // Get recent loyalty transactions
      const loyaltyTransactions = await this.env.DB.prepare(`
        SELECT 
          lt.*,
          u.full_name as created_by_name
        FROM loyalty_transactions lt
        LEFT JOIN users u ON lt.created_by = u.id
        WHERE lt.customer_id = ?
        ORDER BY lt.created_at DESC
        LIMIT 10
      `).bind(id).all<LoyaltyTransaction>();

      customer.loyalty_transactions = loyaltyTransactions.results || [];

      await this.cache.set(cacheKey, customer, 300); // Cache for 5 minutes
      return customer;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw new Error('Failed to get customer');
    }
  }

  // Create new customer
  async createCustomer(data: CustomerCreateData, createdBy: number): Promise<Customer> {
    try {
      // Generate customer code
      const customerCode = await this.db.generateCustomerCode();

      // Validate unique email and phone
      if (data.email) {
        const existingEmail = await this.env.DB.prepare(
          'SELECT id FROM customers WHERE email = ? AND is_active = 1'
        ).bind(data.email).first<{ id: number }>();

        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      if (data.phone) {
        const existingPhone = await this.env.DB.prepare(
          'SELECT id FROM customers WHERE phone = ? AND is_active = 1'
        ).bind(data.phone).first<{ id: number }>();

        if (existingPhone) {
          throw new Error('Phone number already exists');
        }
      }

      // Create customer
      const result = await this.env.DB.prepare(`
        INSERT INTO customers (
          customer_code, full_name, email, phone, date_of_birth, gender,
          address, city, district, ward, postal_code, country,
          customer_type, company_name, tax_number, credit_limit,
          notes, preferences, marketing_consent, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        customerCode,
        data.full_name,
        data.email,
        data.phone,
        data.date_of_birth,
        data.gender,
        data.address,
        data.city,
        data.district,
        data.ward,
        data.postal_code,
        data.country || 'Vietnam',
        data.customer_type,
        data.company_name,
        data.tax_number,
        data.credit_limit,
        data.notes,
        data.preferences ? JSON.stringify(data.preferences) : null,
        data.marketing_consent ? 1 : 0,
        createdBy
      ).run();

      const customerId = result.meta.last_row_id as number;

      // Create addresses if provided
      if (data.addresses && data.addresses.length > 0) {
        for (const address of data.addresses) {
          await this.env.DB.prepare(`
            INSERT INTO customer_addresses (
              customer_id, type, label, address_line_1, address_line_2,
              city, district, ward, postal_code, country, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            customerId,
            address.type,
            address.label,
            address.address_line_1,
            address.address_line_2,
            address.city,
            address.district,
            address.ward,
            address.postal_code,
            address.country,
            address.is_default ? 1 : 0
          ).run();
        }
      }

      // Create contacts if provided
      if (data.contacts && data.contacts.length > 0) {
        for (const contact of data.contacts) {
          await this.env.DB.prepare(`
            INSERT INTO customer_contacts (
              customer_id, type, label, value, is_primary
            ) VALUES (?, ?, ?, ?, ?)
          `).bind(
            customerId,
            contact.type,
            contact.label,
            contact.value,
            contact.is_primary ? 1 : 0
          ).run();
        }
      }

      // Clear cache
      await this.cache.delete(CacheKeys.customersList());

      const newCustomer = await this.getCustomerById(customerId);
      if (!newCustomer) {
        throw new Error('Failed to retrieve created customer');
      }

      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(id: number, data: CustomerUpdateData, updatedBy: number): Promise<Customer> {
    try {
      const existingCustomer = await this.getCustomerById(id);
      if (!existingCustomer) {
        throw new Error('Customer not found');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const bindings: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'updated_by') {
          if (key === 'preferences') {
            updateFields.push(`${key} = ?`);
            bindings.push(typeof value === 'object' ? JSON.stringify(value) : value);
          } else if (typeof value === 'boolean') {
            updateFields.push(`${key} = ?`);
            bindings.push(value ? 1 : 0);
          } else {
            updateFields.push(`${key} = ?`);
            bindings.push(value);
          }
        }
      });

      updateFields.push('updated_by = ?', 'updated_at = datetime(\'now\')');
      bindings.push(updatedBy, id);

      await this.env.DB.prepare(`
        UPDATE customers 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...bindings).run();

      // Clear cache
      await this.cache.delete(CacheKeys.customer(id));
      await this.cache.delete(CacheKeys.customersList());

      const updatedCustomer = await this.getCustomerById(id);
      if (!updatedCustomer) {
        throw new Error('Failed to retrieve updated customer');
      }

      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Add loyalty points
  async addLoyaltyPoints(data: LoyaltyTransactionCreateData, createdBy: number): Promise<LoyaltyTransaction> {
    try {
      await this.db.addLoyaltyPoints(
        data.customer_id,
        data.points,
        data.reference_type || 'manual',
        data.reference_id || 0,
        data.description,
        createdBy
      );

      // Get the created transaction
      const transaction = await this.env.DB.prepare(`
        SELECT 
          lt.*,
          u.full_name as created_by_name
        FROM loyalty_transactions lt
        LEFT JOIN users u ON lt.created_by = u.id
        WHERE lt.customer_id = ? AND lt.created_by = ?
        ORDER BY lt.created_at DESC
        LIMIT 1
      `).bind(data.customer_id, createdBy).first<LoyaltyTransaction>();

      if (!transaction) {
        throw new Error('Failed to retrieve loyalty transaction');
      }

      // Clear customer cache
      await this.cache.delete(CacheKeys.customer(data.customer_id));

      return transaction;
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  }

  // Get customer statistics
  async getStats(): Promise<CustomerStats> {
    return await this.db.getStats();
  }

  // Search customers by phone or name
  async searchCustomers(query: string, limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.env.DB.prepare(`
        SELECT 
          c.*,
          u.full_name as created_by_name
        FROM customers c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.is_active = 1 
        AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)
        ORDER BY c.total_spent DESC, c.created_at DESC
        LIMIT ?
      `).bind(`%${query}%`, `%${query}%`, `%${query}%`, limit).all<Customer>();

      return customers.results || [];
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  }
}
