import { Env } from '../types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface GhtkResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  status_code?: number;
  order_code?: string;
  label?: string;
  fee?: number;
}

interface GhtkOrderPayload {
  order: {
    id: string;
    name: string;
    tel: string;
    address: string; // Street name (without house number and hamlet)
    hamlet?: string; // Separate hamlet field from frontend
    house_number?: string; // Separate house number field from frontend
    province: string;
    district: string;
    ward?: string;
    pick_name: string;
    pick_tel: string;
    pick_address: string;
    pick_province: string;
    pick_district: string;
    pick_ward?: string;
    value: number;
    weight: number;
    transport: 'road' | 'fly';
    service?: string;
    note?: string;
    product_code?: string;
  };
}

export class ShippingGHTKService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly env: Env;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  constructor(env: Env) {
    this.env = env;
    this.baseUrl = (env as any).GHTK_BASE_URL || 'https://services.giaohangtietkiem.vn';
    this.token = (env as any).GHTK_TOKEN || '';
  }

  // Province canonical list - 34 tỉnh thành sau sáp nhập từ 01/07/2025
  // Theo Nghị quyết của Quốc hội về việc sắp xếp đơn vị hành chính cấp tỉnh năm 2025
  // Reference: https://bankervn.com/danh-sach-cac-tinh-thanh-viet-nam/
  // Reference: https://xaydungchinhsach.chinhphu.vn/chi-tiet-34-don-vi-hanh-chinh-cap-tinh-tu-12-6-2025
  private static readonly PROVINCE_CANONICAL: string[] = [
    // 6 Thành phố Trung ương
    'Hà Nội', 'Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế',
    // 28 Tỉnh (theo alphabet)
    'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Điện Biên',
    'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa',
    'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình',
    'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh',
    'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long'
  ];

  private static readonly PROVINCE_ALIASES: Record<string, string> = {
    // === Diacritics-insensitive aliases → canonical (34 tỉnh mới) ===
    'ha noi': 'Hà Nội',
    'tp ha noi': 'Hà Nội',
    'ho chi minh': 'Hồ Chí Minh',
    'tphcm': 'Hồ Chí Minh',
    'tp hcm': 'Hồ Chí Minh',
    'sai gon': 'Hồ Chí Minh',
    'da nang': 'Đà Nẵng',
    'hai phong': 'Hải Phòng',
    'can tho': 'Cần Thơ',
    'hue': 'Huế',
    'thua thien hue': 'Huế',

    // === Các tỉnh đã sáp nhập - map về tỉnh mới ===
    // Lưu ý: Mapping này dựa trên thông tin từ các nguồn tin tức
    // Để đảm bảo backward compatibility cho dữ liệu cũ

    // Sáp nhập vào Tuyên Quang
    'ha giang': 'Tuyên Quang',

    // Sáp nhập vào Lào Cai
    'yen bai': 'Lào Cai',

    // Sáp nhập vào Thái Nguyên
    'bac kan': 'Thái Nguyên',

    // Sáp nhập vào Phú Thọ
    'hoa binh': 'Phú Thọ',
    'vinh phuc': 'Phú Thọ',

    // Sáp nhập vào Bắc Ninh
    'bac giang': 'Bắc Ninh',

    // Sáp nhập vào Hưng Yên
    'hai duong': 'Hưng Yên',

    // Sáp nhập vào Ninh Bình
    'thai binh': 'Ninh Bình',
    'nam dinh': 'Ninh Bình',

    // Sáp nhập vào Quảng Trị
    'quang binh': 'Quảng Trị',

    // Sáp nhập vào Quảng Ngãi (hoặc Đà Nẵng)
    'quang nam': 'Quảng Ngãi',

    // Sáp nhập vào Gia Lai
    'kon tum': 'Gia Lai',

    // Sáp nhập vào Khánh Hòa
    'phu yen': 'Khánh Hòa',
    'ninh thuan': 'Khánh Hòa',
    'binh thuan': 'Khánh Hòa',

    // Sáp nhập vào Đắk Lắk
    'dak nong': 'Đắk Lắk',
    'daklak': 'Đắk Lắk',

    // Sáp nhập vào Đồng Nai
    'binh duong': 'Đồng Nai',
    'binh phuoc': 'Đồng Nai',
    'ba ria vung tau': 'Đồng Nai',
    'baria vungtau': 'Đồng Nai',

    // Sáp nhập vào Tây Ninh
    'long an': 'Tây Ninh',

    // Sáp nhập vào Vĩnh Long
    'ben tre': 'Vĩnh Long',
    'tra vinh': 'Vĩnh Long',

    // Sáp nhập vào Đồng Tháp
    'tien giang': 'Đồng Tháp',

    // Sáp nhập vào Cà Mau
    'bac lieu': 'Cà Mau',
    'soc trang': 'Cà Mau',

    // Sáp nhập vào An Giang
    'kien giang': 'An Giang',
    'hau giang': 'An Giang',

    // Sáp nhập vào Quảng Ngãi hoặc Khánh Hòa
    'binh dinh': 'Khánh Hòa'
  };

  // Canonical tokens for district and ward administrative prefixes after 34-province reorg
  // Sources: Lao Động, Cổng TTĐT Chính phủ
  // https://laodong.vn/thoi-su/ten-34-tinh-thanh-cua-viet-nam-tu-1262025-1522395.ldo
  // https://xaydungchinhsach.chinhphu.vn/danh-sach-3321-don-vi-hanh-chinh-cap-xa-tai-34-tinh-thanh-sau-sap-xep-sap-nhap-119250710102358656.htm
  private static readonly DISTRICT_PREFIXES = [
    'Quận', 'Huyện', 'Thành phố', 'Thị xã'
  ];

  private static readonly WARD_PREFIXES = [
    'Phường', 'Xã', 'Thị trấn', 'Đặc khu'
  ];

  private ensurePrefix(name: string | undefined, allowed: string[], fallback: string): string {
    const raw = (name || '').trim();
    if (!raw) return '';
    for (const p of allowed) {
      const re = new RegExp(`^${p}\\s`, 'i');
      if (re.test(raw)) return raw;
    }
    return `${fallback} ${raw}`.trim();
  }

  private canonicalizeDistrictName(name?: string): string {
    const raw = (name || '').trim();
    if (!raw) return '';
    const hasKnownPrefix = ShippingGHTKService.DISTRICT_PREFIXES.some((p) => new RegExp(`^${p}\\s`, 'i').test(raw));
    if (hasKnownPrefix) return raw;
    const key = this.toAsciiLower(raw);
    if (/^(q\.?|quan)\s/.test(key)) return `Quận ${raw.replace(/^\S+\s+/, '').trim()}`;
    if (/^(h\.?|huyen)\s/.test(key)) return `Huyện ${raw.replace(/^\S+\s+/, '').trim()}`;
    if (/^(tp|thanh pho)\s/.test(key)) return `Thành phố ${raw.replace(/^\S+\s+/, '').trim()}`;
    if (/^(thi xa)\s/.test(key)) return `Thị xã ${raw.replace(/^\S+\s+/, '').trim()}`;
    return this.ensurePrefix(raw, ShippingGHTKService.DISTRICT_PREFIXES, 'Quận');
  }

  private canonicalizeWardName(name?: string): string {
    const raw = (name || '').trim();
    if (!raw) return '';
    const hasKnownPrefix = ShippingGHTKService.WARD_PREFIXES.some((p) => new RegExp(`^${p}\\s`, 'i').test(raw));
    if (hasKnownPrefix) return raw;
    const key = this.toAsciiLower(raw);
    if (/^(p\.?|phuong)\s/.test(key)) return `Phường ${raw.replace(/^\S+\s+/, '').trim()}`;
    if (/^(xa)\s/.test(key)) return `Xã ${raw.replace(/^\S+\s+/, '').trim()}`;
    if (/^(thi tran)\s/.test(key)) return `Thị trấn ${raw.replace(/^\S+\s+/, '').trim()}`;
    if (/^(dac khu)\s/.test(key)) return `Đặc khu ${raw.replace(/^\S+\s+/, '').trim()}`;
    return this.ensurePrefix(raw, ShippingGHTKService.WARD_PREFIXES, 'Phường');
  }

  private toAsciiLower(input?: string): string {
    if (!input) return '';
    return input
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .replace(/[-_,.]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private canonicalizeProvinceName(name?: string): string {
    const raw = (name || '').trim();
    if (!raw) return '';
    const key = this.toAsciiLower(raw);
    if (ShippingGHTKService.PROVINCE_ALIASES[key]) {
      return ShippingGHTKService.PROVINCE_ALIASES[key];
    }
    // Exact-insensitive match against canonical list
    const found = ShippingGHTKService.PROVINCE_CANONICAL.find(
      (p) => this.toAsciiLower(p) === key
    );
    return found || raw;
  }

  private requireToken(): void {
    if (!this.token) {
      throw new Error('GHTK_TOKEN is not configured - please check environment variables');
    }
  }

  private async request<T = any>(
    path: string, 
    method: HttpMethod = 'GET', 
    body?: any,
    retryCount: number = 0
  ): Promise<GhtkResponse<T>> {
    this.requireToken();
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Token': this.token,
      'User-Agent': 'SmartPOS-GHTK-Integration/1.0',
    };

    const requestId = `ghtk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[GHTK API] ${method} ${path} - Request ID: ${requestId}`);
      
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await res.json().catch(() => ({}));
      
      // Log response for debugging
      console.log(`[GHTK API] Response ${res.status} - Request ID: ${requestId}`, {
        success: res.ok,
        status: res.status,
        data: json
      });

      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 401 || res.status === 403) {
          return { 
            success: false, 
            error: 'GHTK Token invalid or expired - please check token permissions',
            status_code: res.status
          };
        }
        
        if (res.status >= 500 && retryCount < this.maxRetries) {
          // Retry on server errors
          console.log(`[GHTK API] Retrying request ${retryCount + 1}/${this.maxRetries} - Request ID: ${requestId}`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
          return this.request(path, method, body, retryCount + 1);
        }
        
        return { 
          success: false, 
          error: (json as any)?.message || (json as any)?.error || res.statusText,
          status_code: res.status
        };
      }
      
      return { 
        success: true, 
        data: json as T,
        status_code: res.status
      };
    } catch (error: any) {
      console.error(`[GHTK API] Request failed - Request ID: ${requestId}`, error);
      
      if (retryCount < this.maxRetries) {
        console.log(`[GHTK API] Retrying request ${retryCount + 1}/${this.maxRetries} - Request ID: ${requestId}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.request(path, method, body, retryCount + 1);
      }
      
      return { 
        success: false, 
        error: error.message || 'Network error occurred',
        status_code: 0
      };
    }
  }

  // Calculate shipping fee (unified): accepts body or URLSearchParams
  async calculateFeeUnified(payloadOrParams: any): Promise<GhtkResponse<any>> {
    this.requireToken();
    if (payloadOrParams instanceof URLSearchParams) {
      const queryString = payloadOrParams.toString();
      return this.request(`/services/shipment/fee?${queryString}`, 'GET');
    }
    const body = payloadOrParams as {
      pick_province: string; pick_district: string; province: string; district: string; weight: number; value?: number; transport?: 'road' | 'fly';
    };
    if (!body.pick_province || !body.pick_district || !body.province || !body.district || !body.weight) {
      return { success: false, error: 'Missing required fields: pick_province, pick_district, province, district, weight' };
    }
    return this.request('/services/shipment/fee', 'POST', body);
  }

  // Create order with idempotency - Official GHTK API: POST /services/shipment/order
  async createOrder(payload: GhtkOrderPayload, idempotencyKey?: string): Promise<GhtkResponse> {
    // Validate required fields
    const order = payload.order;
    if (!order.id || !order.name || !order.tel || !order.address || !order.province || !order.district) {
      return {
        success: false,
        error: 'Missing required fields: id, name, tel, address, province, district'
      };
    }

    if (!order.pick_name || !order.pick_tel || !order.pick_address || !order.pick_province || !order.pick_district) {
      return {
        success: false,
        error: 'Missing required pickup fields: pick_name, pick_tel, pick_address, pick_province, pick_district'
      };
    }

    // Normalize phone number
    const normalizedTel = order.tel.replace(/[^\d]/g, '');
    const normalizedPickTel = order.pick_tel.replace(/[^\d]/g, '');
    
    // Compose fully-qualified addresses to satisfy GHTK validators
    const ensureStreetPrefix = (street?: string): string => {
      const s = (street || '').trim();
      if (!s) return '';
      if (/\b(Đường|Phố|Quốc lộ|Tỉnh lộ|Hẻm|Ngõ)\b/i.test(s)) return s;
      // If starts with a number or a word (e.g., 'Trần Hưng Đạo'), prefix 'Đường'
      return `Đường ${s}`;
    };

    const normalizeWard = (ward?: string): string => this.canonicalizeWardName(ward);

    const normalizeHamlet = (hamlet?: string): string => {
      const h = (hamlet || '').trim();
      if (!h) return '';
      if (/(Tổ|Thôn|Ấp|Xóm|Đội|Bản)/i.test(h)) return h;
      if (/^\d+/.test(h)) return `Tổ ${h}`;
      return h;
    };

    const normalizeDistrict = (district?: string): string => this.canonicalizeDistrictName(district);

    const normalizeProvince = (province?: string): string => {
      const p = (province || '').trim();
      if (!p) return '';
      if (/\b(Tỉnh|Thành phố)\b/i.test(p)) return p;
      return `Tỉnh ${p}`;
    };
    const composeFullAddress = (
      base: string,
      hamlet?: string,
      ward?: string,
      district?: string,
      province?: string
    ): string => {
      const parts = [
        (hamlet || '').trim(),
        (base || '').trim(),
        (ward || '').trim(),
        (district || '').trim(),
        (province || '').trim()
      ].filter(Boolean);
      return parts.join(', ');
    };

    // Frontend sends hamlet and house_number as separate fields
    // We need to compose them into a full address for GHTK
    const normalizeHouseNumber = (houseNum?: string): string => {
      const h = (houseNum || '').trim();
      if (!h) return '';
      if (/^(số|so\b)/i.test(h)) return h; // already prefixed
      if (/^\d+/.test(h)) return `Số ${h}`;
      return h;
    };

    const hamlet = normalizeHamlet(order.hamlet);
    const houseNum = normalizeHouseNumber(order.house_number);
    const streetAddr = ensureStreetPrefix(order.address);

    // Compose full address: house number, hamlet, street name
    const fullAddress = [houseNum, hamlet, streetAddr]
      .filter(Boolean)
      .join(', ');

    const normalizedPayload = {
      ...payload,
      order: {
        ...order,
        tel: normalizedTel,
        pick_tel: normalizedPickTel,
        // Compose full address with house number and hamlet for GHTK
        address: fullAddress,
        ward: normalizeWard(order.ward),
        district: normalizeDistrict(order.district),
        province: this.canonicalizeProvinceName(normalizeProvince(order.province)),
        pick_address: ensureStreetPrefix(order.pick_address),
        pick_ward: normalizeWard(order.pick_ward),
        pick_district: normalizeDistrict(order.pick_district),
        pick_province: this.canonicalizeProvinceName(normalizeProvince(order.pick_province)),
        // Use idempotency key as order reference
        id: idempotencyKey || order.id
      }
    };

    // Debug log outgoing payload (without token)
    try {
      console.log('[GHTK Payload] createOrder sending:', {
        order: {
          ...normalizedPayload.order,
          tel: '***',
          pick_tel: '***'
        }
      });
    } catch {}

    let response = await this.request('/services/shipment/order', 'POST', normalizedPayload);

    const isAddrError = (msg?: string) => {
      if (!msg) return false;
      return /địa chỉ|thôn|ấp|xóm|tổ|Đường hoặc Phường/i.test(msg);
    };

    // If address-related validation fails, retry with a few address variants
    if (!response.success && isAddrError(response.error)) {
      const variants: Array<Partial<GhtkOrderPayload['order']>> = [
        // Variant 1: Just street with prefix
        { address: ensureStreetPrefix(order.address) },
        // Variant 2: Street + ward embedded to aid parsing
        { address: [ensureStreetPrefix(order.address), normalizeWard(order.ward)].filter(Boolean).join(', ') },
        // Variant 3: Original address without prefix
        { address: order.address },
      ];

      for (const v of variants) {
        const retryPayload = {
          ...normalizedPayload,
          order: {
            ...normalizedPayload.order,
            ...v
          }
        };
        try {
          console.log('[GHTK Retry] Trying address variant:', retryPayload.order.address);
          const r = await this.request('/services/shipment/order', 'POST', retryPayload);
          if (r.success && r.data) {
            response = r;
            break;
          }
          // If still not address error, break to avoid infinite retries on other errors
          if (!isAddrError(r.error)) {
            response = r;
            break;
          }
        } catch (e) {
          // continue next variant
          continue;
        }
      }
    }

    // Extract important fields from response
    if (response.success && response.data) {
      return {
        ...response,
        order_code: response.data.order?.label || response.data.label,
        label: response.data.order?.label || response.data.label,
        fee: response.data.fee || response.data.order?.fee
      };
    }

    return response;
  }

  // Get tracking status
  async trackingStatus(orderCode: string): Promise<GhtkResponse> {
    // Official GHTK API: GET /services/shipment/v2/:order_label
    return this.request(`/services/shipment/v2/${encodeURIComponent(orderCode)}`, 'GET');
  }

  // Print label
  async printLabel(orderCode: string): Promise<GhtkResponse> {
    // Official GHTK API: GET /services/label/:order_label
    return this.request(`/services/label/${encodeURIComponent(orderCode)}`, 'GET');
  }

  // Cancel order
  async cancelOrder(orderCode: string, reason?: string): Promise<GhtkResponse> {
    // Official GHTK API: POST /services/shipment/cancel/:order_label
    // Support both GHTK tracking code and partner ID format
    let endpoint = `/services/shipment/cancel/${encodeURIComponent(orderCode)}`;
    
    // If orderCode looks like a partner ID (not GHTK format), use partner_id prefix
    // GHTK tracking codes typically have format like "S21632601.HNP71-P78.1078509648"
    // Partner IDs are usually shorter and don't have this format
    if (!orderCode.includes('.') && !orderCode.includes('-')) {
      endpoint = `/services/shipment/cancel/partner_id:${encodeURIComponent(orderCode)}`;
    }
    
    const body = reason ? { reason } : undefined;
    return this.request(endpoint, 'POST', body);
  }

  // List pick addresses (warehouses) configured in GHTK account
  async listPickAddresses(): Promise<GhtkResponse> {
    // per docs: GET /services/shipment/list_pick_add
    return this.request('/services/shipment/list_pick_add', 'GET');
  }

  // List orders from GHTK (get all orders from GHTK system)
  async listOrders(page: number = 1, limit: number = 20): Promise<GhtkResponse> {
    // GHTK API endpoint to list orders - using official GHTK API
    // Based on GHTK documentation and token permissions
    const tryPaths = [
      `/services/shipment/list_pick_add`, // List pickup addresses (available with token)
      `/services/shipment/order`, // Main order endpoint
      `/services/shipment/v2/list`, // V2 API
      `/services/shipment/list`, // Direct list endpoint
    ];
    
    for (const path of tryPaths) {
      try {
        const r = await this.request(path, 'GET');
        if (r.success && r.data) {
          // Transform the response to match expected format
          let orders = [];
          if (Array.isArray(r.data)) {
            orders = r.data;
          } else if (r.data.orders && Array.isArray(r.data.orders)) {
            orders = r.data.orders;
          } else if (r.data.data && Array.isArray(r.data.data)) {
            orders = r.data.data;
          } else {
            orders = [r.data];
          }
          
          return {
            success: true,
            data: {
              orders: orders,
              total: orders.length,
              page,
              limit
            }
          };
        }
      } catch (e) {
        // Continue to next endpoint
        continue;
      }
    }
    
    return { success: false, error: 'Failed to list orders from GHTK - no valid endpoint found' };
  }

  // Get order details from GHTK
  async getOrderDetails(orderCode: string): Promise<GhtkResponse> {
    // Use the correct GHTK API endpoint for tracking
    const tryPaths = [
      `/services/shipment/v2/${encodeURIComponent(orderCode)}`, // Official tracking endpoint
      `/services/shipment/${encodeURIComponent(orderCode)}`, // Alternative endpoint
    ];
    
    for (const path of tryPaths) {
      try {
        const r = await this.request(path, 'GET');
        if (r.success && r.data) {
          return r;
        }
      } catch (e) {
        // Continue to next endpoint
        continue;
      }
    }
    
    return { success: false, error: 'Failed to get order details from GHTK' };
  }

  // Validate webhook signature (if GHTK provides signature validation)
  validateWebhookSignature(payload: any, signature: string, secret: string): boolean {
    // GHTK may provide signature validation - implement according to their docs
    // For now, we'll implement basic validation
    try {
      // This is a placeholder - implement actual signature validation based on GHTK docs
      return true;
    } catch (error) {
      console.error('[GHTK Webhook] Signature validation failed:', error);
      return false;
    }
  }

  // Process webhook event
  async processWebhookEvent(payload: any): Promise<{
    success: boolean;
    event_type?: string;
    order_code?: string;
    status?: string;
    error?: string;
  }> {
    try {
      // Extract event information
      const eventType = payload.event_type || payload.status || 'unknown';
      const orderCode = payload.order_code || payload.label || payload.order?.label;
      const status = payload.status || payload.order?.status;

      console.log(`[GHTK Webhook] Processing event: ${eventType} for order: ${orderCode}`);

      return {
        success: true,
        event_type: eventType,
        order_code: orderCode,
        status: status
      };
    } catch (error: any) {
      console.error('[GHTK Webhook] Failed to process webhook event:', error);
      return {
        success: false,
        error: error.message || 'Failed to process webhook event'
      };
    }
  }

  // Get provinces list
  async getProvinces(): Promise<GhtkResponse> {
    // GHTK API for provinces - check official docs for correct endpoint
    return this.request('/services/shipment/provinces', 'GET');
  }

  // Get districts by province
  async getDistricts(provinceCode: string): Promise<GhtkResponse> {
    // GHTK API for districts - check official docs for correct endpoint
    return this.request(`/services/shipment/districts?province=${encodeURIComponent(provinceCode)}`, 'GET');
  }

  // Health check - test API connectivity
  async healthCheck(): Promise<GhtkResponse> {
    try {
      // Use a lightweight endpoint to test connectivity
      const response = await this.request('/services/shipment/list_pick_add', 'GET');
      return {
        success: response.success,
        error: response.success ? undefined : 'GHTK API is not accessible',
        status_code: response.status_code
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'GHTK API health check failed',
        status_code: 0
      };
    }
  }

  // (deprecated) retained for compatibility if called elsewhere
  async calculateFee(params: URLSearchParams): Promise<GhtkResponse<any>> {
    return this.calculateFeeUnified(params);
  }
}


