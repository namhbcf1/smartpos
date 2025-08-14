import { test, expect } from '@playwright/test';

const APP_URL = 'https://0892c9dc.smartpos-web.pages.dev';
const API_URL = 'https://smartpos-api.bangachieu2.workers.dev';

test.beforeEach(async ({ page }) => {
  // Set up like a real user
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
});

  test('1. 🔍 Warranty Page Access & Initial Load', async ({ page }) => {
    console.log('🔍 Testing warranty page access...');
    
    // Navigate to warranty page like a real user would
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Real user wait time
    
    // Check page title and URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('/warranty');
    
    // Verify page loads without errors
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    expect(pageTitle).toContain('SmartPOS');
    
    // Check for any error messages
    const errorMessages = await page.locator('text*="error"').count();
    const notFoundMessages = await page.locator('text*="404"').count();
    expect(errorMessages + notFoundMessages).toBe(0);
    
    console.log('✅ Warranty page accessed successfully');
  });

  test('2. 📋 Warranty Interface Elements Check', async ({ page }) => {
    console.log('📋 Testing warranty interface elements...');
    
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Check for main heading
    const mainHeading = page.locator('h1, h2, h3').filter({ hasText: /bảo hành|warranty/i });
    const headingCount = await mainHeading.count();
    if (headingCount > 0) {
      const headingText = await mainHeading.first().textContent();
      console.log(`📝 Main heading found: "${headingText}"`);
    } else {
      console.log('⚠️ No warranty heading found');
    }
    
    // Check for navigation elements
    const navElements = await page.locator('nav').count();
    expect(navElements).toBeGreaterThan(0);
    console.log(`🧭 Navigation elements: ${navElements}`);
    
    // Check for warranty-specific elements
    const warrantyElements = [
      'text*="bảo hành"',
      'text*="warranty"', 
      'text*="serial"',
      'text*="sản phẩm"',
      'text*="khách hàng"'
    ];
    
    for (const selector of warrantyElements) {
      const count = await page.locator(selector).count();
      console.log(`🔍 "${selector}": ${count} elements found`);
    }
    
    console.log('✅ Interface elements checked');
  });

  test('3. 🎯 Warranty Form Interaction Test', async ({ page }) => {
    console.log('🎯 Testing warranty form interactions...');
    
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for form elements
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    const selects = await page.locator('select').count();
    
    console.log(`📝 Forms found: ${forms}`);
    console.log(`📝 Input fields: ${inputs}`);
    console.log(`🔘 Buttons: ${buttons}`);
    console.log(`📋 Select dropdowns: ${selects}`);
    
    // Try to interact with input fields if they exist
    if (inputs > 0) {
      const firstInput = page.locator('input').first();
      const inputType = await firstInput.getAttribute('type');
      const inputPlaceholder = await firstInput.getAttribute('placeholder');
      
      console.log(`📝 First input type: ${inputType}`);
      console.log(`📝 First input placeholder: ${inputPlaceholder}`);
      
      // Try typing in the input like a real user
      if (inputType !== 'file' && inputType !== 'hidden') {
        await firstInput.click();
        await page.waitForTimeout(500);
        await firstInput.fill('TEST123456');
        await page.waitForTimeout(500);
        
        const inputValue = await firstInput.inputValue();
        console.log(`📝 Input value after typing: ${inputValue}`);
      }
    }
    
    // Try clicking buttons if they exist
    if (buttons > 0) {
      const clickableButtons = page.locator('button').filter({ hasNotText: /disabled/i });
      const clickableCount = await clickableButtons.count();
      
      if (clickableCount > 0) {
        const firstButton = clickableButtons.first();
        const buttonText = await firstButton.textContent();
        console.log(`🔘 First clickable button: "${buttonText}"`);
        
        // Click the button like a real user
        await firstButton.click();
        await page.waitForTimeout(1000);
        console.log('🔘 Button clicked successfully');
      }
    }
    
    console.log('✅ Form interactions tested');
  });

  test('4. 📊 Warranty Data Display Test', async ({ page }) => {
    console.log('📊 Testing warranty data display...');
    
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for data tables or lists
    const tables = await page.locator('table').count();
    const lists = await page.locator('ul, ol').count();
    const cards = await page.locator('[class*="card"], [class*="item"]').count();
    
    console.log(`📊 Tables found: ${tables}`);
    console.log(`📋 Lists found: ${lists}`);
    console.log(`🃏 Cards/Items found: ${cards}`);
    
    // Check for warranty-specific data
    const serialNumbers = await page.locator('text*="SN"').count();
    const dates = await page.locator('text*="2024"').count() + await page.locator('text*="2025"').count();
    const statuses = await page.locator('text*="active", text*="expired", text*="valid"').count();
    
    console.log(`🔢 Serial number references: ${serialNumbers}`);
    console.log(`📅 Date references: ${dates}`);
    console.log(`📊 Status indicators: ${statuses}`);
    
    // Check for loading states
    const loadingElements = await page.locator('text*="loading", text*="đang tải"').count();
    const emptyStates = await page.locator('text*="empty", text*="trống", text*="không có"').count();
    
    console.log(`⏳ Loading indicators: ${loadingElements}`);
    console.log(`📭 Empty state messages: ${emptyStates}`);
    
    console.log('✅ Data display tested');
  });

  test('5. 🔄 Warranty Actions & Workflows', async ({ page }) => {
    console.log('🔄 Testing warranty actions and workflows...');
    
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for action buttons
    const actionButtons = [
      'text*="thêm"',
      'text*="tạo"', 
      'text*="sửa"',
      'text*="xóa"',
      'text*="xem"',
      'text*="add"',
      'text*="create"',
      'text*="edit"',
      'text*="delete"',
      'text*="view"'
    ];
    
    for (const buttonSelector of actionButtons) {
      const count = await page.locator(buttonSelector).count();
      if (count > 0) {
        console.log(`🔘 Action button "${buttonSelector}": ${count} found`);
        
        // Try clicking the first one
        const button = page.locator(buttonSelector).first();
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        
        if (isVisible && isEnabled) {
          await button.click();
          await page.waitForTimeout(1000);
          console.log(`🔘 Clicked "${buttonSelector}" successfully`);
          
          // Check if any modal or form appeared
          const modals = await page.locator('[role="dialog"], .modal, [class*="modal"]').count();
          if (modals > 0) {
            console.log(`📝 Modal/Dialog opened: ${modals}`);
            
            // Close modal if close button exists
            const closeButtons = page.locator('button').filter({ hasText: /close|đóng|×/i });
            const closeCount = await closeButtons.count();
            if (closeCount > 0) {
              await closeButtons.first().click();
              await page.waitForTimeout(500);
              console.log('❌ Modal closed');
            }
          }
          break; // Only test first working button
        }
      }
    }
    
    console.log('✅ Warranty actions tested');
  });

  test('6. 📱 Mobile Responsive Warranty Test', async ({ page }) => {
    console.log('📱 Testing warranty page on mobile...');
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if page is responsive
    const body = page.locator('body');
    const bodyWidth = await body.evaluate(el => el.scrollWidth);
    console.log(`📱 Body scroll width: ${bodyWidth}px`);
    
    // Check for mobile navigation
    const mobileNav = await page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label*="menu"]').count();
    console.log(`📱 Mobile navigation elements: ${mobileNav}`);
    
    // Check if content is accessible
    const visibleElements = await page.locator('*:visible').count();
    console.log(`👁️ Visible elements on mobile: ${visibleElements}`);
    
    // Test scrolling
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    console.log('📱 Mobile scrolling tested');
    
    console.log('✅ Mobile responsive test completed');
  });

  test('7. 🔗 Warranty API Integration Test', async ({ page }) => {
    console.log('🔗 Testing warranty API integration...');
    
    // Test warranty-related API endpoints
    const warrantyEndpoints = [
      '/api/v1/warranty',
      '/api/v1/products', // Products might have warranty info
      '/api/v1/customers' // Customers might have warranty claims
    ];
    
    for (const endpoint of warrantyEndpoints) {
      try {
        const response = await page.request.get(`${API_URL}${endpoint}`);
        const status = response.status();
        console.log(`🔗 ${endpoint}: Status ${status}`);
        
        if (status === 200) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: Success response`);
          if (data.data) {
            const count = Array.isArray(data.data) ? data.data.length : 
                         (data.data.data ? data.data.data.length : 'N/A');
            console.log(`📊 ${endpoint}: ${count} items`);
          }
        } else {
          console.log(`⚠️ ${endpoint}: Status ${status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }
    
    console.log('✅ API integration tested');
  });

  test('8. 🎯 End-to-End Warranty Workflow', async ({ page }) => {
    console.log('🎯 Testing complete warranty workflow...');
    
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Simulate real user workflow
    console.log('👤 Simulating real user behavior...');
    
    // 1. User looks around the page
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
    await page.mouse.move(300, 200);
    await page.waitForTimeout(500);
    
    // 2. User scrolls to see content
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // 3. User tries to interact with elements
    const interactiveElements = await page.locator('button, input, select, a').count();
    console.log(`🎯 Interactive elements found: ${interactiveElements}`);
    
    if (interactiveElements > 0) {
      // Click on first interactive element
      const firstInteractive = page.locator('button, input, select, a').first();
      const elementType = await firstInteractive.evaluate(el => el.tagName.toLowerCase());
      console.log(`🎯 First interactive element: ${elementType}`);
      
      if (elementType === 'button' || elementType === 'a') {
        await firstInteractive.click();
        await page.waitForTimeout(1000);
        console.log('🎯 Clicked first interactive element');
      }
    }
    
    // 4. Check final state
    const finalUrl = page.url();
    const finalTitle = await page.title();
    console.log(`🎯 Final URL: ${finalUrl}`);
    console.log(`🎯 Final title: ${finalTitle}`);
    
    console.log('✅ End-to-end workflow completed');
  });

  test('9. 🏆 Warranty Page Quality Assessment', async ({ page }) => {
    console.log('🏆 Conducting warranty page quality assessment...');
    
    await page.goto(`${APP_URL}/warranty`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Performance assessment
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });
    
    console.log(`⚡ Load time: ${performanceMetrics.loadTime}ms`);
    console.log(`⚡ DOM content loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`⚡ First paint: ${performanceMetrics.firstPaint}ms`);
    
    // Accessibility assessment
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    
    console.log(`♿ Headings: ${headings}`);
    console.log(`♿ Images: ${images} (${imagesWithAlt} with alt text)`);
    console.log(`♿ Buttons: ${buttons}`);
    console.log(`♿ Links: ${links}`);
    
    // Content assessment
    const textContent = await page.locator('body').textContent();
    const wordCount = textContent ? textContent.split(/\s+/).length : 0;
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(textContent || '');
    
    console.log(`📝 Word count: ${wordCount}`);
    console.log(`🇻🇳 Contains Vietnamese: ${hasVietnamese}`);
    
    // Error assessment
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`❌ Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('❌ Errors found:', consoleErrors.slice(0, 3));
    }
    
    // Overall quality score
    let qualityScore = 100;
    if (performanceMetrics.loadTime > 3000) qualityScore -= 10;
    if (imagesWithAlt < images) qualityScore -= 5;
    if (consoleErrors.length > 0) qualityScore -= 10;
    if (wordCount < 50) qualityScore -= 15;
    if (!hasVietnamese) qualityScore -= 5;
    
    console.log(`🏆 Overall Quality Score: ${qualityScore}/100`);
    
    console.log('✅ Quality assessment completed');
  });
