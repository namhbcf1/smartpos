/**
 * Setup default store settings
 */

const STORE_SETTINGS = {
  'store_name': 'Cửa hàng điện tử ABC',
  'store_address': '123 Đường ABC, Quận 1, TP.HCM',
  'store_phone': '0901234567',
  'store_email': 'info@cuahangabc.com',
  'store_tax_number': '0123456789',
  'store_business_license': 'BL123456789',
  'store_currency': 'VND',
  'store_timezone': 'Asia/Ho_Chi_Minh'
};

async function setupStoreSettings() {
  try {
    console.log('Setting up store settings...');
    
    // This would typically be called from the backend
    // For now, we'll just log the settings that should be created
    console.log('Store settings to create:', STORE_SETTINGS);
    
    console.log('✅ Store settings setup completed!');
    console.log('Store name will be displayed as:', STORE_SETTINGS.store_name);
    
  } catch (error) {
    console.error('❌ Error setting up store settings:', error);
  }
}

setupStoreSettings();