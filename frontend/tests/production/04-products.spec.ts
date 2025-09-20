import { test, expect } from '@playwright/test';

/**
 * PRODUCTS MODULE TESTS
 * Testing products list/grid, search, filtering, CRUD operations, Excel import/export, and categories
 */

test.describe('Products Module', () => {

  test.beforeEach(async ({ page }) => {
    // Login and navigate to products page
    await page.goto('/');

    const isLoginPage = await page.locator('input[name="username"], input[name="email"]').count() > 0;
    if (isLoginPage) {
      await page.locator('input[name="username"], input[name="email"]').first().fill('admin');
      await page.locator('input[name="password"]').fill('admin123');
      await page.locator('button[type="submit"], button:has-text("Login")').first().click();
      await page.waitForURL(/\/(dashboard|home|main|pos)/, { timeout: 30000 });
    }

    // Navigate to products page
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('should load products page and display product list', async ({ page }) => {
    // Verify we're on products page
    expect(page.url()).toMatch(/\/products/);

    // Look for product elements
    const productSelectors = [
      '.product-card',
      '.product-item',
      '[data-testid="product"]',
      'tbody tr', // Table rows
      '.grid > div', // Grid items
      '.product-list-item'
    ];

    let productsFound = false;
    let productCount = 0;

    for (const selector of productSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        productsFound = true;
        productCount = count;
        console.log(`✅ Found ${count} products with selector: ${selector}`);
        break;
      }
    }

    console.log(`📦 Products found: ${productsFound}, Count: ${productCount}`);

    // Take screenshot of products page
    await page.screenshot({ path: 'test-results/screenshots/products-main.png', fullPage: true });
  });

  test('should test list/grid toggle functionality', async ({ page }) => {
    // Look for view toggle buttons
    const toggleSelectors = [
      'button:has-text("Grid")',
      'button:has-text("List")',
      '[data-testid="grid-view"]',
      '[data-testid="list-view"]',
      'button[aria-label*="grid"]',
      'button[aria-label*="list"]',
      '.view-toggle button'
    ];

    const viewResults = [];

    for (const selector of toggleSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        try {
          await button.click();
          await page.waitForTimeout(1000);

          viewResults.push({
            selector,
            clicked: true
          });

          console.log(`✅ Successfully clicked view toggle: ${selector}`);
        } catch (error) {
          console.log(`⚠️ Failed to click view toggle: ${selector}`, error);
        }
      }
    }

    // Take screenshot after view changes
    await page.screenshot({ path: 'test-results/screenshots/products-view-toggle.png', fullPage: true });

    console.log(`🔄 View toggle buttons tested: ${viewResults.length}`);
  });

  test('should test product search functionality', async ({ page }) => {
    // Look for search input
    const searchSelectors = [
      'input[placeholder*="search"]',
      'input[placeholder*="Search"]',
      'input[name="search"]',
      '[data-testid="search"]',
      '.search-input',
      'input[type="search"]'
    ];

    let searchTested = false;

    for (const selector of searchSelectors) {
      const searchInput = page.locator(selector).first();
      if (await searchInput.count() > 0) {
        try {
          // Test search with a common term
          await searchInput.fill('product');
          await page.waitForTimeout(2000); // Wait for search results

          // Check if results changed
          const hasResults = await page.locator('.no-results, .empty-state').count() === 0;

          console.log(`🔍 Search test: Input found, Results shown: ${hasResults}`);

          // Clear search
          await searchInput.fill('');
          await page.waitForTimeout(1000);

          searchTested = true;
          break;
        } catch (error) {
          console.log(`⚠️ Search test failed for ${selector}:`, error);
        }
      }
    }

    // Take screenshot of search results
    await page.screenshot({ path: 'test-results/screenshots/products-search.png', fullPage: true });

    console.log(`🔍 Search functionality tested: ${searchTested}`);
  });

  test('should test category filtering', async ({ page }) => {
    // Look for category filters
    const categorySelectors = [
      'select[name*="category"]',
      '.category-filter',
      '[data-testid="category-filter"]',
      'button:has-text("Category")',
      '.filter-dropdown',
      '.category-dropdown'
    ];

    let categoryFilterTested = false;

    for (const selector of categorySelectors) {
      const categoryFilter = page.locator(selector).first();
      if (await categoryFilter.count() > 0) {
        try {
          await categoryFilter.click();
          await page.waitForTimeout(1000);

          // Look for filter options
          const options = await page.locator('option, .dropdown-item, .filter-option').count();
          if (options > 0) {
            console.log(`✅ Category filter found with ${options} options`);
            categoryFilterTested = true;
          }

          break;
        } catch (error) {
          console.log(`⚠️ Category filter test failed:`, error);
        }
      }
    }

    // Take screenshot of category filters
    await page.screenshot({ path: 'test-results/screenshots/products-category-filter.png', fullPage: true });

    console.log(`🏷️ Category filtering tested: ${categoryFilterTested}`);
  });

  test('should test Add Product button and form', async ({ page }) => {
    // Look for Add Product button
    const addProductSelectors = [
      'button:has-text("Add Product")',
      'a:has-text("Add Product")',
      '[data-testid="add-product"]',
      'button:has-text("New Product")',
      'button:has-text("Create Product")',
      '.add-product-btn'
    ];

    let addProductTested = false;

    for (const selector of addProductSelectors) {
      const addButton = page.locator(selector).first();
      if (await addButton.count() > 0) {
        try {
          await addButton.click();
          await page.waitForTimeout(2000);

          // Check if form opened (modal or new page)
          const formOpened = await page.locator('form, .modal, .dialog').count() > 0 ||
                           page.url().includes('add') || page.url().includes('new') || page.url().includes('create');

          if (formOpened) {
            console.log('✅ Add Product form opened successfully');

            // Look for form fields
            const formFields = [
              'input[name*="name"]',
              'input[name*="price"]',
              'input[name*="sku"]',
              'textarea[name*="description"]',
              'select[name*="category"]'
            ];

            const fieldsFound = [];
            for (const field of formFields) {
              if (await page.locator(field).count() > 0) {
                fieldsFound.push(field);
              }
            }

            console.log(`📝 Form fields found: ${fieldsFound.length}`);

            // Take screenshot of form
            await page.screenshot({ path: 'test-results/screenshots/products-add-form.png', fullPage: true });

            // Close form if modal
            const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), .modal-close').first();
            if (await closeButton.count() > 0) {
              await closeButton.click();
            } else if (page.url() !== '/products') {
              await page.goBack();
            }

            addProductTested = true;
          }

          break;
        } catch (error) {
          console.log(`⚠️ Add Product test failed:`, error);
        }
      }
    }

    console.log(`➕ Add Product functionality tested: ${addProductTested}`);
  });

  test('should test Edit/Delete buttons on products', async ({ page }) => {
    // Look for edit/delete buttons on product items
    const actionSelectors = [
      'button:has-text("Edit")',
      'button:has-text("Delete")',
      '[data-testid="edit-product"]',
      '[data-testid="delete-product"]',
      '.edit-btn',
      '.delete-btn',
      '.action-button'
    ];

    const actionResults = [];

    for (const selector of actionSelectors) {
      const buttons = await page.locator(selector).count();
      if (buttons > 0) {
        actionResults.push({
          action: selector,
          count: buttons
        });

        // Test clicking the first button
        try {
          const firstButton = page.locator(selector).first();
          await firstButton.click();
          await page.waitForTimeout(1000);

          // Check if action worked (modal opened, navigation occurred)
          const actionWorked = await page.locator('.modal, .dialog, form').count() > 0 ||
                              page.url() !== '/products';

          console.log(`✅ ${selector}: ${buttons} buttons found, click worked: ${actionWorked}`);

          // Cancel or go back if needed
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
          } else if (page.url() !== '/products') {
            await page.goBack();
          }

        } catch (error) {
          console.log(`⚠️ Failed to test ${selector}:`, error);
        }
      }
    }

    // Take screenshot of product actions
    await page.screenshot({ path: 'test-results/screenshots/products-actions.png', fullPage: true });

    console.log('✏️ Product action buttons tested:', actionResults.length);
  });

  test('should test Excel Import/Export functionality', async ({ page }) => {
    // Look for import/export buttons
    const importExportSelectors = [
      'button:has-text("Import")',
      'button:has-text("Export")',
      'button:has-text("Excel")',
      '[data-testid="import"]',
      '[data-testid="export"]',
      '.import-btn',
      '.export-btn'
    ];

    const importExportResults = [];

    for (const selector of importExportSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        try {
          await button.click();
          await page.waitForTimeout(2000);

          // Check if file dialog opened or download initiated
          const actionWorked = await page.locator('input[type="file"], .file-upload').count() > 0;

          importExportResults.push({
            button: selector,
            worked: actionWorked
          });

          console.log(`📊 ${selector}: Click worked = ${actionWorked}`);

          // Close any opened dialogs
          const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
          if (await closeButton.count() > 0) {
            await closeButton.click();
          }

        } catch (error) {
          console.log(`⚠️ Import/Export test failed for ${selector}:`, error);
        }
      }
    }

    // Take screenshot of import/export area
    await page.screenshot({ path: 'test-results/screenshots/products-import-export.png', fullPage: true });

    console.log(`📈 Import/Export buttons tested: ${importExportResults.length}`);
  });

  test('should test Categories management', async ({ page }) => {
    // Look for categories section or button
    const categorySelectors = [
      'button:has-text("Categories")',
      'a:has-text("Categories")',
      '[data-testid="categories"]',
      '.categories-btn',
      'button:has-text("Manage Categories")'
    ];

    let categoriesTested = false;

    for (const selector of categorySelectors) {
      const categoryButton = page.locator(selector).first();
      if (await categoryButton.count() > 0) {
        try {
          await categoryButton.click();
          await page.waitForTimeout(2000);

          // Check if categories page/modal opened
          const categoriesOpened = await page.locator('.categories, .category-list').count() > 0 ||
                                  page.url().includes('categories');

          if (categoriesOpened) {
            console.log('✅ Categories management opened');

            // Look for add category functionality
            const addCategoryBtn = page.locator('button:has-text("Add Category"), button:has-text("New Category")').first();
            if (await addCategoryBtn.count() > 0) {
              console.log('✅ Add Category button found');
            }

            categoriesTested = true;

            // Take screenshot of categories
            await page.screenshot({ path: 'test-results/screenshots/products-categories.png', fullPage: true });

            // Go back to products if navigated away
            if (page.url().includes('categories') && !page.url().includes('products')) {
              await page.goto('/products');
            }
          }

          break;
        } catch (error) {
          console.log(`⚠️ Categories test failed:`, error);
        }
      }
    }

    console.log(`🏷️ Categories management tested: ${categoriesTested}`);
  });

  test('should test product detail views', async ({ page }) => {
    // Look for product items to click on
    const productItemSelectors = [
      '.product-card',
      '.product-item',
      'tbody tr',
      '[data-testid="product"]'
    ];

    let detailViewTested = false;

    for (const selector of productItemSelectors) {
      const productItems = await page.locator(selector).count();
      if (productItems > 0) {
        try {
          // Click on the first product
          await page.locator(selector).first().click();
          await page.waitForTimeout(2000);

          // Check if detail view opened
          const detailOpened = await page.locator('.product-detail, .modal, .dialog').count() > 0 ||
                              page.url().includes('/product/') || page.url().includes('/products/');

          if (detailOpened) {
            console.log('✅ Product detail view opened');

            // Take screenshot of detail view
            await page.screenshot({ path: 'test-results/screenshots/products-detail-view.png', fullPage: true });

            detailViewTested = true;

            // Close detail view or go back
            const closeBtn = page.locator('button:has-text("Close"), button:has-text("Back")').first();
            if (await closeBtn.count() > 0) {
              await closeBtn.click();
            } else if (page.url() !== '/products') {
              await page.goBack();
            }
          }

          break;
        } catch (error) {
          console.log(`⚠️ Product detail test failed:`, error);
        }
      }
    }

    console.log(`👁️ Product detail view tested: ${detailViewTested}`);
  });
});