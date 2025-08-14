#!/usr/bin/env node

/**
 * JWT_SECRET Setup Script for SmartPOS
 * 
 * This script helps set up JWT_SECRET for Cloudflare Workers
 * and verifies the authentication configuration.
 */

const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🔐 SmartPOS JWT_SECRET Setup Script');
console.log('=====================================\n');

// Generate a strong JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Check if wrangler is installed
function checkWrangler() {
  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Set JWT_SECRET in Cloudflare Workers
function setJWTSecret(secret) {
  try {
    console.log('📤 Setting JWT_SECRET in Cloudflare Workers...');
    
    // Set the secret using wrangler
    execSync(`echo "${secret}" | wrangler secret put JWT_SECRET`, { 
      stdio: ['pipe', 'inherit', 'inherit'],
      input: secret 
    });
    
    console.log('✅ JWT_SECRET has been set successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to set JWT_SECRET:', error.message);
    return false;
  }
}

// Verify JWT_SECRET is set
function verifyJWTSecret() {
  try {
    console.log('🔍 Verifying JWT_SECRET configuration...');
    
    const result = execSync('wrangler secret list', { encoding: 'utf8' });
    
    if (result.includes('JWT_SECRET')) {
      console.log('✅ JWT_SECRET is configured in Cloudflare Workers');
      return true;
    } else {
      console.log('❌ JWT_SECRET not found in Cloudflare Workers');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to verify JWT_SECRET:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Check prerequisites
  if (!checkWrangler()) {
    console.error('❌ Wrangler CLI is not installed or not in PATH');
    console.log('📥 Install wrangler: npm install -g wrangler');
    process.exit(1);
  }

  console.log('✅ Wrangler CLI is available');

  // Check if JWT_SECRET already exists
  if (verifyJWTSecret()) {
    console.log('🎯 JWT_SECRET is already configured!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy your worker: wrangler deploy');
    console.log('2. Test authentication endpoints');
    return;
  }

  // Generate new JWT secret
  const jwtSecret = generateJWTSecret();
  console.log('🔑 Generated strong JWT secret (128 characters)');
  
  // Set the secret
  if (setJWTSecret(jwtSecret)) {
    console.log('\n🎉 JWT_SECRET setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy your worker: wrangler deploy');
    console.log('2. Test authentication: curl https://your-worker.workers.dev/api/v1/auth/login');
    console.log('3. Verify frontend can authenticate users');
  } else {
    console.log('\n❌ JWT_SECRET setup failed');
    console.log('\n🔧 Manual setup:');
    console.log('1. Run: wrangler secret put JWT_SECRET');
    console.log(`2. Enter this secret: ${jwtSecret}`);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run the script
main().catch(console.error);
