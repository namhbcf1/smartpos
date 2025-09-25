-- Migration: Add payment_methods table
-- This table stores available payment methods for the POS system

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  fee_percentage REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Insert default payment methods
INSERT OR IGNORE INTO payment_methods (id, name, code, description, fee_percentage, is_active) VALUES
('pm_cash', 'Tiền mặt', 'CASH', 'Thanh toán bằng tiền mặt', 0, 1),
('pm_bank_transfer', 'Chuyển khoản', 'BANK_TRANSFER', 'Thanh toán qua chuyển khoản ngân hàng', 0, 1),
('pm_credit_card', 'Thẻ tín dụng', 'CREDIT_CARD', 'Thanh toán bằng thẻ tín dụng', 2.5, 1),
('pm_debit_card', 'Thẻ ghi nợ', 'DEBIT_CARD', 'Thanh toán bằng thẻ ghi nợ', 1.5, 1),
('pm_e_wallet', 'Ví điện tử', 'E_WALLET', 'Thanh toán qua ví điện tử (Momo, ZaloPay...)', 1.0, 1),
('pm_qr_code', 'QR Code', 'QR_CODE', 'Thanh toán qua mã QR', 0.5, 1);