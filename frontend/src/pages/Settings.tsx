// Vietnamese Computer Hardware POS Settings
// ComputerPOS Pro - Production DaisyUI Implementation

import React from 'react';
import { FiSettings, FiUser, FiShield, FiDollarSign, FiPrinter } from 'react-icons/fi';

const Settings = () => {
  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <FiSettings className="inline mr-2" />
            Cài đặt hệ thống
          </h1>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User Settings */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <FiUser className="text-2xl text-primary mr-3" />
            <h2 className="text-lg font-semibold">Quản lý người dùng</h2>
          </div>
          <p className="text-base-content/70 mb-4">
            Quản lý tài khoản người dùng, phân quyền và cài đặt cá nhân
          </p>
          <button className="btn btn-outline btn-sm">
            Cấu hình
          </button>
        </div>

        {/* Security Settings */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <FiShield className="text-2xl text-success mr-3" />
            <h2 className="text-lg font-semibold">Bảo mật</h2>
          </div>
          <p className="text-base-content/70 mb-4">
            Cài đặt bảo mật, mật khẩu và xác thực hai yếu tố
          </p>
          <button className="btn btn-outline btn-sm">
            Cấu hình
          </button>
        </div>

        {/* Payment Settings */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <FiDollarSign className="text-2xl text-warning mr-3" />
            <h2 className="text-lg font-semibold">Thanh toán</h2>
          </div>
          <p className="text-base-content/70 mb-4">
            Cấu hình phương thức thanh toán và tích hợp ngân hàng
          </p>
          <button className="btn btn-outline btn-sm">
            Cấu hình
          </button>
        </div>

        {/* Print Settings */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <FiPrinter className="text-2xl text-info mr-3" />
            <h2 className="text-lg font-semibold">In ấn</h2>
          </div>
          <p className="text-base-content/70 mb-4">
            Cài đặt máy in hóa đơn và định dạng in
          </p>
          <button className="btn btn-outline btn-sm">
            Cấu hình
          </button>
        </div>
      </div>

      {/* Vietnamese Business Settings */}
      <div className="bg-base-100 rounded-lg shadow-sm p-6 mt-4">
        <h2 className="text-lg font-semibold mb-4">Cài đặt doanh nghiệp Việt Nam</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Thuế VAT (%)</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value="10"
              readOnly
            />
            <label className="label">
              <span className="label-text-alt">Thuế VAT chuẩn Việt Nam: 10%</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Định dạng tiền tệ</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value="1.999.000 ₫"
              readOnly
            />
            <label className="label">
              <span className="label-text-alt">Định dạng VND chuẩn Việt Nam</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;