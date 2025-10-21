# Hướng dẫn tích hợp VNPay vào Smart POS

## Tổng quan

VNPay đã được tích hợp hoàn chỉnh vào hệ thống Smart POS với các tính năng:

- ✅ Tạo URL thanh toán VNPay
- ✅ Xử lý kết quả thanh toán (Return URL)
- ✅ Xử lý thông báo IPN từ VNPay
- ✅ Giao diện thanh toán trong POS
- ✅ Trang hiển thị kết quả thanh toán
- ✅ Hỗ trợ nhiều ngân hàng và ví điện tử

## Cấu hình Environment Variables

Thêm các biến môi trường sau vào file `.env.production`:

```bash
# VNPay Configuration
VNPAY_TMN_CODE=DEMOV210
VNPAY_HASH_SECRET=RAOEXHYVSDDIIENYWSLDKIENNSBIEDOE
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://namhbcf-uk.pages.dev/payment/vnpay-return
VNPAY_IPN_URL=https://namhbcf-api.bangachieu2.workers.dev/api/payments/vnpay/ipn
```

## API Endpoints

### 1. Tạo URL thanh toán
```
POST /api/payments/vnpay/create-payment-url
```

**Request Body:**
```json
{
  "orderId": "POS_1234567890",
  "amount": 1000000,
  "orderDescription": "Thanh toán đơn hàng POS",
  "bankCode": "VNPAYQR", // Optional
  "ipAddress": "127.0.0.1" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderId": "POS_1234567890",
    "amount": 1000000
  },
  "message": "Payment URL created successfully"
}
```

### 2. Xử lý kết quả thanh toán (Return URL)
```
GET /api/payments/vnpay/return
```

Tự động xử lý và chuyển hướng về frontend với kết quả.

### 3. Xử lý IPN (Instant Payment Notification)
```
POST /api/payments/vnpay/ipn
```

Tự động cập nhật trạng thái đơn hàng và tồn kho.

### 4. Truy vấn trạng thái giao dịch
```
GET /api/payments/vnpay/query/:orderId
```

### 5. Lấy danh sách ngân hàng
```
GET /api/payments/vnpay/banks
```

## Luồng thanh toán

1. **Khách hàng chọn VNPay** trong POS Screen
2. **Hệ thống tạo URL thanh toán** và chuyển hướng đến VNPay
3. **Khách hàng thanh toán** trên trang VNPay
4. **VNPay chuyển hướng về** `/payment/vnpay-return` với kết quả
5. **VNPay gửi IPN** đến `/api/payments/vnpay/ipn` để cập nhật trạng thái
6. **Hệ thống cập nhật** đơn hàng và tồn kho tự động

## Các ngân hàng được hỗ trợ

### Ngân hàng chính
- **Vietcombank** (VIETCOMBANK)
- **VietinBank** (VIETINBANK) 
- **BIDV** (BIDV)
- **Agribank** (AGRIBANK)
- **ACB** (ACB)
- **Techcombank** (TECHCOMBANK)
- **MB Bank** (MBBANK)
- **VPBank** (VPBANK)

### Ví điện tử
- **MoMo** (MOMO)
- **ZaloPay** (ZALOPAY)
- **ViettelPay** (VIETTELPAY)
- **VNPay** (VNPAY)

### Phương thức khác
- **VNPay QR** (VNPAYQR) - Quét mã QR
- **ATM nội địa** (VNBANK)
- **Thẻ quốc tế** (INTCARD)

## Mã lỗi VNPay

| Mã | Mô tả |
|----|-------|
| 00 | Giao dịch thành công |
| 07 | Trừ tiền thành công. Giao dịch bị nghi ngờ |
| 09 | Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking |
| 10 | Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần |
| 11 | Đã hết hạn chờ thanh toán |
| 12 | Thẻ/Tài khoản bị khóa |
| 13 | Nhập sai mật khẩu xác thực giao dịch (OTP) |
| 24 | Khách hàng hủy giao dịch |
| 51 | Tài khoản không đủ số dư |
| 65 | Tài khoản đã vượt quá hạn mức giao dịch trong ngày |
| 75 | Ngân hàng thanh toán đang bảo trì |
| 79 | Nhập sai mật khẩu thanh toán quá số lần quy định |
| 99 | Các lỗi khác |

## Bảo mật

- ✅ **Secure Hash**: Sử dụng HMAC-SHA512 để xác thực
- ✅ **IPN Verification**: Xác thực dữ liệu từ VNPay
- ✅ **Return URL Verification**: Kiểm tra tính toàn vẹn dữ liệu
- ✅ **HTTPS Only**: Tất cả giao tiếp đều qua HTTPS

## Testing

### Sandbox Environment
- **URL**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- **TmnCode**: `DEMOV210`
- **HashSecret**: `RAOEXHYVSDDIIENYWSLDKIENNSBIEDOE`

### Test Cards
Sử dụng các thẻ test của VNPay để kiểm tra:
- Thẻ thành công: `9704198526191432198`
- Thẻ thất bại: `9704198526191432199`

## Production Deployment

1. **Đăng ký tài khoản VNPay** tại [vnpayment.vn](https://vnpayment.vn)
2. **Cập nhật credentials** trong environment variables
3. **Thay đổi URL** từ sandbox sang production:
   ```bash
   VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
   ```
4. **Cấu hình domain** trong VNPay merchant portal
5. **Test thoroughly** trước khi go-live

## Troubleshooting

### Lỗi thường gặp

1. **"Invalid secure hash"**
   - Kiểm tra `VNPAY_HASH_SECRET`
   - Đảm bảo parameters được sort đúng thứ tự

2. **"Missing required parameters"**
   - Kiểm tra `orderId`, `amount`, `orderDescription`

3. **"IPN processing failed"**
   - Kiểm tra database connection
   - Xem logs để debug chi tiết

### Debug Mode

Bật debug mode để xem chi tiết logs:
```bash
LOG_LEVEL=debug
```

## Support

- **VNPay Documentation**: [sandbox.vnpayment.vn/apis/docs](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- **VNPay Support**: support@vnpayment.vn
- **Smart POS Issues**: Tạo issue trong repository

---

**Lưu ý**: Đây là tích hợp hoàn chỉnh VNPay vào Smart POS. Đảm bảo test kỹ trong sandbox environment trước khi deploy production.
