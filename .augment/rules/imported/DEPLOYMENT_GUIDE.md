---
type: "manual"
---

# ComputerPOS Pro - Warranty System Deployment Guide

## 🎯 Overview
Complete deployment guide for the warranty management system including serial number tracking, warranty registration, and automated notifications.

## 📋 Pre-Deployment Checklist

### 1. Database Preparation
- [ ] Run database migrations for warranty tables
- [ ] Verify foreign key constraints
- [ ] Create indexes for performance
- [ ] Set up sample data for testing

### 2. Environment Configuration
- [ ] Configure JWT secrets
- [ ] Set up email service credentials (SendGrid/Mailgun)
- [ ] Configure SMS service (Twilio)
- [ ] Set up push notification service
- [ ] Configure rate limiting settings

### 3. Cloudflare Workers Setup
- [ ] Deploy Durable Objects
- [ ] Configure cron triggers
- [ ] Set up environment variables
- [ ] Configure custom domains
- [ ] Set up monitoring and alerts

### 4. Frontend Build
- [ ] Build production frontend
- [ ] Configure API endpoints
- [ ] Set up CDN and caching
- [ ] Test responsive design
- [ ] Verify all routes work

## 🚀 Deployment Steps

### Step 1: Database Migration
```sql
-- Run warranty schema migration
-- File: src/db/warranty-schema.sql

-- Verify tables created
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'warranty%';

-- Check sample data
SELECT COUNT(*) FROM warranty_registrations;
SELECT COUNT(*) FROM warranty_notifications;
SELECT COUNT(*) FROM serial_numbers;
```

### Step 2: Backend Deployment
```bash
# Deploy to Cloudflare Workers
wrangler deploy

# Verify deployment
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/health

# Test warranty endpoints
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/warranty/registrations
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/serial-numbers
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/warranty-notifications
```

### Step 3: Frontend Deployment
```bash
# Build frontend
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist

# Verify deployment
curl https://41cf37a1.smartpos-web.pages.dev/warranty
```

### Step 4: Cron Configuration
```toml
# Add to wrangler.toml
[[triggers]]
crons = ["0 * * * *"]  # Every hour
```

### Step 5: Test Scheduled Tasks
```bash
# Test warranty notification processing
curl -X POST https://smartpos-api.bangachieu2.workers.dev/api/v1/scheduled/warranty-notifications/test

# Force check for expiring warranties
curl -X POST https://smartpos-api.bangachieu2.workers.dev/api/v1/scheduled/warranty-notifications/force-check

# Get system status
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/scheduled/warranty-notifications/status
```

## 🧪 Testing Procedures

### 1. Unit Tests
```bash
# Run warranty system tests
npm test tests/warranty-system.test.ts

# Run all tests
npm test

# Generate coverage report
npm run test:coverage
```

### 2. API Testing
```bash
# Test warranty registration
curl -X POST https://smartpos-api.bangachieu2.workers.dev/api/v1/warranty/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serial_number_id": 1,
    "warranty_type": "manufacturer",
    "warranty_period_months": 12,
    "terms_accepted": true
  }'

# Test serial number creation
curl -X POST https://smartpos-api.bangachieu2.workers.dev/api/v1/serial-numbers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serial_number": "SN123456789",
    "product_id": 1,
    "location": "Store A"
  }'

# Test notification creation
curl -X POST https://smartpos-api.bangachieu2.workers.dev/api/v1/warranty-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "warranty_registration_id": 1,
    "notification_type": "expiry_warning",
    "notification_method": "email",
    "scheduled_date": "2024-12-31T10:00:00Z",
    "message": "Test notification"
  }'
```

### 3. Frontend Testing
- [ ] Login with admin credentials
- [ ] Navigate to warranty management
- [ ] Create new warranty registration
- [ ] Test serial number assignment
- [ ] Verify notification dashboard
- [ ] Test POS integration
- [ ] Check responsive design

### 4. Integration Testing
- [ ] Complete sale with serial numbers
- [ ] Verify warranty auto-creation
- [ ] Check notification scheduling
- [ ] Test claim creation
- [ ] Verify notification sending

### 5. Performance Testing
- [ ] Load test API endpoints
- [ ] Test bulk serial number creation
- [ ] Verify notification processing speed
- [ ] Check database performance
- [ ] Monitor memory usage

