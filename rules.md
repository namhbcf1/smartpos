# 📋 POS System Development Rules & Guidelines

## 🚫 STRICT PROHIBITIONS (Zero Tolerance)

### ❌ Mock Data & Fake APIs
- **NEVER** use placeholder data like `lorem ipsum`, `fake products`, `test@example.com`
- **NEVER** create fake JSON responses or mock API endpoints
- **NEVER** use `demo mode` or `development mode` switches
- **NEVER** hardcode sample data in components
- **NEVER** use `setTimeout` to simulate API calls
- **NEVER** create fake user accounts or test stores

### ❌ Local Development Only
- **NEVER** build features that only work on `localhost`
- **NEVER** use local databases or file systems
- **NEVER** create offline-only functionality
- **NEVER** rely on local storage as primary data source
- **NEVER** use development servers for production features

### ❌ Third-Party Dependencies
- **NEVER** use services outside Cloudflare ecosystem
- **NEVER** integrate external databases (MySQL, PostgreSQL, MongoDB)
- **NEVER** use external authentication providers (Auth0, Firebase)
- **NEVER** use third-party payment processors in backend
- **NEVER** rely on external APIs for core functionality

## ✅ MANDATORY REQUIREMENTS

### 🗄️ Database Rules
- **ALWAYS** use Cloudflare D1 as the single source of truth
- **ALWAYS** validate data with Zod schemas before DB operations
- **ALWAYS** use prepared statements to prevent SQL injection
- **ALWAYS** implement proper database migrations
- **ALWAYS** create realistic sample data through seeding scripts
- **ALWAYS** use database constraints and foreign keys
- **ALWAYS** implement soft deletes for important entities

### 🔐 Authentication Rules
- **ALWAYS** use JWT tokens stored in httpOnly cookies
- **ALWAYS** implement token refresh mechanism
- **ALWAYS** validate user permissions on every request
- **ALWAYS** use magic link authentication as primary method
- **ALWAYS** implement rate limiting on auth endpoints
- **ALWAYS** hash passwords with strong algorithms (bcrypt/scrypt)
- **ALWAYS** validate user roles before data access

### 🎨 UI/UX Rules
- **ALWAYS** create separate mobile and desktop interfaces
- **ALWAYS** use consistent design tokens from TailwindCSS config
- **ALWAYS** implement proper loading states for all async operations
- **ALWAYS** show error messages with actionable instructions
- **ALWAYS** use semantic HTML and proper accessibility attributes
- **ALWAYS** implement proper form validation with clear feedback
- **ALWAYS** design for touch interfaces on mobile

### 📡 API Rules
- **ALWAYS** return consistent JSON response format
- **ALWAYS** implement proper HTTP status codes
- **ALWAYS** validate request bodies with Zod schemas
- **ALWAYS** implement request rate limiting
- **ALWAYS** use proper error handling middleware
- **ALWAYS** log important actions for audit trails
- **ALWAYS** implement API versioning from day one

### 🔄 Real-time Rules
- **ALWAYS** use Durable Objects for state management
- **ALWAYS** implement graceful WebSocket reconnection
- **ALWAYS** handle offline/online state transitions
- **ALWAYS** resolve conflicts in real-time updates
- **ALWAYS** broadcast changes to all connected clients
- **ALWAYS** maintain data consistency across sessions

## 📐 CODE QUALITY STANDARDS

### 🏗️ Architecture Rules
- **ALWAYS** follow domain-driven design principles
- **ALWAYS** separate concerns (UI, business logic, data access)
- **ALWAYS** use dependency injection patterns
- **ALWAYS** implement repository pattern for data access
- **ALWAYS** create reusable service classes
- **ALWAYS** follow SOLID principles
- **ALWAYS** use proper error boundaries in React/Svelte

### 📝 Naming Conventions
- **Files**: `kebab-case` for all files and folders
- **Variables**: `camelCase` for variables and functions
- **Constants**: `SCREAMING_SNAKE_CASE` for constants
- **Types**: `PascalCase` for interfaces and types
- **Components**: `PascalCase` for component files
- **Database**: `snake_case` for tables and columns
- **API Endpoints**: `/kebab-case/resource-name`

### 🧪 Testing Rules
- **ALWAYS** write unit tests for business logic
- **ALWAYS** test API endpoints with real database
- **ALWAYS** test edge cases and error conditions
- **ALWAYS** mock external dependencies only
- **ALWAYS** write integration tests for critical flows
- **ALWAYS** maintain minimum 80% test coverage
- **ALWAYS** test mobile and desktop interfaces separately

### 📊 Performance Rules
- **ALWAYS** optimize database queries with indexes
- **ALWAYS** implement pagination for large datasets
- **ALWAYS** use KV store for frequently accessed data
- **ALWAYS** optimize bundle sizes and code splitting
- **ALWAYS** implement proper caching strategies
- **ALWAYS** monitor Core Web Vitals metrics
- **ALWAYS** optimize images and assets in R2

## 🔒 SECURITY REQUIREMENTS

### 🛡️ Data Protection
- **ALWAYS** validate and sanitize all user inputs
- **ALWAYS** use parameterized queries for database
- **ALWAYS** implement proper CORS policies
- **ALWAYS** encrypt sensitive data in database
- **ALWAYS** use HTTPS for all communications
- **ALWAYS** implement proper session management
- **ALWAYS** follow OWASP security guidelines

### 🔑 Access Control
- **ALWAYS** implement principle of least privilege
- **ALWAYS** validate user permissions at API level
- **ALWAYS** audit sensitive operations
- **ALWAYS** implement session timeout
- **ALWAYS** use secure headers (CSP, HSTS, etc.)
- **ALWAYS** validate JWT tokens on every request

