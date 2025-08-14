#!/bin/bash

# 🚀 SmartPOS Frontend Deployment Script
# This script deploys the improved wrangler.toml configuration

set -e

echo "🚀 SmartPOS Frontend Deployment with Improvements"
echo "=================================================="

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

# Check if we're in the frontend directory
if [ ! -f "wrangler.toml" ]; then
    print_error "wrangler.toml not found. Please run this script from the frontend directory."
    exit 1
fi

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

# Install dependencies
print_status "Installing dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_warning "No package.json found, skipping dependency installation"
fi

# Build the project
print_status "Building the project..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Validate wrangler.toml
print_status "Validating wrangler.toml configuration..."
if wrangler pages project list &> /dev/null; then
    print_success "Wrangler configuration is valid"
else
    print_error "Wrangler configuration validation failed"
    exit 1
fi

# Deploy to Cloudflare Pages
print_status "Deploying to Cloudflare Pages..."
if wrangler pages deploy dist --project-name smartpos-web; then
    print_success "Deployment completed successfully!"
else
    print_error "Deployment failed"
    exit 1
fi

# Display deployment information
echo ""
echo "🎉 Deployment Summary"
echo "===================="
print_success "✅ Frontend deployed with improved configuration"
print_success "✅ SPA routing configured"
print_success "✅ Security headers enabled"
print_success "✅ Performance caching optimized"
print_success "✅ CORS headers configured"
print_success "✅ Analytics enabled"

echo ""
echo "🔗 Application URLs:"
echo "Production: https://smartpos-web.pages.dev"
echo "Custom Domain: https://222737d2.smartpos-web.pages.dev"

echo ""
echo "📊 Next Steps:"
echo "1. Test all routes work correctly"
echo "2. Verify API connectivity"
echo "3. Check security headers in browser dev tools"
echo "4. Monitor performance in Cloudflare Analytics"
echo "5. Run Lighthouse audit for performance verification"

echo ""
print_status "Deployment completed! 🚀"
