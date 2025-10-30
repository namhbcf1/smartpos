# SmartPOS - Hệ thống quản lý bán hàng thông minh

## 📋 Tổng quan

SmartPOS là một hệ thống quản lý bán hàng toàn diện được xây dựng với công nghệ hiện đại, hỗ trợ quản lý cửa hàng, kho hàng, khách hàng và báo cáo kinh doanh.

## 🚀 Tính năng chính

### 🛒 Quản lý bán hàng (POS)
- Giao diện POS trực quan và dễ sử dụng
- Hỗ trợ nhiều phương thức thanh toán (Tiền mặt, Thẻ, VNPay, MoMo)
- Quản lý giỏ hàng và hóa đơn
- In hóa đơn tự động

### 📦 Quản lý kho hàng
- Theo dõi tồn kho real-time
- Quản lý nhập/xuất hàng
- Cảnh báo hết hàng
- Quản lý serial number và bảo hành

### 👥 Quản lý khách hàng
- Thông tin khách hàng chi tiết
- Lịch sử mua hàng
- Chương trình khách hàng thân thiết
- Phân khúc khách hàng

### 📊 Báo cáo và phân tích
- Dashboard tổng quan
- Báo cáo doanh thu
- Phân tích xu hướng bán hàng
- Báo cáo tồn kho

### 🚚 Vận chuyển
- Tích hợp GHTK (Giao hàng tiết kiệm)
- Quản lý đơn vận chuyển
- Theo dõi trạng thái giao hàng

## 🛠️ Công nghệ sử dụng

### Backend
- **Cloudflare Workers** - Serverless runtime
- **D1 Database** - SQLite database
- **KV Storage** - Key-value storage
- **R2 Storage** - Object storage
- **Durable Objects** - Stateful objects
- **TypeScript** - Type-safe development

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - UI components
- **React Router** - Routing

### Mobile
- **React Native** - Cross-platform mobile

## 📁 Cấu trúc dự án

```
smart/
├── src/                    # Backend source code
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Middleware functions
│   ├── durable_objects/  # Durable Objects
│   └── utils/            # Utility functions
├── frontend/              # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── utils/        # Frontend utilities
│   └── public/           # Static assets
├── mobile/                # React Native app
├── database/              # Database schemas and migrations
├── migrations/            # Database migrations
└── docs/                  # Documentation
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Cloudflare account (cho deployment)

### Cài đặt dependencies

```bash
# Cài đặt backend dependencies
npm install

# Cài đặt frontend dependencies
cd frontend
npm install

# Cài đặt mobile dependencies
cd ../mobile
npm install
```

### Chạy development

```bash
# Backend (Cloudflare Workers)
npm run dev

# Frontend
cd frontend
npm run dev

# Mobile
cd mobile
npm start
```

## 🌐 Deployment

### Cloudflare Workers
```bash
# Deploy backend
npm run deploy

# Deploy frontend (Cloudflare Pages)
cd frontend
npm run build
# Upload dist/ folder to Cloudflare Pages
```

### Environment Variables
Tạo file `.env` với các biến môi trường cần thiết:

```env
# Database
DATABASE_URL=your_database_url

# Authentication
JWT_SECRET=your_jwt_secret
JWT_ISSUER=smartpos
JWT_AUDIENCE=smartpos-clients

# Payment Gateways
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret

# Shipping
GHTK_TOKEN=your_ghtk_token
```

## 📚 API Documentation

API được document chi tiết tại `/docs/api` endpoint khi chạy server.

### Endpoints chính:
- `GET /api/health` - Health check
- `POST /api/auth/login` - Đăng nhập
- `GET /api/products` - Danh sách sản phẩm
- `POST /api/orders` - Tạo đơn hàng
- `GET /api/reports/sales` - Báo cáo doanh thu

## 🧪 Testing

```bash
# Chạy tests
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

## 📖 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema](docs/D1_DATABASE_SCHEMA.md)
- [Frontend Pages](docs/FRONTEND_PAGES_OVERVIEW.md)
- [VNPay Integration](docs/VNPAY_INTEGRATION.md)
 - Local AI (free):
   - Use Ollama one-click: `scripts/ai-oneclick-ollama.ps1`
   - Or llama.cpp (no Ollama): `scripts/ai-oneclick-llamacpp.ps1` then run generated `C:\ai\ai-start-llamacpp.ps1`
   - Backend env (for llama.cpp): `AI_PROVIDER=openai`, `OLLAMA_BASE_URL=http://localhost:11434`
 - Self-hosted Llama 3 (Ollama) Proxy:
   - Backend endpoints:
     - `POST /api/ai/chat` – body `{ messages: [{role, content}], model?, stream? }`
     - `GET /api/ai/models` – list models from Ollama
   - Env vars: `OLLAMA_BASE_URL`, `OLLAMA_MODEL` (default `llama3:8b`), `OLLAMA_PROXY_KEY` (optional)
   - Frontend helper: `frontend/src/services/ai.ts`

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Developer**: SmartPOS Team
- **Email**: support@smartpos.com
- **Website**: https://smartpos.com

## 🙏 Acknowledgments

- Cloudflare Workers platform
- React community
- Ant Design team
- All contributors

---

**SmartPOS** - Giải pháp quản lý bán hàng thông minh cho tương lai 🚀
