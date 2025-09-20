import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, User, Store, Palette, Shield, Bell, Database, Cloud,
  Home, Package, BarChart3, ShoppingCart, Save, RefreshCw, Star, Check
} from 'lucide-react';

const UltraSettingsPage: React.FC = () => {
  console.log('⚙️ UltraSettingsPage component is rendering!');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    storeName: 'SmartPOS Store',
    storeAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    storePhone: '0123456789',
    storeEmail: 'store@smartpos.vn',
    currency: 'VND',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    theme: 'light',
    notifications: true,
    autoBackup: true,
    soundEnabled: true
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const headerStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    marginBottom: '8px'
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '16px',
    marginBottom: '20px'
  };

  const navButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  };

  const navButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: 'linear-gradient(45deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    gap: '24px'
  };

  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    height: 'fit-content'
  };

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
  };

  const tabButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    margin: '4px 0',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    fontWeight: '500',
    textAlign: 'left'
  };

  const activeTabStyle: React.CSSProperties = {
    ...tabButtonStyle,
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    color: 'white',
    transform: 'scale(1.02)'
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '24px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const switchContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const switchStyle: React.CSSProperties = {
    width: '50px',
    height: '24px',
    borderRadius: '12px',
    background: '#e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative'
  };

  const activeSwitchStyle: React.CSSProperties = {
    ...switchStyle,
    background: 'linear-gradient(45deg, #10b981, #059669)'
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb'
  };

  const primaryButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: 'linear-gradient(45deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...primaryButtonStyle,
    background: 'linear-gradient(45deg, #6b7280, #4b5563)'
  };

  const tabs = [
    { id: 'general', label: 'Cài đặt chung', icon: <Settings size={20} /> },
    { id: 'store', label: 'Thông tin cửa hàng', icon: <Store size={20} /> },
    { id: 'appearance', label: 'Giao diện', icon: <Palette size={20} /> },
    { id: 'security', label: 'Bảo mật', icon: <Shield size={20} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} /> },
    { id: 'data', label: 'Dữ liệu & Sao lưu', icon: <Database size={20} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
              ⚙️ Cài Đặt Chung
            </h2>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Ngôn ngữ hiển thị</label>
              <select 
                style={selectStyle} 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Múi giờ</label>
              <select 
                style={selectStyle}
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
              >
                <option value="Asia/Ho_Chi_Minh">🇻🇳 Việt Nam (GMT+7)</option>
                <option value="Asia/Bangkok">🇹🇭 Thailand (GMT+7)</option>
              </select>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Đơn vị tiền tệ</label>
              <select 
                style={selectStyle}
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
              >
                <option value="VND">💰 VND - Việt Nam Đồng</option>
                <option value="USD">💵 USD - US Dollar</option>
              </select>
            </div>
          </div>
        );

      case 'store':
        return (
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
              🏪 Thông Tin Cửa Hàng
            </h2>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Tên cửa hàng</label>
              <input 
                type="text" 
                style={inputStyle}
                value={settings.storeName}
                onChange={(e) => updateSetting('storeName', e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Địa chỉ</label>
              <input 
                type="text" 
                style={inputStyle}
                value={settings.storeAddress}
                onChange={(e) => updateSetting('storeAddress', e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Số điện thoại</label>
              <input 
                type="tel" 
                style={inputStyle}
                value={settings.storePhone}
                onChange={(e) => updateSetting('storePhone', e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input 
                type="email" 
                style={inputStyle}
                value={settings.storeEmail}
                onChange={(e) => updateSetting('storeEmail', e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
              🎨 Giao Diện
            </h2>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Chủ đề</label>
              <div style={{display: 'flex', gap: '16px', marginTop: '12px'}}>
                {[
                  { value: 'light', label: '☀️ Sáng', color: '#ffffff' },
                  { value: 'dark', label: '🌙 Tối', color: '#1f2937' },
                  { value: 'auto', label: '🤖 Tự động', color: 'linear-gradient(45deg, #ffffff, #1f2937)' }
                ].map(theme => (
                  <div
                    key={theme.value}
                    style={{
                      padding: '16px',
                      border: settings.theme === theme.value ? '3px solid #667eea' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: theme.color,
                      color: theme.value === 'dark' ? 'white' : 'black',
                      transition: 'all 0.3s ease',
                      minWidth: '100px'
                    }}
                    onClick={() => updateSetting('theme', theme.value)}
                  >
                    {theme.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
              🔔 Cài Đặt Thông Báo
            </h2>
            <div style={formGroupStyle}>
              <div style={switchContainerStyle}>
                <div
                  style={settings.notifications ? activeSwitchStyle : switchStyle}
                  onClick={() => updateSetting('notifications', !settings.notifications)}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: settings.notifications ? '28px' : '2px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <label style={labelStyle}>Bật thông báo</label>
              </div>
            </div>
            <div style={formGroupStyle}>
              <div style={switchContainerStyle}>
                <div
                  style={settings.soundEnabled ? activeSwitchStyle : switchStyle}
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: settings.soundEnabled ? '28px' : '2px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <label style={labelStyle}>🔊 Âm thanh thông báo</label>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
              💾 Dữ Liệu & Sao Lưu
            </h2>
            <div style={formGroupStyle}>
              <div style={switchContainerStyle}>
                <div
                  style={settings.autoBackup ? activeSwitchStyle : switchStyle}
                  onClick={() => updateSetting('autoBackup', !settings.autoBackup)}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: settings.autoBackup ? '28px' : '2px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <label style={labelStyle}>☁️ Sao lưu tự động</label>
              </div>
            </div>
            <div style={formGroupStyle}>
              <button
                style={{...primaryButtonStyle, background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)'}}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Cloud size={20} />
                Sao lưu ngay
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937'}}>
              🔒 Bảo Mật
            </h2>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Đổi mật khẩu</label>
              <input 
                type="password" 
                style={inputStyle}
                placeholder="Mật khẩu hiện tại"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={formGroupStyle}>
              <input 
                type="password" 
                style={inputStyle}
                placeholder="Mật khẩu mới"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>⚙️ Cài Đặt Hệ Thống Siêu Đẹp</h1>
        <p style={subtitleStyle}>
          Tùy chỉnh và cấu hình hệ thống POS theo nhu cầu của bạn
        </p>

        <div style={navButtonsStyle}>
          <button
            style={navButtonStyle}
            onClick={() => navigate('/dashboard')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Home size={16} />
            Dashboard
          </button>
          <button
            style={{...navButtonStyle, background: 'linear-gradient(45deg, #667eea, #764ba2)'}}
            onClick={() => navigate('/pos')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ShoppingCart size={16} />
            POS
          </button>
          <button
            style={{...navButtonStyle, background: 'linear-gradient(45deg, #f59e0b, #d97706)'}}
            onClick={() => navigate('/products')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Package size={16} />
            Sản phẩm
          </button>
          <button
            style={{...navButtonStyle, background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)'}}
            onClick={() => navigate('/reports')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <BarChart3 size={16} />
            Báo cáo
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937'}}>
            📋 Danh mục cài đặt
          </h3>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={activeTab === tab.id ? activeTabStyle : tabButtonStyle}
              onClick={() => setActiveTab(tab.id)}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={mainContentStyle}>
          {renderTabContent()}

          {/* Action Buttons */}
          <div style={buttonGroupStyle}>
            <button
              style={primaryButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Save size={20} />
              Lưu thay đổi
            </button>
            <button
              style={secondaryButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <RefreshCw size={20} />
              Khôi phục mặc định
            </button>
          </div>

          {/* Success Message */}
          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: 'linear-gradient(45deg, #dcfce7, #bbf7d0)',
            borderRadius: '16px',
            border: '2px solid #22c55e',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <Check size={32} style={{marginBottom: '12px', color: '#16a34a'}} />
            <div style={{fontSize: '20px', fontWeight: 'bold', color: '#15803d', marginBottom: '8px'}}>
              🎉 Cài Đặt Hệ Thống Siêu Đẹp Đã Hoạt Động!
            </div>
            <div style={{color: '#166534', fontSize: '14px'}}>
              Claude Code đã tạo giao diện cài đặt với form tuyệt đẹp và đầy đủ tính năng! ⚙️✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltraSettingsPage;
