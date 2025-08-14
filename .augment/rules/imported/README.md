---
type: "manual"
---

# SmartPOS - Point of Sale System

A modern Point of Sale system built using Cloudflare's free tier services.

## Features

- **Complete POS System**: Process sales, manage inventory, track transactions
- **Real-time Data**: All data synchronized with Cloudflare D1 database
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **User Management**: Different access levels (admin, manager, cashier, staff)
- **Inventory Control**: Product management with low stock alerts
- **Sales Reporting**: View sales data and generate reports
- **Receipt Generation**: Create and print sales receipts

## Technology Stack

- **Backend**:
  - Cloudflare Workers (API endpoints)
  - Cloudflare D1 (SQLite database)
  - Cloudflare KV (Caching and session storage)
  - TypeScript & Hono framework

- **Frontend**:
  - React with TypeScript
  - Material UI components
  - React Query for data fetching
  - React Router for navigation
  - Recharts for visualization
  - Deployed on Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js (v14+)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/smartpos.git
   cd smartpos
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Cloudflare:
   - Create a D1 database
   - Create KV namespaces
   - Update `wrangler.toml` with your IDs

4. Initialize the database:
   ```
   wrangler d1 execute smartpos-db --file=src/schema.sql
   ```

5. Start development server:
   ```
   npm run dev
   ```

6. Build for production:
   ```
   npm run build
   ```

7. Deploy:
   ```
   wrangler deploy
   ```

## Default Login

- Username: `admin`
- Password: `admin`

## Project Structure

```
smartpos/
├── src/                    # Backend code
│   ├── index.ts            # Main entry point
│   ├── routes/             # API routes
│   ├── middleware/         # Middleware functions
│   ├── db/                 # Database operations
│   └── types.ts            # TypeScript types
├── frontend/               # Frontend code
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   └── config/         # Configuration
│   └── public/             # Static assets
└── wrangler.toml           # Cloudflare Workers configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Cloudflare's suite of developer tools
- Uses Hono framework for API development
- Frontend developed with Material UI components 