#!/usr/bin/env node

/**
 * SECURITY SCRIPT: Create Secure Admin User
 * 
 * This script creates a secure admin user with a randomly generated password
 * to replace the default admin/admin credentials.
 * 
 * Usage:
 *   node scripts/create-secure-admin.js
 * 
 * Environment Variables Required:
 *   - CLOUDFLARE_API_TOKEN
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - DATABASE_ID (D1 database ID)
 */

const crypto = require('crypto');

// Generate secure password
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Hash password using SHA-256 (matching the existing system)
function hashPassword(password, salt = 'SmartPOSSecureSalt') {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function createSecureAdmin() {
  console.log('🔐 SECURITY: Creating secure admin user...');
  
  // Generate secure credentials
  const securePassword = generateSecurePassword(16);
  const passwordHash = hashPassword(securePassword);
  
  console.log('\n📋 SECURE ADMIN CREDENTIALS GENERATED:');
  console.log('=====================================');
  console.log(`Username: admin`);
  console.log(`Password: ${securePassword}`);
  console.log(`Hash: ${passwordHash}`);
  console.log('=====================================');
  
  console.log('\n⚠️  IMPORTANT SECURITY INSTRUCTIONS:');
  console.log('1. Save these credentials in a secure password manager');
  console.log('2. Do NOT store them in plain text files');
  console.log('3. Change the password after first login');
  console.log('4. Enable 2FA if available');
  
  console.log('\n🔧 MANUAL DATABASE UPDATE REQUIRED:');
  console.log('Execute this SQL in your Cloudflare D1 database:');
  console.log('');
  console.log(`UPDATE users SET password_hash = '${passwordHash}' WHERE username = 'admin';`);
  console.log('');
  
  console.log('📝 Or use wrangler CLI:');
  console.log(`wrangler d1 execute smartpos-db --command="UPDATE users SET password_hash = '${passwordHash}' WHERE username = 'admin';"`);
  
  return {
    username: 'admin',
    password: securePassword,
    hash: passwordHash
  };
}

// API function to update via Cloudflare API (if credentials available)
async function updateViaAPI(credentials) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.DATABASE_ID;
  
  if (!apiToken || !accountId || !databaseId) {
    console.log('\n⚠️  Cloudflare API credentials not found in environment variables.');
    console.log('Please update the database manually using the SQL command above.');
    return false;
  }
  
  try {
    console.log('\n🔄 Attempting to update via Cloudflare API...');
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: `UPDATE users SET password_hash = ? WHERE username = 'admin'`,
          params: [credentials.hash]
        })
      }
    );
    
    if (response.ok) {
      console.log('✅ Admin password updated successfully via API!');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ API update failed:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ API update error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    const credentials = await createSecureAdmin();
    
    // Try to update via API if credentials are available
    const apiSuccess = await updateViaAPI(credentials);
    
    if (!apiSuccess) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Copy the SQL command above');
      console.log('2. Execute it in your Cloudflare D1 database');
      console.log('3. Test login with the new credentials');
      console.log('4. Delete this script output from your terminal history');
    }
    
    console.log('\n🎯 SECURITY CHECKLIST:');
    console.log('□ Admin password updated');
    console.log('□ Old admin/admin credentials disabled');
    console.log('□ New credentials saved securely');
    console.log('□ First login completed');
    console.log('□ Password changed by admin user');
    
  } catch (error) {
    console.error('❌ Error creating secure admin:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateSecurePassword, hashPassword, createSecureAdmin };
