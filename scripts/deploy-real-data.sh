#!/bin/bash

# 🚀 SmartPOS Real Data Deployment Script
# This script deploys 100% real data to D1 Cloudflare database
# NO MOCK DATA - All data is production-ready

set -e

echo "🚀 SmartPOS Real Data Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Wrangler
print_status "Checking Wrangler authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not logged in to Wrangler. Please login first:"
    echo "wrangler login"
    exit 1
fi

print_success "Wrangler authentication verified"

# Check if we're in the correct directory
if [ ! -f "src/db/seed-real-data.sql" ]; then
    print_error "seed-real-data.sql not found. Please run this script from the project root directory."
    exit 1
fi

# Deploy the real data to D1 database
print_status "Deploying real data to D1 database..."

# Execute the seed script
if wrangler d1 execute smartpos-db --file=src/db/seed-real-data.sql; then
    print_success "Real data deployed successfully!"
else
    print_error "Failed to deploy real data"
    exit 1
fi

# Verify the data was inserted correctly
print_status "Verifying data deployment..."

# Check products count
PRODUCTS_COUNT=$(wrangler d1 execute smartpos-db --command="SELECT COUNT(*) as count FROM products;" --json | jq -r '.[0].results[0].count')
print_status "Products in database: $PRODUCTS_COUNT"

# Check customers count  
CUSTOMERS_COUNT=$(wrangler d1 execute smartpos-db --command="SELECT COUNT(*) as count FROM customers;" --json | jq -r '.[0].results[0].count')
print_status "Customers in database: $CUSTOMERS_COUNT"

# Check sales count
SALES_COUNT=$(wrangler d1 execute smartpos-db --command="SELECT COUNT(*) as count FROM sales;" --json | jq -r '.[0].results[0].count')
print_status "Sales in database: $SALES_COUNT"

# Check categories count
CATEGORIES_COUNT=$(wrangler d1 execute smartpos-db --command="SELECT COUNT(*) as count FROM categories;" --json | jq -r '.[0].results[0].count')
print_status "Categories in database: $CATEGORIES_COUNT"

# Verify expected counts
if [ "$PRODUCTS_COUNT" -ge "8" ] && [ "$CUSTOMERS_COUNT" -ge "6" ] && [ "$SALES_COUNT" -ge "5" ] && [ "$CATEGORIES_COUNT" -ge "3" ]; then
    print_success "✅ Data verification passed!"
    echo ""
    echo "📊 Database Summary:"
    echo "==================="
    echo "Products: $PRODUCTS_COUNT"
    echo "Customers: $CUSTOMERS_COUNT" 
    echo "Sales: $SALES_COUNT"
    echo "Categories: $CATEGORIES_COUNT"
    echo ""
    print_success "🎉 100% Real D1 Cloudflare Data Deployed Successfully!"
    echo ""
    echo "🔗 Next Steps:"
    echo "1. Deploy the updated backend API: wrangler deploy"
    echo "2. Test the API endpoints to verify real data"
    echo "3. Deploy the frontend with updated configuration"
    echo "4. Run comprehensive E2E tests"
else
    print_error "❌ Data verification failed!"
    echo "Expected: Products ≥ 8, Customers ≥ 6, Sales ≥ 5, Categories ≥ 3"
    echo "Actual: Products = $PRODUCTS_COUNT, Customers = $CUSTOMERS_COUNT, Sales = $SALES_COUNT, Categories = $CATEGORIES_COUNT"
    exit 1
fi

print_status "Real data deployment completed! 🚀"
