#!/bin/bash

# SmartPOS Returns System Deployment Script
# This script deploys the complete returns system with all necessary configurations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        log_error "npx is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    log_success "All dependencies are available"
}

# Install project dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        log_success "Backend dependencies installed"
    else
        log_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        npm install
        cd ..
        log_success "Frontend dependencies installed"
    else
        log_warning "Frontend directory not found or no package.json"
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Check if migration file exists
    if [ -f "migrations/0003_returns_system.sql" ]; then
        log_info "Running returns system migration..."
        
        # Try to run the migration
        if npx wrangler d1 execute smartpos-db --file=migrations/0003_returns_system.sql; then
            log_success "Returns system migration completed successfully"
        else
            log_warning "Migration failed or database already up to date"
        fi
    else
        log_error "Returns migration file not found: migrations/0003_returns_system.sql"
        exit 1
    fi
    
    # Run other migrations if they exist
    for migration in migrations/*.sql; do
        if [ "$migration" != "migrations/0003_returns_system.sql" ] && [ -f "$migration" ]; then
            log_info "Running migration: $migration"
            if npx wrangler d1 execute smartpos-db --file="$migration"; then
                log_success "Migration $migration completed"
            else
                log_warning "Migration $migration failed or already applied"
            fi
        fi
    done
}

# Deploy backend
deploy_backend() {
    log_info "Deploying backend to Cloudflare Workers..."
    
    if npx wrangler deploy; then
        log_success "Backend deployed successfully"
    else
        log_error "Backend deployment failed"
        exit 1
    fi
}

# Deploy frontend
deploy_frontend() {
    log_info "Deploying frontend to Cloudflare Pages..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Build frontend
        log_info "Building frontend..."
        if npm run build; then
            log_success "Frontend built successfully"
        else
            log_error "Frontend build failed"
            cd ..
            exit 1
        fi
        
        # Deploy frontend
        log_info "Deploying frontend..."
        if npx wrangler pages deploy dist --project-name=smartpos-web; then
            log_success "Frontend deployed successfully"
        else
            log_warning "Frontend deployment failed or not configured"
        fi
        
        cd ..
    else
        log_warning "Frontend directory not found, skipping frontend deployment"
    fi
}

# Test the deployment
test_deployment() {
    log_info "Testing deployment..."
    
    if [ -f "scripts/test-returns-system.js" ]; then
        log_info "Running returns system tests..."
        if node scripts/test-returns-system.js; then
            log_success "All tests passed!"
        else
            log_warning "Some tests failed. Check the output above for details."
        fi
    else
        log_warning "Test script not found, skipping tests"
    fi
}

# Initialize returns system
init_returns_system() {
    log_info "Initializing returns system..."
    
    if [ -f "scripts/init-returns-system.js" ]; then
        if node scripts/init-returns-system.js; then
            log_success "Returns system initialized successfully"
        else
            log_error "Returns system initialization failed"
            exit 1
        fi
    else
        log_warning "Returns system initialization script not found"
    fi
}

# Main deployment function
main() {
    log_info "🚀 Starting SmartPOS Returns System Deployment"
    log_info "=============================================="
    
    # Step 1: Check dependencies
    check_dependencies
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Initialize returns system
    init_returns_system
    
    # Step 4: Run migrations
    run_migrations
    
    # Step 5: Deploy backend
    deploy_backend
    
    # Step 6: Deploy frontend
    deploy_frontend
    
    # Step 7: Test deployment
    test_deployment
    
    log_success "🎉 SmartPOS Returns System Deployment Complete!"
    log_info "=============================================="
    log_info "📋 Next Steps:"
    log_info "1. Visit https://smartpos-web.pages.dev to test the frontend"
    log_info "2. Test the returns functionality in the web interface"
    log_info "3. Verify WebSocket real-time features are working"
    log_info "4. Monitor the application for any issues"
    log_info ""
    log_info "🔗 Useful URLs:"
    log_info "- Frontend: https://smartpos-web.pages.dev"
    log_info "- API: https://smartpos-api.bangachieu2.workers.dev"
    log_info "- API Health: https://smartpos-api.bangachieu2.workers.dev/health"
    log_info "- WebSocket Health: https://smartpos-api.bangachieu2.workers.dev/ws/health"
    log_info "- Returns API: https://smartpos-api.bangachieu2.workers.dev/api/v1/returns"
}

# Handle script arguments
case "${1:-}" in
    "backend-only")
        log_info "Deploying backend only..."
        check_dependencies
        install_dependencies
        run_migrations
        deploy_backend
        test_deployment
        ;;
    "frontend-only")
        log_info "Deploying frontend only..."
        check_dependencies
        install_dependencies
        deploy_frontend
        ;;
    "test-only")
        log_info "Running tests only..."
        test_deployment
        ;;
    "migrations-only")
        log_info "Running migrations only..."
        check_dependencies
        run_migrations
        ;;
    *)
        main
        ;;
esac
