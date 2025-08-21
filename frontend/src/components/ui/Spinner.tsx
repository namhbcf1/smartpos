import React from 'react';

interface SpinnerProps {
  // Online loading spinner
}

const Spinner: React.FC<SpinnerProps> = (props) => {
  // Yêu cầu kết nối internet
  
  return (
    <div className="online-component">
      <h2>Spinner</h2>
      <p>Online loading spinner</p>
      {/* Component chỉ hoạt động khi online */}
    </div>
  );
};

export default Spinner;
