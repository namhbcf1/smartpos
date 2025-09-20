import React from 'react';
import { X, Printer, Download, Share } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface CartItem {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  total: number;
}

interface Receipt {
  orderId: string;
  orderCode: string;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  items: CartItem[];
  timestamp: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  subtotal: number;
  vatAmount: number;
}

export default function ReceiptModal({ isOpen, onClose, receipt, subtotal, vatAmount }: ReceiptModalProps) {
  if (!isOpen || !receipt) return null;

  const printReceipt = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn bán hàng</title>
          <style>
            body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; margin: 3px 0; }
            .item-name { max-width: 200px; overflow: hidden; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="bold">COMPUTER POS PRO</div>
            <div>Cửa hàng máy tính Nam HB</div>
            <div>75 Trần Phú, P.4, Q.5, TP.HCM</div>
            <div>ĐT: 0123456789</div>
            <div class="divider"></div>
            <div class="bold">HÓA ĐƠN BÁN HÀNG</div>
            <div>Mã: ${receipt.orderCode}</div>
            <div>${new Date(receipt.timestamp).toLocaleString('vi-VN')}</div>
          </div>
          
          <div class="divider"></div>
          
          <div>
            ${receipt.items.map(item => 
              `<div class="item">
                <div class="item-name">${item.product.name}</div>
              </div>
              <div class="item">
                <div>${item.quantity} x ${formatCurrency(item.total / item.quantity)}</div>
                <div class="bold">${formatCurrency(item.total)}</div>
              </div>`
            ).join('')}
          </div>
          
          <div class="total">
            <div class="item">
              <div>Tạm tính:</div>
              <div>${formatCurrency(subtotal)}</div>
            </div>
            <div class="item">
              <div>VAT (10%):</div>
              <div>${formatCurrency(vatAmount)}</div>
            </div>
            <div class="divider"></div>
            <div class="item bold">
              <div>TỔNG CỘNG:</div>
              <div>${formatCurrency(receipt.total)}</div>
            </div>
            <div class="item">
              <div>Thanh toán:</div>
              <div>${formatCurrency(receipt.amountPaid)}</div>
            </div>
            <div class="item">
              <div>Tiền thừa:</div>
              <div>${formatCurrency(receipt.change)}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <div>Phương thức: ${receipt.paymentMethod}</div>
            <div style="margin-top: 15px;">CẢM ƠN QUÝ KHÁCH!</div>
            <div>Hẹn gặp lại!</div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const downloadReceipt = () => {
    const receiptText = `
COMPUTER POS PRO
Cửa hàng máy tính Nam HB
75 Trần Phú, P.4, Q.5, TP.HCM
ĐT: 0123456789
================================
HÓA ĐƠN BÁN HÀNG
Mã: ${receipt.orderCode}
${new Date(receipt.timestamp).toLocaleString('vi-VN')}
================================

${receipt.items.map(item => 
  `${item.product.name}
${item.quantity} x ${formatCurrency(item.total / item.quantity)} = ${formatCurrency(item.total)}`
).join('\n')}

--------------------------------
Tạm tính: ${formatCurrency(subtotal)}
VAT (10%): ${formatCurrency(vatAmount)}
================================
TỔNG CỘNG: ${formatCurrency(receipt.total)}
Thanh toán: ${formatCurrency(receipt.amountPaid)}
Tiền thừa: ${formatCurrency(receipt.change)}
================================
Phương thức: ${receipt.paymentMethod}

CẢM ƠN QUÝ KHÁCH!
Hẹn gặp lại!
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoa-don-${receipt.orderCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Hóa đơn thanh toán</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 font-mono text-sm">
          <div className="text-center border-b pb-4 mb-4">
            <div className="font-bold">COMPUTER POS PRO</div>
            <div className="text-xs">Cửa hàng máy tính Nam HB</div>
            <div className="text-xs">75 Trần Phú, P.4, Q.5, TP.HCM</div>
            <div className="text-xs">ĐT: 0123456789</div>
            <div className="mt-3 font-bold">HÓA ĐƠN BÁN HÀNG</div>
            <div className="text-xs">Mã: {receipt.orderCode}</div>
            <div className="text-xs">{new Date(receipt.timestamp).toLocaleString('vi-VN')}</div>
          </div>

          <div className="space-y-2 border-b pb-4 mb-4">
            {receipt.items.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <span className="truncate">{item.product.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{item.quantity} x {formatCurrency(item.total / item.quantity)}</span>
                  <span className="font-bold">{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (10%):</span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(receipt.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thanh toán:</span>
              <span>{formatCurrency(receipt.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tiền thừa:</span>
              <span>{formatCurrency(receipt.change)}</span>
            </div>
          </div>

          <div className="text-center mt-4 pt-4 border-t">
            <div className="text-xs">Phương thức: {receipt.paymentMethod}</div>
            <div className="text-xs mt-2 font-bold">CẢM ƠN QUÝ KHÁCH!</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={printReceipt}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>In hóa đơn</span>
          </button>
          <button
            onClick={downloadReceipt}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải về</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
