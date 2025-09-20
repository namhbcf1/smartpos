-- Migration: Add payment_methods table
-- This table stores available payment methods for the POS system

CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  fee_percentage REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment methods
INSERT OR IGNORE INTO payment_methods (name, code, description, fee_percentage, is_active) VALUES
('Tiền mặt', 'CASH', 'Thanh toán bằng tiền mặt', 0, 1),
('Chuyển khoản', 'BANK_TRANSFER', 'Thanh toán qua chuyển khoản ngân hàng', 0, 1),
('Thẻ tín dụng', 'CREDIT_CARD', 'Thanh toán bằng thẻ tín dụng', 2.5, 1),
('Thẻ ghi nợ', 'DEBIT_CARD', 'Thanh toán bằng thẻ ghi nợ', 1.5, 1),
('Ví điện tử', 'E_WALLET', 'Thanh toán qua ví điện tử (Momo, ZaloPay...)', 1.0, 1),
('QR Code', 'QR_CODE', 'Thanh toán qua mã QR', 0.5, 1);