import { FullConfig } from '@playwright/test';
import fs from 'fs';

/**
 * Global teardown for production testing
 * Cleanup and final reporting
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Production Testing Global Teardown...');

  try {
    // Clean up auth state file if it exists
    const authStatePath = 'production-test-results/auth-state.json';
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('🗑️  Cleaned up authentication state');
    }

    console.log('📊 Production testing completed');
    console.log('📋 Check test reports in production-test-results/html-report/');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }

  console.log('✅ Global teardown completed');
}

export default globalTeardown;