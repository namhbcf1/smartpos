# SmartPOS - Smart Point of Sale System

A production-ready Point of Sale system built with React, TypeScript, and Cloudflare Workers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Cloudflare account with Workers, D1, KV, and R2 access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   npm install
   
   # Frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your Cloudflare credentials
   nano .env
   ```

4. **Setup database**
   ```bash
   # Create D1 database
   npm run db:create
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start development**
   ```bash
   # Backend (Terminal 1)
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

## 📁 Project Structure

```
smart/
├── src/                    # Backend source code
│   ├── index.ts           # Main entry point
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   └── types/             # TypeScript types
├── frontend/              # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── vite.config.ts
├── database/              # Database migrations & seeds
├── .cursorrules          # Cursor AI rules
├── wrangler.toml         # Cloudflare Workers config
└── package.json          # Backend dependencies
```

## 🛠️ Development Rules

### Production Standards
- ❌ **NO MOCK/DEMO DATA** - All data must come from real APIs
- ❌ **NO TESTING MODES** - All features must work in production
- ❌ **NO CONSOLE.LOG** - Use proper logging instead
- ✅ **REAL API CALLS** - Use comprehensiveAPI, posApi, or apiClient
- ✅ **ERROR HANDLING** - Wrap all API calls in try-catch
- ✅ **TYPE SAFETY** - Use TypeScript strict mode

### Code Quality
- Run `npm run type-check` before committing
- Run `npm run lint` to check code style
- Use proper import paths: `'../../services/api'`
- Handle loading states and error states
- Provide user feedback with toast notifications

### API Standards
- Use RESTful endpoints
- Implement proper error handling
- Add rate limiting and CORS
- Validate input with Zod schemas
- Return consistent response formats

## 🔧 Available Scripts

### Backend
```bash
npm run dev              # Start development server
npm run deploy           # Deploy to production
npm run deploy:staging   # Deploy to staging
npm run build            # Type check
npm run lint             # Lint code
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database
```

### Frontend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
npm run type-check       # Type check
npm run format           # Format code
```

## 🌐 Deployment

### Backend (Cloudflare Workers)
```bash
npm run deploy
```

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run deploy
```

## 📊 Environment Variables

### Backend (.env)
```env
# Cloudflare Credentials
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Database
CLOUDFLARE_D1_DATABASE_ID=your_database_id

# Storage
CLOUDFLARE_KV_CACHE_ID=your_kv_id
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-api.workers.dev
VITE_FRONTEND_URL=https://your-app.pages.dev
VITE_CLOUDFLARE_WS_URL=wss://your-api.workers.dev/realtime
```

## 🗄️ Database Schema

The system uses Cloudflare D1 with the following main tables:
- `users` - User accounts and authentication
- `products` - Product catalog
- `orders` - Sales transactions
- `customers` - Customer information
- `inventory` - Stock management
- `settings` - System configuration

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (ADMIN, MANAGER, STAFF, CASHIER)
- Permission-based feature access
- Session management with KV storage

## 📱 Features

### Core POS Features
- Product catalog management
- Sales transactions
- Customer management
- Inventory tracking
- Payment processing
- Receipt printing

### Advanced Features
- Real-time updates
- Analytics and reporting
- Multi-location support
- User management
- Settings configuration
- Backup and restore

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Check import paths
   npm run type-check
   ```

2. **API Connection Issues**
   ```bash
   # Verify environment variables
   echo $VITE_API_BASE_URL
   ```

3. **Database Issues**
   ```bash
   # Reset database
   npm run db:migrate
   npm run db:seed
   ```

4. **Build Errors**
   ```bash
   # Clean and rebuild
   npm run clean
   npm install
   npm run build
   ```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the development rules
3. Ensure all environment variables are set
4. Verify Cloudflare services are properly configured

## 📄 License

MIT License - see LICENSE file for details.

---

**Remember**: This is a production system. Every line of code must be production-ready!