## 📊 Monitoring & Alerts

### 1. Key Metrics
- API response times
- Database query performance
- Notification success rates
- Error rates and types
- User activity patterns

### 2. Cloudflare Analytics
- Worker execution time
- Request volume
- Error rates
- Geographic distribution
- Cache hit rates

### 3. Custom Alerts
```javascript
// Example alert configuration
const alerts = {
  highErrorRate: {
    threshold: '5%',
    timeWindow: '5 minutes',
    action: 'email admin'
  },
  slowResponse: {
    threshold: '2 seconds',
    timeWindow: '1 minute',
    action: 'slack notification'
  },
  failedNotifications: {
    threshold: '10 failures',
    timeWindow: '1 hour',
    action: 'email support'
  }
};
```

## 🔒 Security Checklist

### 1. Authentication & Authorization
- [ ] JWT token validation
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] CORS configuration

### 2. Data Protection
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Data encryption at rest

### 3. API Security
- [ ] HTTPS enforcement
- [ ] Request size limits
- [ ] Authentication headers
- [ ] Error message sanitization

## 🔧 Configuration Files

### Environment Variables
```bash
# Required environment variables
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
FRONTEND_URL=https://41cf37a1.smartpos-web.pages.dev
API_URL=https://smartpos-api.bangachieu2.workers.dev
```

### Wrangler Configuration
```toml
name = "smartpos-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[triggers]]
crons = ["0 * * * *"]

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.durable_objects.bindings]]
name = "WARRANTY_SYNC"
class_name = "WarrantySyncObject"

[[env.production.d1_databases]]
binding = "DB"
database_name = "smartpos-production"
```

## 📈 Performance Optimization

### 1. Database Optimization
- Create indexes on frequently queried columns
- Optimize notification queries
- Use prepared statements
- Implement connection pooling

### 2. Caching Strategy
- Cache warranty statistics
- Cache notification templates
- Use CDN for static assets
- Implement API response caching

### 3. Code Optimization
- Minimize bundle size
- Lazy load components
- Optimize database queries
- Use efficient algorithms

## 🚨 Troubleshooting

### Common Issues

#### 1. Notifications Not Sending
```bash
# Check notification status
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/warranty-notifications/stats

# Check scheduled tasks
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/scheduled/warranty-notifications/status

# Force send pending notifications
curl -X POST https://smartpos-api.bangachieu2.workers.dev/api/v1/scheduled/warranty-notifications/send-pending
```

#### 2. Database Connection Issues
```bash
# Check database health
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/health

# Verify tables exist
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/warranty/registrations?limit=1
```

#### 3. Frontend Loading Issues
```bash
# Check API connectivity
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/health

# Verify authentication
curl -H "Authorization: Bearer YOUR_TOKEN" https://smartpos-api.bangachieu2.workers.dev/api/v1/users/me
```

## 📞 Support & Maintenance

### 1. Regular Maintenance Tasks
- [ ] Monitor notification success rates
- [ ] Clean up old notifications
- [ ] Update warranty templates
- [ ] Review system performance
- [ ] Update dependencies

### 2. Backup Procedures
- [ ] Database backups
- [ ] Configuration backups
- [ ] Code repository backups
- [ ] Environment variable backups

### 3. Update Procedures
- [ ] Test in staging environment
- [ ] Deploy during maintenance window
- [ ] Monitor for issues
- [ ] Rollback plan ready
- [ ] Update documentation

## ✅ Post-Deployment Verification

### 1. Functional Tests
- [ ] All API endpoints responding
- [ ] Frontend loads correctly
- [ ] Authentication working
- [ ] Notifications sending
- [ ] Database operations working

### 2. Performance Tests
- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] Proper error handling
- [ ] Monitoring active
- [ ] Alerts configured

### 3. User Acceptance
- [ ] Admin can manage warranties
- [ ] Staff can create registrations
- [ ] Customers receive notifications
- [ ] Reports generate correctly
- [ ] System is stable

## 🎉 Go-Live Checklist

- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Rollback plan ready
- [ ] Support team notified
- [ ] Go-live approved

The warranty system is now ready for production deployment!
