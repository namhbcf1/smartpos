#!/usr/bin/env node

/**
 * Playwright Configuration Fix Script for SmartPOS
 * 
 * This script fixes the duplicate Playwright installations
 * and standardizes the test configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 SmartPOS Playwright Configuration Fix');
console.log('=======================================\n');

// Configuration
const ROOT_DIR = '.';
const E2E_DIR = 'tests/e2e';
const BACKUP_DIR = 'backups/playwright';

// Utility functions
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function backupFile(filePath, backupName) {
  if (!checkFile(filePath)) {
    return false;
  }
  
  const backupPath = path.join(BACKUP_DIR, backupName);
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backed up: ${filePath} → ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to backup ${filePath}:`, error.message);
    return false;
  }
}

function analyzePlaywrightSetup() {
  console.log('🔍 Analyzing Playwright setup...\n');
  
  const analysis = {
    rootConfig: checkFile('playwright.config.ts'),
    rootPackageJson: checkFile('package.json'),
    e2eDir: checkFile(E2E_DIR),
    e2eConfig: checkFile(path.join(E2E_DIR, 'playwright.config.ts')),
    e2ePackageJson: checkFile(path.join(E2E_DIR, 'package.json')),
    e2eNodeModules: checkFile(path.join(E2E_DIR, 'node_modules'))
  };
  
  console.log('📋 Current Setup:');
  console.log(`   Root playwright.config.ts: ${analysis.rootConfig ? '✅' : '❌'}`);
  console.log(`   Root package.json: ${analysis.rootPackageJson ? '✅' : '❌'}`);
  console.log(`   E2E directory: ${analysis.e2eDir ? '✅' : '❌'}`);
  console.log(`   E2E playwright.config.ts: ${analysis.e2eConfig ? '✅' : '❌'}`);
  console.log(`   E2E package.json: ${analysis.e2ePackageJson ? '✅' : '❌'}`);
  console.log(`   E2E node_modules: ${analysis.e2eNodeModules ? '✅' : '❌'}`);
  
  return analysis;
}

function createStandardizedConfig() {
  console.log('\n📝 Creating standardized Playwright configuration...');
  
  const config = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'https://smartpos-web.pages.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  outputDir: 'test-results/',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});`;

  try {
    fs.writeFileSync('playwright.config.ts', config);
    console.log('✅ Created standardized playwright.config.ts');
    return true;
  } catch (error) {
    console.error('❌ Failed to create config:', error.message);
    return false;
  }
}

function updatePackageJson() {
  console.log('\n📦 Updating package.json...');
  
  try {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add/update test scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['test:e2e'] = 'playwright test';
    packageJson.scripts['test:e2e:ui'] = 'playwright test --ui';
    packageJson.scripts['test:e2e:headed'] = 'playwright test --headed';
    packageJson.scripts['test:e2e:debug'] = 'playwright test --debug';
    packageJson.scripts['test:e2e:report'] = 'playwright show-report';
    
    // Ensure playwright is in devDependencies
    packageJson.devDependencies = packageJson.devDependencies || {};
    if (!packageJson.devDependencies['@playwright/test']) {
      packageJson.devDependencies['@playwright/test'] = '^1.54.2';
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with test scripts');
    return true;
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
    return false;
  }
}

function cleanupE2EDirectory() {
  console.log('\n🧹 Cleaning up E2E directory...');
  
  const filesToRemove = [
    path.join(E2E_DIR, 'package.json'),
    path.join(E2E_DIR, 'package-lock.json'),
    path.join(E2E_DIR, 'playwright.config.ts')
  ];
  
  filesToRemove.forEach(file => {
    if (checkFile(file)) {
      try {
        const backupName = path.basename(file) + '-removed';
        backupFile(file, backupName);
        fs.unlinkSync(file);
        console.log(`🗑️ Removed: ${file}`);
      } catch (error) {
        console.warn(`⚠️ Could not remove ${file}:`, error.message);
      }
    }
  });
  
  // Remove node_modules directory
  const nodeModulesPath = path.join(E2E_DIR, 'node_modules');
  if (checkFile(nodeModulesPath)) {
    try {
      execSync(`rm -rf "${nodeModulesPath}"`, { stdio: 'inherit' });
      console.log(`🗑️ Removed: ${nodeModulesPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not remove ${nodeModulesPath}:`, error.message);
    }
  }
}

function installPlaywright() {
  console.log('\n📥 Installing Playwright...');
  
  try {
    console.log('Installing @playwright/test...');
    execSync('npm install --save-dev @playwright/test@^1.54.2', { stdio: 'inherit' });
    
    console.log('Installing Playwright browsers...');
    execSync('npx playwright install', { stdio: 'inherit' });
    
    console.log('✅ Playwright installation completed');
    return true;
  } catch (error) {
    console.error('❌ Playwright installation failed:', error.message);
    return false;
  }
}

function createTestHelpers() {
  console.log('\n🛠️ Creating test helpers...');
  
  const helpersDir = path.join(E2E_DIR, 'utils');
  if (!checkFile(helpersDir)) {
    fs.mkdirSync(helpersDir, { recursive: true });
  }
  
  const testHelpers = `/**
 * Test Helpers for SmartPOS E2E Tests
 */

