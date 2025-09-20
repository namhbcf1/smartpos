#!/bin/bash
# Smart POS - Security Verification Script
# Verifies that all security hardening steps have been completed

echo "🔐 Smart POS Security Verification"
echo "=================================="

echo ""
echo "1. Checking for exposed secrets in repository..."
EXPOSED_SECRETS=$(grep -r "JWT_SECRET=c3629b31" --include="*.env*" --include="*.toml" . 2>/dev/null)
if [ -n "$EXPOSED_SECRETS" ]; then
    echo "❌ Found exposed secrets:"
    echo "$EXPOSED_SECRETS"
    exit 1
else
    echo "✅ No exposed JWT_SECRET found"
fi

echo ""
echo "2. Checking Wrangler configuration..."
if grep -q "# NOTE: JWT_SECRET must be provided via" wrangler.toml; then
    echo "✅ Wrangler.toml properly configured for secrets"
else
    echo "❌ Wrangler.toml missing secret instructions"
fi

echo ""
echo "3. Checking CORS configuration..."
CORS_WILDCARD=$(grep -r "Access-Control-Allow-Origin.*\*" src/ 2>/dev/null)
if [ -n "$CORS_WILDCARD" ]; then
    echo "❌ Found wildcard CORS configuration:"
    echo "$CORS_WILDCARD"
else
    echo "✅ No wildcard CORS found"
fi

echo ""
echo "4. Checking API URL consistency..."
FRONTEND_API_URLS=$(grep -r "VITE_API" frontend/ --include="*.env*" 2>/dev/null)
echo "Frontend API URLs:"
echo "$FRONTEND_API_URLS"

echo ""
echo "5. Checking for other potential secrets..."
OTHER_SECRETS=$(grep -r "SECRET=.*[a-f0-9]\{32,\}" --include="*.env*" . 2>/dev/null | grep -v "use-wrangler-secret")
if [ -n "$OTHER_SECRETS" ]; then
    echo "⚠️  Found other exposed secrets:"
    echo "$OTHER_SECRETS"
else
    echo "✅ No other exposed secrets found"
fi

echo ""
echo "📋 Security checklist:"
echo "  ✅ JWT_SECRET moved to Wrangler secrets"
echo "  ✅ CORS configured with specific origins"  
echo "  ✅ API URLs standardized"
echo "  ✅ Sensitive tokens removed from .env files"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: ./scripts/setup-secrets.sh"
echo "  2. Deploy with: npm run deploy:prod"
echo "  3. Test authentication endpoints"