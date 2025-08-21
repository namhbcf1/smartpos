import React from 'react';

interface ForgotPasswordPageProps {
  // Online password reset
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = (props) => {
  // Yêu cầu kết nối internet
  
  return (
    <div className="online-component">
      <h2>ForgotPasswordPage</h2>
      <p>Online password reset</p>
      {/* Component chỉ hoạt động khi online */}
    </div>
  );
};

export default ForgotPasswordPage;
