import React from 'react';

interface ProductDetailPageProps {
  // Online product details
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = (props) => {
  // Yêu cầu kết nối internet
  
  return (
    <div className="online-component">
      <h2>ProductDetailPage</h2>
      <p>Online product details</p>
      {/* Component chỉ hoạt động khi online */}
    </div>
  );
};

export default ProductDetailPage;
