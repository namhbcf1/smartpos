import React from 'react';

interface ReceiptViewerProps {
  // Online receipt preview
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = (props) => {
  // Yêu cầu kết nối internet
  
  return (
    <div className="online-component">
      <h2>ReceiptViewer</h2>
      <p>Online receipt preview</p>
      {/* Component chỉ hoạt động khi online */}
    </div>
  );
};

export default ReceiptViewer;
