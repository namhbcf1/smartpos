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
  address?: string;
  phone?: string;
  datetime: string;
  items: ReceiptItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
}

const ReceiptA5: React.FC<ReceiptProps> = ({ orderNumber, storeName, address, phone, datetime, items, subtotal_cents, tax_cents, total_cents }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', width: 600, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{storeName}</div>
          {address && <div style={{ fontSize: 12 }}>{address}</div>}
          {phone && <div style={{ fontSize: 12 }}>Điện thoại: {phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>HÓA ĐƠN</div>
          <div>#{orderNumber}</div>
          <div style={{ fontSize: 12 }}>{new Date(datetime).toLocaleString('vi-VN')}</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Sản phẩm</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>SL</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>Đơn giá</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: 8 }}>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={{ padding: 8 }}>{it.name}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{it.quantity}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{formatVND(it.unit_price_cents)}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{formatVND(it.total_price_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <div style={{ width: 260 }}>
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
        </div>
      </div>
      <div style={{ marginTop: 20, fontSize: 12, textAlign: 'center' }}>Cảm ơn Quý khách. Hẹn gặp lại!</div>
    </div>
  );
};

export default ReceiptA5;

