// Vietnamese Computer Hardware POS Employee Management
// ComputerPOS Pro - Production DaisyUI Implementation

import React from 'react';
import { FiUsers, FiSettings } from 'react-icons/fi';

export const EmployeeManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <FiUsers className="inline mr-2" />
            Quản lý nhân viên
          </h1>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-base-100 rounded-lg shadow-sm p-8">
        <div className="text-center">
          <FiSettings className="mx-auto text-6xl text-base-content/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Đang phát triển</h2>
          <p className="text-base-content/70">
            Trang quản lý nhân viên đang được phát triển. 
            Sẽ bao gồm các tính năng quản lý nhân viên, phân ca làm việc, 
            và báo cáo hiệu suất cho ComputerPOS Pro.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