import { Page, expect } from '@playwright/test';

export class SmartPOSTestHelpers {
  constructor(private page: Page) {}

  async login(username: string = 'admin', password: string = 'admin') {
    await this.page.goto('/login');
    await this.page.fill('[name="username"]', username);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login
    await expect(this.page).toHaveURL(/dashboard/);
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await expect(this.page).toHaveURL(/login/);
  }

  async navigateTo(section: string) {
    await this.page.click(\`[data-testid="nav-\${section}"]\`);
  }

  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(response => 
      typeof urlPattern === 'string' 
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())
    );
  }

  async checkApiHealth() {
    const response = await this.page.request.get('/api/v1/health');
    expect(response.status()).toBe(200);
  }
}

export const TEST_CONFIG = {
  baseURL: process.env.BASE_URL || 'https://smartpos-web.pages.dev',
  apiURL: process.env.API_URL || 'https://smartpos-api.bangachieu2.workers.dev',
  timeout: 30000,
  retries: 2
};`;

  try {
    fs.writeFileSync(path.join(helpersDir, 'test-helpers.ts'), testHelpers);
    console.log('✅ Created test helpers');
    return true;
  } catch (error) {
    console.error('❌ Failed to create test helpers:', error.message);
    return false;
  }
}

function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    // Check if playwright command works
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright CLI is working');
    
    // Check config syntax
    execSync('npx playwright test --list', { stdio: 'pipe' });
    console.log('✅ Playwright configuration is valid');
    
    return true;
  } catch (error) {
    console.error('❌ Setup verification failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Playwright configuration fix...\n');
    
    // Step 1: Create backup directory
    createBackupDir();
    
    // Step 2: Analyze current setup
    const analysis = analyzePlaywrightSetup();
    
    // Step 3: Backup existing configs
    console.log('\n💾 Backing up existing configurations...');
    backupFile('playwright.config.ts', 'playwright.config.ts-backup');
    backupFile(path.join(E2E_DIR, 'playwright.config.ts'), 'e2e-playwright.config.ts-backup');
    backupFile(path.join(E2E_DIR, 'package.json'), 'e2e-package.json-backup');
    
    // Step 4: Create standardized configuration
    if (!createStandardizedConfig()) {
      throw new Error('Failed to create standardized config');
    }
    
    // Step 5: Update package.json
    if (!updatePackageJson()) {
      throw new Error('Failed to update package.json');
    }
    
    // Step 6: Clean up E2E directory
    cleanupE2EDirectory();
    
    // Step 7: Install Playwright
    if (!installPlaywright()) {
      throw new Error('Failed to install Playwright');
    }
    
    // Step 8: Create test helpers
    createTestHelpers();
    
    // Step 9: Verify setup
    if (!verifySetup()) {
      console.warn('⚠️ Setup verification failed, but configuration was created');
    }
    
    console.log('\n🎉 Playwright configuration fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run tests: npm run test:e2e');
    console.log('2. View test UI: npm run test:e2e:ui');
    console.log('3. Debug tests: npm run test:e2e:debug');
    console.log('4. View reports: npm run test:e2e:report');
    
  } catch (error) {
    console.error('❌ Configuration fix failed:', error.message);
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});

// Run the script
main().catch(console.error);
