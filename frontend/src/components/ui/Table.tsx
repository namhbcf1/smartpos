import React from 'react';

interface TableProps {
  // Online data table
}

const Table: React.FC<TableProps> = (props) => {
  // Yêu cầu kết nối internet
  
  return (
    <div className="online-component">
      <h2>Table</h2>
      <p>Online data table</p>
      {/* Component chỉ hoạt động khi online */}
    </div>
  );
};

export default Table;
