# 📁 Deprecated Files

Thư mục này chứa các file đã được deprecated trong quá trình tối ưu hóa ComputerPOS Pro.

## Files đã di chuyển:

### test-browser-login.js
- **Lý do**: Sử dụng Puppeteer (không tương thích với Cloudflare Workers)
- **Thay thế**: Sử dụng Playwright tests trong thư mục `tests/`
- **Trạng thái**: Cần chuyển đổi sang Playwright

### test-serial-integration.js  
- **Lý do**: Sử dụng Puppeteer (không tương thích với Cloudflare Workers)
- **Thay thế**: Sử dụng Playwright tests trong thư mục `tests/`
- **Trạng thái**: Cần chuyển đổi sang Playwright

## Hướng dẫn chuyển đổi

Để chuyển đổi từ Puppeteer sang Playwright:

```javascript
// Puppeteer (cũ)
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch();

// Playwright (mới)
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
```

## Lưu ý

- Các file trong thư mục này có thể được xóa sau khi đã chuyển đổi hoàn toàn
- Kiểm tra kỹ logic test trước khi xóa
- Đảm bảo coverage test không bị giảm
