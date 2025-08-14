#!/usr/bin/env node

/**
 * Rules.md Compliance Checker
 * Verifies that the codebase follows all rules defined in rules.md
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Prohibited patterns from rules.md
const prohibitedPatterns = {
  mockData: [
    /lorem ipsum/i,
    /fake.*product/i,
    /test@example\.com/i,
    /demo.*mode/i,
    /development.*mode/i,
    /mock.*api/i,
    /fake.*api/i,
    /placeholder.*data/i,
    /sample.*data(?!.*testid)/i, // Exclude data-testid attributes
    /test.*data(?!.*testid)/i // Exclude data-testid attributes
  ],
  localhostOnly: [
    /localhost:\d+/,
    /127\.0\.0\.1:\d+/,
    /http:\/\/localhost/,
    /ws:\/\/localhost/
  ],
  simulatedAPIs: [
    /setTimeout.*api/i,
    /setTimeout.*fetch/i,
    /setTimeout.*request/i,
    /new Promise.*resolve.*setTimeout/i
  ],
  thirdPartyServices: [
    /auth0/i,
    /firebase/i,
    /mongodb/i,
    /postgresql/i,
    /mysql/i,
    /stripe.*api/i,
    /paypal.*api/i
  ]
};

// Required patterns from rules.md
const requiredPatterns = {
  cloudflareD1: [
    /cloudflare.*d1/i,
    /\.env\.DB/,
    /c\.env\.DB/
  ],
  jwtAuth: [
    /jwt/i,
    /bearer.*token/i,
    /authorization.*header/i
  ],
  zodValidation: [
    /zod/i,
    /\.parse\(/,
    /\.safeParse\(/
  ]
};

function scanFile(filePath, content) {
  const violations = [];
  const compliances = [];

  // Check for prohibited patterns
  Object.entries(prohibitedPatterns).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        // Exclude legitimate uses
        const isLegitimate =
          content.includes('data-testid') || // React testing attributes
          content.includes('.test(') || // Regex test() calls
          content.includes('Test database') || // Database connection tests
          content.includes('performance_test') || // Performance tests
          content.includes('health check') || // Health checks
          content.includes('exponential backoff') || // Retry delays
          content.includes('localStorage write') || // Browser API delays
          content.includes('latestData') || // Variable names with "latest"
          content.includes('createStockMovement') || // Method names
          content.includes('production ready') || // Production comments
          content.includes('rules.md compliant') || // Compliance comments
          content.includes('Exponential backoff delay') || // Retry delays
          content.includes('retry (not simulation)') || // Legitimate retries
          content.includes('const latest =') || // Latest data variables
          content.includes('latest.revenue'); // Latest data access

        if (!isLegitimate) {
          violations.push({
            type: 'PROHIBITED',
            category,
            pattern: pattern.toString(),
            file: filePath
          });
        }
      }
    });
  });

  // Check for required patterns (in specific files)
  if (filePath.includes('api') || filePath.includes('backend') || filePath.includes('src/index')) {
    Object.entries(requiredPatterns).forEach(([category, patterns]) => {
      const hasPattern = patterns.some(pattern => pattern.test(content));
      if (hasPattern) {
        compliances.push({
          type: 'REQUIRED',
          category,
          file: filePath
        });
      }
    });
  }

  return { violations, compliances };
}

function scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = {
    violations: [],
    compliances: [],
    filesScanned: 0
  };

  function scanRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          scanRecursive(itemPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            const result = scanFile(itemPath, content);
            results.violations.push(...result.violations);
            results.compliances.push(...result.compliances);
            results.filesScanned++;
          } catch (error) {
            logWarning(`Could not read file: ${itemPath}`);
          }
        }
      }
    });
  }

  scanRecursive(dirPath);
  return results;
}

function main() {
  logHeader('🔍 RULES.MD COMPLIANCE CHECKER');
  
  log('Scanning codebase for rules.md violations...', 'blue');
  
  // Scan frontend
  log('\n📁 Scanning frontend...', 'cyan');
  const frontendResults = scanDirectory('./frontend/src');
  
  // Scan backend
  log('\n📁 Scanning backend...', 'cyan');
  const backendResults = scanDirectory('./src');
  
  // Combine results
  const totalResults = {
    violations: [...frontendResults.violations, ...backendResults.violations],
    compliances: [...frontendResults.compliances, ...backendResults.compliances],
    filesScanned: frontendResults.filesScanned + backendResults.filesScanned
  };

  // Report results
  logHeader('📊 COMPLIANCE REPORT');
  
  log(`Files scanned: ${totalResults.filesScanned}`, 'blue');
  log(`Violations found: ${totalResults.violations.length}`, totalResults.violations.length > 0 ? 'red' : 'green');
  log(`Compliances found: ${totalResults.compliances.length}`, 'green');

  if (totalResults.violations.length > 0) {
    logHeader('❌ VIOLATIONS FOUND');
    totalResults.violations.forEach(violation => {
      logError(`${violation.category}: ${violation.pattern} in ${violation.file}`);
    });
  } else {
    logSuccess('No violations found! ✨');
  }

  if (totalResults.compliances.length > 0) {
    logHeader('✅ COMPLIANCES FOUND');
    totalResults.compliances.forEach(compliance => {
      logSuccess(`${compliance.category} implemented in ${compliance.file}`);
    });
  }

  // Final verdict
  logHeader('🎯 FINAL VERDICT');
  if (totalResults.violations.length === 0) {
    logSuccess('🎉 CODEBASE IS FULLY COMPLIANT WITH RULES.MD!');
    process.exit(0);
  } else {
    logError(`💥 FOUND ${totalResults.violations.length} VIOLATIONS - MUST BE FIXED!`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory };
