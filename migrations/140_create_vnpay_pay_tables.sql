-- Create VNPay PAY tables for payment transactions

-- Create vnp_pay_transactions table for PAY operations
CREATE TABLE IF NOT EXISTS vnp_pay_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    order_id TEXT NOT NULL,
    txn_ref TEXT NOT NULL UNIQUE, -- vnp_TxnRef (unique per day)
    vnp_transaction_no TEXT UNIQUE, -- VNPay's transaction number
    vnp_amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'VND',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled, suspect
    response_code TEXT, -- vnp_ResponseCode
    transaction_status TEXT, -- vnp_TransactionStatus
    vnp_secure_hash_received TEXT, -- The secure hash received from VNPay
    pay_date TEXT, -- vnp_PayDate
    bank_code TEXT, -- vnp_BankCode
    card_type TEXT, -- vnp_CardType
    order_info TEXT, -- vnp_OrderInfo
    ipn_received_at TEXT,
    return_received_at TEXT,
    raw_request TEXT, -- JSON request payload
    raw_response TEXT, -- JSON response from VNPay
    metadata JSON, -- Store additional VNPay response data
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(txn_ref, created_at) -- Ensure txn_ref is unique per day
);

-- Create index on txn_ref for quick lookup
CREATE INDEX IF NOT EXISTS idx_vnp_pay_transactions_txn_ref ON vnp_pay_transactions(txn_ref);

-- Create index on vnp_transaction_no for quick lookup
CREATE INDEX IF NOT EXISTS idx_vnp_pay_transactions_vnp_transaction_no ON vnp_pay_transactions(vnp_transaction_no);

-- Create index on order_id for quick lookup
CREATE INDEX IF NOT EXISTS idx_vnp_pay_transactions_order_id ON vnp_pay_transactions(order_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_vnp_pay_transactions_status ON vnp_pay_transactions(status);

-- Create vnp_pay_logs table for audit trail
CREATE TABLE IF NOT EXISTS vnp_pay_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL DEFAULT 'default',
    transaction_id TEXT, -- Reference to vnp_pay_transactions.id
    log_type TEXT NOT NULL, -- request, response, ipn, return, error
    endpoint TEXT, -- API endpoint called
    raw_data TEXT, -- Full raw data (masked sensitive info)
    headers TEXT, -- Request headers (masked)
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES vnp_pay_transactions(id) ON DELETE CASCADE
);

-- Create index on transaction_id
CREATE INDEX IF NOT EXISTS idx_vnp_pay_logs_transaction_id ON vnp_pay_logs(transaction_id);

-- Create index on log_type
CREATE INDEX IF NOT EXISTS idx_vnp_pay_logs_log_type ON vnp_pay_logs(log_type);

-- Create vnp_response_codes table for mapping response codes to messages
CREATE TABLE IF NOT EXISTS vnp_response_codes (
    code TEXT PRIMARY KEY,
    message_vi TEXT NOT NULL,
    message_en TEXT NOT NULL,
    is_success INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert VNPay response codes mapping
INSERT OR IGNORE INTO vnp_response_codes (code, message_vi, message_en, is_success, description) VALUES
('00', 'Giao dịch thành công', 'Transaction successful', 1, 'Giao dịch thanh toán được thực hiện thành công'),
('07', 'Trừ tiền thành công. Giao dịch bị nghi ngờ', 'Amount deducted successfully. Transaction suspected', 0, 'Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)'),
('09', 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking', 'Card/Account not registered for InternetBanking', 0, 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng'),
('10', 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần', 'Card/Account authentication failed more than 3 times', 0, 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần'),
('11', 'Đã hết hạn chờ thanh toán', 'Payment timeout', 0, 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch'),
('12', 'Thẻ/Tài khoản bị khóa', 'Card/Account locked', 0, 'Thẻ/Tài khoản của khách hàng bị khóa'),
('13', 'Nhập sai mật khẩu xác thực giao dịch (OTP)', 'Wrong OTP password', 0, 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch'),
('24', 'Khách hàng hủy giao dịch', 'Customer cancelled transaction', 0, 'Khách hàng hủy giao dịch'),
('51', 'Tài khoản không đủ số dư để thực hiện giao dịch', 'Insufficient balance', 0, 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch'),
('65', 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày', 'Daily transaction limit exceeded', 0, 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày'),
('75', 'Ngân hàng thanh toán đang bảo trì', 'Bank under maintenance', 0, 'Ngân hàng thanh toán đang bảo trì'),
('79', 'Nhập sai mật khẩu thanh toán quá số lần quy định', 'Wrong payment password too many times', 0, 'KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch'),
('99', 'Các lỗi khác', 'Other errors', 0, 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)');

-- Create vnp_transaction_status table for mapping transaction status
CREATE TABLE IF NOT EXISTS vnp_transaction_status (
    code TEXT PRIMARY KEY,
    message_vi TEXT NOT NULL,
    message_en TEXT NOT NULL,
    is_success INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert VNPay transaction status mapping
INSERT OR IGNORE INTO vnp_transaction_status (code, message_vi, message_en, is_success, description) VALUES
('00', 'Giao dịch thành công', 'Transaction successful', 1, 'Giao dịch thanh toán được thực hiện thành công tại VNPAY'),
('01', 'Giao dịch chưa hoàn tất', 'Transaction incomplete', 0, 'Giao dịch chưa hoàn tất'),
('02', 'Giao dịch bị lỗi', 'Transaction error', 0, 'Giao dịch bị lỗi'),
('04', 'Giao dịch đảo', 'Reversed transaction', 0, 'Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY'),
('05', 'VNPAY đang xử lý giao dịch này', 'VNPAY processing transaction', 0, 'VNPAY đang xử lý giao dịch này (GD hoàn tiền)'),
('06', 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng', 'VNPAY sent refund request to bank', 0, 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)'),
('07', 'Giao dịch bị nghi ngờ gian lận', 'Transaction suspected fraud', 0, 'Giao dịch bị nghi ngờ gian lận'),
('09', 'GD Hoàn trả bị từ chối', 'Refund rejected', 0, 'GD Hoàn trả bị từ chối');
