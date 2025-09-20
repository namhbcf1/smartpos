#!/bin/bash
# Smart POS - Wrangler Secrets Setup Script
# Run this script to set up all required secrets for production deployment

echo "🔐 Setting up Wrangler secrets for Smart POS..."
echo "⚠️  IMPORTANT: Have your secret values ready before running this script"
echo ""

# Function to set secret with confirmation
set_secret() {
    local secret_name=$1
    local description=$2
    local env_flag=$3
    
    echo "📝 Setting $secret_name ($description)"
    echo "   Enter the value for $secret_name:"
    read -s secret_value
    
    if [ -n "$secret_value" ]; then
        if [ -n "$env_flag" ]; then
            wrangler secret put "$secret_name" --env "$env_flag" <<< "$secret_value"
        else
            wrangler secret put "$secret_name" <<< "$secret_value"
        fi
        echo "✅ $secret_name set successfully"
    else
        echo "❌ Skipping $secret_name (no value provided)"
    fi
    echo ""
}

echo "🚀 Setting up PRODUCTION environment secrets..."
echo "================================================"

# Critical authentication secrets
set_secret "JWT_SECRET" "JWT signing secret (min 32 chars)" "production"

# Optional secrets (only if using these features)
echo "📦 Optional secrets (skip if not using these features):"

set_secret "CLOUDFLARE_API_TOKEN" "Cloudflare API token for deployments" "production"
set_secret "CLOUDFLARE_R2_ACCESS_KEY_ID" "R2 storage access key" "production"
set_secret "CLOUDFLARE_R2_SECRET_ACCESS_KEY" "R2 storage secret key" "production"

# Payment gateways
set_secret "STRIPE_SECRET_KEY" "Stripe secret key" "production"
set_secret "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret" "production"
set_secret "PAYPAL_CLIENT_SECRET" "PayPal client secret" "production"

echo "🔍 Listing all configured secrets:"
wrangler secret list --env production

echo ""
echo "✨ Secrets setup complete!"
echo "📋 Next steps:"
echo "   1. Deploy your worker: npm run deploy:prod"
echo "   2. Test authentication endpoints"
echo "   3. Verify all features work correctly"
echo ""
echo "🔒 Security reminder:"
echo "   - Never commit secrets to version control"
echo "   - Use different secrets for staging and production"
echo "   - Rotate secrets regularly"