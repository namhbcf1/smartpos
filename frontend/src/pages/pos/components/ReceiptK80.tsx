import React from 'react';
import { formatVND } from '../../../utils/money';

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
}

interface ReceiptProps {
  orderNumber: string;
  storeName: string;
  datetime: string;
  items: ReceiptItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  qrUrl?: string;
}

const ReceiptK80: React.FC<ReceiptProps> = ({ orderNumber, storeName, datetime, items, subtotal_cents, tax_cents, total_cents, qrUrl }) => {
  return (
    <div style={{ fontFamily: 'monospace', width: 300 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{storeName}</div>
        <div>HÓA ĐƠN BÁN HÀNG</div>
        <div>#{orderNumber}</div>
        <div style={{ fontSize: 12 }}>{new Date(datetime).toLocaleString('vi-VN')}</div>
      </div>
      <div>
        {items.map((it, idx) => (
          <div key={idx} style={{ marginBottom: 4 }}>
            <div>{it.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>x{it.quantity} @ {formatVND(it.unit_price_cents)}</span>
              <span>{formatVND(it.total_price_cents)}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Tạm tính</span>
        <span>{formatVND(subtotal_cents)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Thuế</span>
        <span>{formatVND(tax_cents)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>Tổng cộng</span>
        <span>{formatVND(total_cents)}</span>
      </div>
      {qrUrl && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <img src={qrUrl} alt="QR" width={120} height={120} />
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 8 }}>Cảm ơn Quý khách!</div>
    </div>
  );
};

export default ReceiptK80;