## 💾 DATA MANAGEMENT RULES

### 📈 Data Integrity
- **ALWAYS** use database transactions for related operations
- **ALWAYS** implement data validation at multiple layers
- **ALWAYS** create backup strategies for critical data
- **ALWAYS** implement audit trails for important changes
- **ALWAYS** use foreign key constraints
- **ALWAYS** handle data migration scripts properly

### 🔄 Real-time Sync
- **ALWAYS** implement optimistic updates with rollback
- **ALWAYS** handle network interruptions gracefully
- **ALWAYS** resolve conflicts with last-write-wins or manual resolution
- **ALWAYS** maintain data consistency across multiple clients
- **ALWAYS** implement proper event sourcing for critical operations

## 🚀 DEPLOYMENT RULES

### 🌐 Production Requirements
- **ALWAYS** use environment variables for configuration
- **ALWAYS** implement proper CI/CD pipelines
- **ALWAYS** test in staging environment before production
- **ALWAYS** implement blue-green deployment strategy
- **ALWAYS** monitor application health and performance
- **ALWAYS** implement proper logging and alerting
- **ALWAYS** use versioned deployments with rollback capability

### 📱 PWA Requirements
- **ALWAYS** implement service worker for caching
- **ALWAYS** provide offline functionality for critical features
- **ALWAYS** implement push notifications
- **ALWAYS** create app manifest for installation
- **ALWAYS** optimize for mobile performance
- **ALWAYS** implement background sync

## 🧩 DEVELOPMENT WORKFLOW

### 📋 Feature Development
1. **ALWAYS** create feature branch from main
2. **ALWAYS** write tests before implementation
3. **ALWAYS** implement database changes first
4. **ALWAYS** create API endpoints with validation
5. **ALWAYS** build UI components with proper states
6. **ALWAYS** test integration end-to-end
7. **ALWAYS** create pull request with proper description
8. **ALWAYS** review code thoroughly before merge

### 🔍 Code Review Requirements
- **ALWAYS** check for security vulnerabilities
- **ALWAYS** verify database query optimization
- **ALWAYS** ensure proper error handling
- **ALWAYS** validate UI/UX consistency
- **ALWAYS** check for performance implications
- **ALWAYS** verify test coverage
- **ALWAYS** ensure documentation updates

## 📚 DOCUMENTATION RULES

### 📖 Required Documentation
- **ALWAYS** document API endpoints with examples
- **ALWAYS** create database schema documentation
- **ALWAYS** document component props and usage
- **ALWAYS** write setup and deployment guides
- **ALWAYS** maintain changelog for releases
- **ALWAYS** document business logic and rules
- **ALWAYS** create troubleshooting guides

### 💬 Code Comments
- **ALWAYS** comment complex business logic
- **ALWAYS** explain non-obvious technical decisions
- **ALWAYS** document performance optimizations
- **ALWAYS** explain security implementations
- **ALWAYS** document known limitations or workarounds

## ⚡ PERFORMANCE BENCHMARKS

### 📊 Required Metrics
- **Page Load**: < 2 seconds on 3G
- **API Response**: < 300ms for CRUD operations
- **Real-time Updates**: < 100ms latency
- **Database Queries**: < 50ms for simple operations
- **Bundle Size**: < 500KB initial load
- **Lighthouse Score**: > 90 for all metrics

## 🎯 BUSINESS LOGIC RULES

### 💰 Financial Operations
- **ALWAYS** use precise decimal arithmetic (no floating point)
- **ALWAYS** maintain audit trails for all financial transactions
- **ALWAYS** implement double-entry bookkeeping principles
- **ALWAYS** validate payment amounts and methods
- **ALWAYS** handle refunds and adjustments properly
- **ALWAYS** implement proper tax calculations
- **ALWAYS** ensure transaction atomicity

### 📦 Inventory Management
- **ALWAYS** update inventory in real-time
- **ALWAYS** implement stock level alerts
- **ALWAYS** handle negative inventory scenarios
- **ALWAYS** track inventory movements with audit trail
- **ALWAYS** implement batch operations efficiently
- **ALWAYS** handle product variants correctly

🎯 Các Quy Tắc Cốt Lõi:
ZERO TOLERANCE (Không Khoan Nhượng):

❌ Tuyệt đối không mock data hay fake APIs
❌ Không localhost-only features
❌ Không third-party dependencies ngoài Cloudflare

MANDATORY (Bắt Buộc):

✅ 100% Cloudflare D1 cho database
✅ Real JWT authentication
✅ Separate mobile/desktop interfaces
✅ Production-ready từ ngày đầu

🏗️ Tiêu Chuẩn Chất Lượng:
Architecture:

Domain-driven design
SOLID principles
Repository pattern
Proper error boundaries

Security:

OWASP guidelines
Parameterized queries
Proper session management
Comprehensive input validation

Performance:

< 2s page load on 3G
< 300ms API response
< 100ms real-time updates
Lighthouse score > 90

💼 Business Logic Rules:
Financial Operations:

Precise decimal arithmetic
Double-entry bookkeeping
Complete audit trails
Transaction atomicity

Inventory Management:

Real-time stock updates
Proper variant handling
Negative inventory scenarios
Batch operation efficiency

🚀 Development Workflow:

Feature branch → Tests → Database → API → UI → Integration → PR → Review → Merge
Mandatory code review checklist
CI/CD pipeline requirements
Documentation standards

Bộ quy tắc này đảm bảo:

Consistency: Coding standards nhất quán
Quality: High-quality, maintainable code
Security: Enterprise-grade security
Performance: Optimal user experience
Scalability: Ready for growth

These rules are non-negotiable and must be followed throughout the entire development process. Any deviation must be documented and approved by the technical lead.