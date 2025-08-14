import api from './api';

export interface CartItem {
  product: {
    id: number;
    name: string;
    sku: string;
    category_name?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
  auto_warranty?: boolean;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
}

export interface SaleData {
  customer: Customer;
  items: CartItem[];
  payment_method: string;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
}

export interface SerialNumberAssignment {
  serial_number: string;
  product_id: number;
  customer_id?: number;
}

export interface WarrantyRegistration {
  serial_number_id: number;
  warranty_type: 'manufacturer' | 'store' | 'extended' | 'premium';
  warranty_period_months: number;
  contact_phone?: string;
  contact_email?: string;
  terms_accepted: boolean;
}

export interface EnhancedSaleResult {
  sale_id: number;
  assigned_serials: { serial_number: string; serial_id: number; product_id: number }[];
  created_warranties: { warranty_id: number; warranty_number: string; serial_number: string }[];
  errors: string[];
}

class EnhancedSalesService {
  /**
   * Create a sale with serial number assignment and warranty registration
   */
  async createSaleWithSerials(saleData: SaleData): Promise<EnhancedSaleResult> {
    try {
      // Step 1: Create the basic sale
      const saleResponse = await api.post('/sales', {
        customer_name: saleData.customer.name,
        customer_phone: saleData.customer.phone,
        customer_email: saleData.customer.email,
        payment_method: saleData.payment_method,
        discount_amount: saleData.discount_amount,
        tax_amount: saleData.tax_amount,
        total_amount: saleData.total_amount,
        notes: saleData.notes,
        items: saleData.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      });

      if (!saleResponse.data.success) {
        throw new Error(saleResponse.data.message || 'Failed to create sale');
      }

      const saleId = saleResponse.data.data.id || saleResponse.data.data.sale_id;
      const result: EnhancedSaleResult = {
        sale_id: saleId,
        assigned_serials: [],
        created_warranties: [],
        errors: [],
      };

      // Step 2: Process serial number assignments
      for (const item of saleData.items) {
        if (item.serial_numbers && item.serial_numbers.length > 0) {
          try {
            const serialAssignments = await this.assignSerialNumbers(
              item.serial_numbers,
              item.product.id,
              saleData.customer,
              saleId
            );
            result.assigned_serials.push(...serialAssignments);

            // Step 3: Create warranties if requested
            if (item.auto_warranty) {
              for (const assignment of serialAssignments) {
                try {
                  const warranty = await this.createWarrantyRegistration({
                    serial_number_id: assignment.serial_id,
                    warranty_type: 'manufacturer', // Default to manufacturer warranty
                    warranty_period_months: 12, // Default 12 months
                    contact_phone: saleData.customer.phone,
                    contact_email: saleData.customer.email,
                    terms_accepted: true, // Auto-accept for POS sales
                  });
                  result.created_warranties.push(warranty);
                } catch (warrantyError) {
                  console.error('Warranty creation error:', warrantyError);
                  result.errors.push(`Failed to create warranty for ${assignment.serial_number}: ${warrantyError}`);
                }
              }
            }
          } catch (serialError) {
            console.error('Serial assignment error:', serialError);
            result.errors.push(`Failed to assign serials for ${item.product.name}: ${serialError}`);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Enhanced sale creation error:', error);
      throw error;
    }
  }

  /**
   * Assign serial numbers to a customer
   */
  private async assignSerialNumbers(
    serialNumbers: string[],
    productId: number,
    customer: Customer,
    saleId: number
  ): Promise<{ serial_number: string; serial_id: number; product_id: number }[]> {
    const assignments: { serial_number: string; serial_id: number; product_id: number }[] = [];

    for (const serialNumber of serialNumbers) {
      try {
        // First, find the serial number ID
        const serialResponse = await api.get(`/serial-numbers?search=${serialNumber}&product_id=${productId}&status=in_stock&limit=1`);
        
        if (!serialResponse.data.success || !serialResponse.data.data || serialResponse.data.data.length === 0) {
          throw new Error(`Serial number ${serialNumber} not found or not available`);
        }

        const serial = serialResponse.data.data[0];

        // Update serial number status to sold
        const updateResponse = await api.put(`/serial-numbers/${serial.id}`, {
          status: 'sold',
          customer_id: customer.id || null,
          sale_reference: `SALE-${saleId}`,
          notes: `Sold to ${customer.name} - Sale #${saleId}`,
        });

        if (!updateResponse.data.success) {
          throw new Error(`Failed to update serial ${serialNumber}: ${updateResponse.data.message}`);
        }

        assignments.push({
          serial_number: serialNumber,
          serial_id: serial.id,
          product_id: productId,
        });
      } catch (error) {
        console.error(`Error assigning serial ${serialNumber}:`, error);
        throw error;
      }
    }

    return assignments;
  }

  /**
   * Create warranty registration
   */
  private async createWarrantyRegistration(
    warrantyData: WarrantyRegistration
  ): Promise<{ warranty_id: number; warranty_number: string; serial_number: string }> {
    try {
      const response = await api.post('/warranty/registrations', warrantyData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create warranty registration');
      }

      const warranty = response.data.data;
      return {
        warranty_id: warranty.id,
        warranty_number: warranty.warranty_number,
        serial_number: warranty.serial_number?.serial_number || 'Unknown',
      };
    } catch (error) {
      console.error('Warranty registration error:', error);
      throw error;
    }
  }

  /**
   * Get available serial numbers for a product
   */
  async getAvailableSerials(productId: number, limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get(`/serial-numbers?product_id=${productId}&status=in_stock&limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching available serials:', error);
      return [];
    }
  }

  /**
   * Validate serial numbers before sale
   */
  async validateSerialNumbers(serialNumbers: string[], productId: number): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      for (const serialNumber of serialNumbers) {
        const response = await api.get(`/serial-numbers?search=${serialNumber}&product_id=${productId}&limit=1`);
        
        if (!response.data.success || !response.data.data || response.data.data.length === 0) {
          errors.push(`Serial number ${serialNumber} not found for this product`);
          continue;
        }

        const serial = response.data.data[0];
        
        if (serial.status !== 'in_stock') {
          errors.push(`Serial number ${serialNumber} is not available (status: ${serial.status})`);
        }
      }
    } catch (error) {
      console.error('Serial validation error:', error);
      errors.push('Failed to validate serial numbers');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get sale details with serial numbers and warranties
   */
  async getSaleWithDetails(saleId: number): Promise<any> {
    try {
      const [saleResponse, serialsResponse, warrantiesResponse] = await Promise.all([
        api.get(`/sales/${saleId}`),
        api.get(`/serial-numbers?sale_reference=SALE-${saleId}`),
        api.get(`/warranty/registrations?sale_id=${saleId}`),
      ]);

      const sale = saleResponse.data.success ? saleResponse.data.data : null;
      const serials = serialsResponse.data.success ? serialsResponse.data.data : [];
      const warranties = warrantiesResponse.data.success ? warrantiesResponse.data.data : [];

      return {
        sale,
        serial_numbers: serials,
        warranties,
      };
    } catch (error) {
      console.error('Error fetching sale details:', error);
      throw error;
    }
  }

  /**
   * Bulk create serial numbers for a product
   */
  async bulkCreateSerials(productId: number, serialNumbers: string[], location?: string): Promise<{ created: number; errors: string[] }> {
    try {
      const response = await api.post('/serial-numbers/bulk', {
        product_id: productId,
        serial_numbers: serialNumbers,
        location: location || 'Store',
      });

      if (response.data.success) {
        return {
          created: response.data.data.created || 0,
          errors: [],
        };
      } else {
        return {
          created: 0,
          errors: [response.data.message || 'Failed to create serial numbers'],
        };
      }
    } catch (error: any) {
      console.error('Bulk serial creation error:', error);
      return {
        created: 0,
        errors: [error.response?.data?.message || 'Failed to create serial numbers'],
      };
    }
  }

  /**
   * Transfer warranty to new customer
   */
  async transferWarranty(warrantyId: number, newCustomer: Customer): Promise<boolean> {
    try {
      const response = await api.put(`/warranty/registrations/${warrantyId}/transfer`, {
        new_customer_id: newCustomer.id,
        contact_phone: newCustomer.phone,
        contact_email: newCustomer.email,
      });

      return response.data.success;
    } catch (error) {
      console.error('Warranty transfer error:', error);
      return false;
    }
  }
}

export const enhancedSalesService = new EnhancedSalesService();
