// Global Teardown for ComputerPOS Pro Tests
// Vietnamese Computer Hardware POS System Test Cleanup

import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://a66f347c.pos-frontend-bangachieu2.pages.dev';
  
  console.log('🧹 Cleaning up ComputerPOS Pro test environment...');
  console.log('🌐 Target URL:', baseURL);
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto(baseURL, { timeout: 30000 });
    
    // Clean up test data via admin endpoints
    console.log('🗑️ Cleaning up Vietnamese test data...');
    
    // Clean up test sales
    try {
      const salesCleanupResponse = await page.request.post(`${baseURL}/admin/seed/cleanup/sales`);
      if (salesCleanupResponse.ok()) {
        console.log('✅ Test sales cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Sales cleanup skipped (endpoint may not exist)');
    }
    
    // Clean up test customers
    try {
      const customersCleanupResponse = await page.request.post(`${baseURL}/admin/seed/cleanup/customers`);
      if (customersCleanupResponse.ok()) {
        console.log('✅ Test customers cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Customers cleanup skipped (endpoint may not exist)');
    }
    
    // Clean up test products
    try {
      const productsCleanupResponse = await page.request.post(`${baseURL}/admin/seed/cleanup/products`);
      if (productsCleanupResponse.ok()) {
        console.log('✅ Test products cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Products cleanup skipped (endpoint may not exist)');
    }
    
    // Clean up test categories and brands
    try {
      const categoriesCleanupResponse = await page.request.post(`${baseURL}/admin/seed/cleanup/categories`);
      if (categoriesCleanupResponse.ok()) {
        console.log('✅ Test categories cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Categories cleanup skipped (endpoint may not exist)');
    }
    
    try {
      const brandsCleanupResponse = await page.request.post(`${baseURL}/admin/seed/cleanup/brands`);
      if (brandsCleanupResponse.ok()) {
        console.log('✅ Test brands cleaned up');
      }
    } catch (error) {
      console.log('⚠️ Brands cleanup skipped (endpoint may not exist)');
    }
    
    // General cleanup endpoint
    try {
      const generalCleanupResponse = await page.request.post(`${baseURL}/admin/seed/cleanup`);
      if (generalCleanupResponse.ok()) {
        console.log('✅ General test data cleanup completed');
      }
    } catch (error) {
      console.log('⚠️ General cleanup skipped (endpoint may not exist)');
    }
    
    console.log('🎯 Test environment cleanup completed');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
