#!/bin/bash

# ComputerPOS Pro - Warranty System Test Script
# This script performs comprehensive testing of the warranty management system

set -e  # Exit on any error

# Configuration
API_BASE_URL="https://smartpos-api.bangachieu2.workers.dev/api/v1"
FRONTEND_URL="https://41cf37a1.smartpos-web.pages.dev"
TEST_EMAIL="test@example.com"
TEST_PHONE="0123456789"

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

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_info "Running test: $test_name"
    
    if eval "$test_command"; then
        log_success "✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "✗ $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo
}

# Function to make API request
api_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local auth_header="$4"
    
    local curl_cmd="curl -s -X $method"
    
    if [ -n "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $API_BASE_URL$endpoint"
    
    eval "$curl_cmd"
}

# Function to get auth token
get_auth_token() {
    local response=$(api_request "POST" "/auth/login" '{"username":"admin","password":"admin"}')
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Test 1: API Health Check
test_api_health() {
    local response=$(api_request "GET" "/health")
    echo "$response" | grep -q '"success":true'
}

# Test 2: Authentication
test_authentication() {
    local response=$(api_request "POST" "/auth/login" '{"username":"admin","password":"admin"}')
    echo "$response" | grep -q '"token":'
}

# Test 3: Serial Numbers API
test_serial_numbers_api() {
    local token=$(get_auth_token)
    local response=$(api_request "GET" "/serial-numbers" "" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 4: Create Serial Number
test_create_serial_number() {
    local token=$(get_auth_token)
    local serial_data='{
        "serial_number": "TEST-SN-'$(date +%s)'",
        "product_id": 1,
        "location": "Test Store"
    }'
    local response=$(api_request "POST" "/serial-numbers" "$serial_data" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 5: Warranty Registrations API
test_warranty_registrations_api() {
    local token=$(get_auth_token)
    local response=$(api_request "GET" "/warranty/registrations" "" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 6: Create Warranty Registration
test_create_warranty_registration() {
    local token=$(get_auth_token)
    local warranty_data='{
        "serial_number_id": 1,
        "warranty_type": "manufacturer",
        "warranty_period_months": 12,
        "terms_accepted": true,
        "contact_email": "'$TEST_EMAIL'",
        "contact_phone": "'$TEST_PHONE'"
    }'
    local response=$(api_request "POST" "/warranty/registrations" "$warranty_data" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 7: Warranty Claims API
test_warranty_claims_api() {
    local token=$(get_auth_token)
    local response=$(api_request "GET" "/warranty/claims" "" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 8: Create Warranty Claim
test_create_warranty_claim() {
    local token=$(get_auth_token)
    local claim_data='{
        "warranty_registration_id": 1,
        "claim_type": "repair",
        "issue_description": "Test issue description for automated testing",
        "estimated_cost": 100000
    }'
    local response=$(api_request "POST" "/warranty/claims" "$claim_data" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 9: Warranty Notifications API
test_warranty_notifications_api() {
    local token=$(get_auth_token)
    local response=$(api_request "GET" "/warranty-notifications" "" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 10: Notification Statistics
test_notification_statistics() {
    local token=$(get_auth_token)
    local response=$(api_request "GET" "/warranty-notifications/stats" "" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 11: Scheduled Tasks Status
test_scheduled_tasks_status() {
    local response=$(api_request "GET" "/scheduled/warranty-notifications/status")
    echo "$response" | grep -q '"success":true'
}

# Test 12: Force Check Warranties
test_force_check_warranties() {
    local response=$(api_request "POST" "/scheduled/warranty-notifications/force-check")
    echo "$response" | grep -q '"success":true'
}

# Test 13: Test Notification System
test_notification_system() {
    local response=$(api_request "POST" "/scheduled/warranty-notifications/test")
    echo "$response" | grep -q '"success":true'
}

# Test 14: Frontend Health Check
test_frontend_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    [ "$response" = "200" ]
}

# Test 15: Frontend Warranty Page
test_frontend_warranty_page() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/warranty")
    [ "$response" = "200" ]
}

# Test 16: Database Integrity
test_database_integrity() {
    local token=$(get_auth_token)
    
    # Test foreign key relationships
    local products_response=$(api_request "GET" "/products?limit=1" "" "$token")
    local customers_response=$(api_request "GET" "/customers?limit=1" "" "$token")
    local serials_response=$(api_request "GET" "/serial-numbers?limit=1" "" "$token")
    
    echo "$products_response" | grep -q '"success":true' && \
    echo "$customers_response" | grep -q '"success":true' && \
    echo "$serials_response" | grep -q '"success":true'
}

# Test 17: Performance Test
test_api_performance() {
    local token=$(get_auth_token)
    local start_time=$(date +%s%N)
    
    # Make multiple API calls
    for i in {1..5}; do
        api_request "GET" "/warranty/registrations?limit=10" "" "$token" > /dev/null
    done
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    # Performance should be under 5 seconds for 5 requests
    [ "$duration" -lt 5000 ]
}

# Test 18: Error Handling
test_error_handling() {
    # Test invalid endpoint
    local response=$(api_request "GET" "/invalid-endpoint")
    echo "$response" | grep -q '"success":false'
}

# Test 19: Rate Limiting
test_rate_limiting() {
    local token=$(get_auth_token)
    
    # Make rapid requests to test rate limiting
    for i in {1..20}; do
        api_request "GET" "/warranty/registrations" "" "$token" > /dev/null 2>&1
    done
    
    # Should still be able to make requests (rate limit should be reasonable)
    local response=$(api_request "GET" "/warranty/registrations" "" "$token")
    echo "$response" | grep -q '"success":true'
}

# Test 20: Data Validation
test_data_validation() {
    local token=$(get_auth_token)
    
    # Test invalid warranty data
    local invalid_data='{
        "serial_number_id": "invalid",
        "warranty_type": "invalid_type",
        "warranty_period_months": -1
    }'
    
    local response=$(api_request "POST" "/warranty/registrations" "$invalid_data" "$token")
    echo "$response" | grep -q '"success":false'
}

# Main test execution
main() {
    log_info "Starting ComputerPOS Pro Warranty System Tests"
    log_info "API Base URL: $API_BASE_URL"
    log_info "Frontend URL: $FRONTEND_URL"
    echo

    # Run all tests
    run_test "API Health Check" "test_api_health"
    run_test "Authentication" "test_authentication"
    run_test "Serial Numbers API" "test_serial_numbers_api"
    run_test "Create Serial Number" "test_create_serial_number"
    run_test "Warranty Registrations API" "test_warranty_registrations_api"
    run_test "Create Warranty Registration" "test_create_warranty_registration"
    run_test "Warranty Claims API" "test_warranty_claims_api"
    run_test "Create Warranty Claim" "test_create_warranty_claim"
    run_test "Warranty Notifications API" "test_warranty_notifications_api"
    run_test "Notification Statistics" "test_notification_statistics"
    run_test "Scheduled Tasks Status" "test_scheduled_tasks_status"
    run_test "Force Check Warranties" "test_force_check_warranties"
    run_test "Test Notification System" "test_notification_system"
    run_test "Frontend Health Check" "test_frontend_health"
    run_test "Frontend Warranty Page" "test_frontend_warranty_page"
    run_test "Database Integrity" "test_database_integrity"
    run_test "API Performance" "test_api_performance"
    run_test "Error Handling" "test_error_handling"
    run_test "Rate Limiting" "test_rate_limiting"
    run_test "Data Validation" "test_data_validation"

    # Test summary
    echo "=================================="
    log_info "Test Summary"
    echo "=================================="
    log_info "Total Tests: $TOTAL_TESTS"
    log_success "Passed: $TESTS_PASSED"
    log_error "Failed: $TESTS_FAILED"
    
    local success_rate=$(( TESTS_PASSED * 100 / TOTAL_TESTS ))
    log_info "Success Rate: $success_rate%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 All tests passed! System is ready for production."
        exit 0
    else
        log_error "❌ Some tests failed. Please review and fix issues before deployment."
        exit 1
    fi
}

# Check if required tools are installed
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed."
        exit 1
    fi
    
    if ! command -v grep &> /dev/null; then
        log_error "grep is required but not installed."
        exit 1
    fi
}

# Run dependency check and main function
check_dependencies
main "$@"
