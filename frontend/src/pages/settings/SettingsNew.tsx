import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, Store, CreditCard, Package,
  ShoppingCart, Database, Save, CheckCircle,
  Loader
} from 'lucide-react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'react-hot-toast';

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  currency: string;
  timezone: string;
  receipt_footer: string;
  business_hours: any;
}

interface TaxSettings {
  tax_rate: number;
  enable_vat: boolean;
  tax_number: string;
  tax_address: string;
}

interface InventorySettings {
  low_stock_threshold: number;
  auto_reorder: boolean;
  track_serial_numbers: boolean;
  track_batches: boolean;
  default_warehouse: string;
}

interface POSSettings {
  auto_print_receipt: boolean;
  show_customer_display: boolean;
  require_customer_info: boolean;
  default_payment_method: string;
  receipt_printer: string;
  barcode_scanner: string;
}

interface BackupSettings {
  auto_backup: boolean;
  backup_frequency: string;
  backup_retention_days: number;
  backup_location: string;
  last_backup?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  sort_order: number;
}

const SettingsNew: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  // Settings state
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    receipt_footer: '',
    business_hours: {}
  });

  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    tax_rate: 10,
    enable_vat: true,
    tax_number: '',
    tax_address: ''
  });

  const [inventorySettings, setInventorySettings] = useState<InventorySettings>({
    low_stock_threshold: 10,
    auto_reorder: false,
    track_serial_numbers: true,
    track_batches: false,
    default_warehouse: 'main'
  });

  const [posSettings, setPosSettings] = useState<POSSettings>({
    auto_print_receipt: true,
    show_customer_display: true,
    require_customer_info: false,
    default_payment_method: 'CASH',
    receipt_printer: 'default',
    barcode_scanner: 'enabled'
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    auto_backup: true,
    backup_frequency: 'daily',
    backup_retention_days: 30,
    backup_location: 'cloud'
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Load all settings on component mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);

      // Load all settings in parallel
      const [storeRes, taxRes, inventoryRes, posRes, backupRes, paymentRes] = await Promise.all([
        api.get('/settings/store'),
        api.get('/settings/tax'),
        api.get('/settings/inventory'),
        api.get('/settings/pos'),
        api.get('/settings/backup'),
        api.get('/settings/payment-methods')
      ]);

      // Update store settings
      if (storeRes.success && storeRes.data) {
        setStoreSettings({
          name: storeRes.data.name || '',
          address: storeRes.data.address || '',
          phone: storeRes.data.phone || '',
          email: storeRes.data.email || '',
          website: storeRes.data.website || '',
          tax_id: storeRes.data.tax_id || '',
          currency: storeRes.data.currency || 'VND',
          timezone: storeRes.data.timezone || 'Asia/Ho_Chi_Minh',
          receipt_footer: storeRes.data.receipt_footer || '',
          business_hours: storeRes.data.business_hours || {}
        });
      }

      // Update tax settings
      if (taxRes.success && taxRes.data) {
        setTaxSettings({
          tax_rate: Number(taxRes.data.tax_rate) || 10,
          enable_vat: taxRes.data.enable_vat || true,
          tax_number: taxRes.data.tax_number || '',
          tax_address: taxRes.data.tax_address || ''
        });
      }

      // Update inventory settings
      if (inventoryRes.success && inventoryRes.data) {
        setInventorySettings({
          low_stock_threshold: Number(inventoryRes.data.low_stock_threshold) || 10,
          auto_reorder: inventoryRes.data.auto_reorder === true || inventoryRes.data.auto_reorder === 'true',
          track_serial_numbers: inventoryRes.data.track_serial_numbers === true || inventoryRes.data.track_serial_numbers === 'true',
          track_batches: inventoryRes.data.track_batches === true || inventoryRes.data.track_batches === 'true',
          default_warehouse: inventoryRes.data.default_warehouse || 'main'
        });
      }

      // Update POS settings
      if (posRes.success && posRes.data) {
        setPosSettings({
          auto_print_receipt: posRes.data.auto_print_receipt === true || posRes.data.auto_print_receipt === 'true',
          show_customer_display: posRes.data.show_customer_display === true || posRes.data.show_customer_display === 'true',
          require_customer_info: posRes.data.require_customer_info === true || posRes.data.require_customer_info === 'true',
          default_payment_method: posRes.data.default_payment_method || 'CASH',
          receipt_printer: posRes.data.receipt_printer || 'default',
          barcode_scanner: posRes.data.barcode_scanner || 'enabled'
        });
      }

      // Update backup settings
      if (backupRes.success && backupRes.data) {
        setBackupSettings({
          auto_backup: backupRes.data.auto_backup === true || backupRes.data.auto_backup === 'true',
          backup_frequency: backupRes.data.backup_frequency || 'daily',
          backup_retention_days: Number(backupRes.data.backup_retention_days) || 30,
          backup_location: backupRes.data.backup_location || 'cloud',
          last_backup: backupRes.data.last_backup
        });
      }

      // Update payment methods
      if (paymentRes.success && paymentRes.data) {
        setPaymentMethods(paymentRes.data);
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const saveStoreSettings = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/store', storeSettings);

      if (response.success) {
        toast.success('Cài đặt cửa hàng đã được lưu');
      } else {
        throw new Error(response.error || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving store settings:', error);
      toast.error('Không thể lưu cài đặt cửa hàng');
    } finally {
      setSaving(false);
    }
  };

  const saveTaxSettings = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/tax', taxSettings);

      if (response.success) {
        toast.success('Cài đặt thuế đã được lưu');
      } else {
        throw new Error(response.error || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving tax settings:', error);
      toast.error('Không thể lưu cài đặt thuế');
    } finally {
      setSaving(false);
    }
  };

  const saveInventorySettings = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/inventory', inventorySettings);

      if (response.success) {
        toast.success('Cài đặt kho hàng đã được lưu');
      } else {
        throw new Error(response.error || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving inventory settings:', error);
      toast.error('Không thể lưu cài đặt kho hàng');
    } finally {
      setSaving(false);
    }
  };

  const savePOSSettings = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/pos', posSettings);

      if (response.success) {
        toast.success('Cài đặt POS đã được lưu');
      } else {
        throw new Error(response.error || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving POS settings:', error);
      toast.error('Không thể lưu cài đặt POS');
    } finally {
      setSaving(false);
    }
  };

  const saveBackupSettings = async () => {
    try {
      setSaving(true);
      const response = await api.put('/settings/backup', backupSettings);

      if (response.success) {
        toast.success('Cài đặt sao lưu đã được lưu');
      } else {
        throw new Error(response.error || 'Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast.error('Không thể lưu cài đặt sao lưu');
    } finally {
      setSaving(false);
    }
  };

  const createBackup = async () => {
    try {
      setSaving(true);
      const response = await api.post('/settings/backup/create');

      if (response.success) {
        toast.success('Sao lưu đã được tạo thành công');
        loadAllSettings(); // Reload to get updated last backup time
      } else {
        throw new Error(response.error || 'Không thể tạo sao lưu');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Không thể tạo sao lưu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải cài đặt...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
            <p className="text-gray-600 mt-1">Quản lý cấu hình và tùy chỉnh hệ thống</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Cửa hàng
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Tài chính
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Kho hàng
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Bán hàng
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Sao lưu
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Thanh toán
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cửa hàng</CardTitle>
                <CardDescription>
                  Cấu hình thông tin cơ bản về cửa hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store-name">Tên cửa hàng</Label>
                    <Input
                      id="store-name"
                      value={storeSettings.name}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên cửa hàng"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-phone">Số điện thoại</Label>
                    <Input
                      id="store-phone"
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-email">Email</Label>
                    <Input
                      id="store-email"
                      type="email"
                      value={storeSettings.email}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-website">Website</Label>
                    <Input
                      id="store-website"
                      value={storeSettings.website}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Nhập website"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="store-address">Địa chỉ</Label>
                    <Input
                      id="store-address"
                      value={storeSettings.address}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Nhập địa chỉ cửa hàng"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">Mã số thuế</Label>
                    <Input
                      id="tax-id"
                      value={storeSettings.tax_id}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="Nhập mã số thuế"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                    <select
                      id="currency"
                      value={storeSettings.currency}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="VND">VND - Việt Nam Đồng</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="receipt-footer">Chân trang hóa đơn</Label>
                    <Input
                      id="receipt-footer"
                      value={storeSettings.receipt_footer}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, receipt_footer: e.target.value }))}
                      placeholder="Cảm ơn quý khách đã mua hàng!"
                    />
                  </div>
                </div>
                <Button onClick={saveStoreSettings} disabled={saving} className="w-full">
                  {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu cài đặt cửa hàng
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial/Tax Settings */}
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt tài chính & thuế</CardTitle>
                <CardDescription>
                  Cấu hình thuế VAT và thông tin tài chính
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax-rate">Thuế VAT (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      value={taxSettings.tax_rate}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                      placeholder="10"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="enable-vat"
                      checked={taxSettings.enable_vat}
                      onCheckedChange={(checked) => setTaxSettings(prev => ({ ...prev, enable_vat: checked }))}
                    />
                    <Label htmlFor="enable-vat">Bật thuế VAT</Label>
                  </div>
                  <div>
                    <Label htmlFor="tax-number">Mã số thuế</Label>
                    <Input
                      id="tax-number"
                      value={taxSettings.tax_number}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, tax_number: e.target.value }))}
                      placeholder="Nhập mã số thuế"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-address">Địa chỉ thuế</Label>
                    <Input
                      id="tax-address"
                      value={taxSettings.tax_address}
                      onChange={(e) => setTaxSettings(prev => ({ ...prev, tax_address: e.target.value }))}
                      placeholder="Nhập địa chỉ thuế"
                    />
                  </div>
                </div>
                <Button onClick={saveTaxSettings} disabled={saving} className="w-full">
                  {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu cài đặt tài chính
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Settings */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt kho hàng</CardTitle>
                <CardDescription>
                  Cấu hình quản lý tồn kho và cảnh báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="low-stock">Ngưỡng cảnh báo tồn kho thấp</Label>
                    <Input
                      id="low-stock"
                      type="number"
                      min="0"
                      value={inventorySettings.low_stock_threshold}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, low_stock_threshold: Number(e.target.value) }))}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="default-warehouse">Kho mặc định</Label>
                    <Input
                      id="default-warehouse"
                      value={inventorySettings.default_warehouse}
                      onChange={(e) => setInventorySettings(prev => ({ ...prev, default_warehouse: e.target.value }))}
                      placeholder="main"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-reorder"
                      checked={inventorySettings.auto_reorder}
                      onCheckedChange={(checked) => setInventorySettings(prev => ({ ...prev, auto_reorder: checked }))}
                    />
                    <Label htmlFor="auto-reorder">Tự động đặt hàng khi hết kho</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="track-serial"
                      checked={inventorySettings.track_serial_numbers}
                      onCheckedChange={(checked) => setInventorySettings(prev => ({ ...prev, track_serial_numbers: checked }))}
                    />
                    <Label htmlFor="track-serial">Theo dõi số serial</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="track-batches"
                      checked={inventorySettings.track_batches}
                      onCheckedChange={(checked) => setInventorySettings(prev => ({ ...prev, track_batches: checked }))}
                    />
                    <Label htmlFor="track-batches">Theo dõi lô hàng</Label>
                  </div>
                </div>
                <Button onClick={saveInventorySettings} disabled={saving} className="w-full">
                  {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu cài đặt kho hàng
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POS Settings */}
          <TabsContent value="pos">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt điểm bán hàng</CardTitle>
                <CardDescription>
                  Cấu hình hệ thống bán hàng và thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default-payment">Phương thức thanh toán mặc định</Label>
                    <select
                      id="default-payment"
                      value={posSettings.default_payment_method}
                      onChange={(e) => setPosSettings(prev => ({ ...prev, default_payment_method: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="CASH">Tiền mặt</option>
                      <option value="TRANSFER">Chuyển khoản</option>
                      <option value="CREDIT_CARD">Thẻ tín dụng</option>
                      <option value="E_WALLET">Ví điện tử</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="receipt-printer">Máy in hóa đơn</Label>
                    <Input
                      id="receipt-printer"
                      value={posSettings.receipt_printer}
                      onChange={(e) => setPosSettings(prev => ({ ...prev, receipt_printer: e.target.value }))}
                      placeholder="default"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-print"
                      checked={posSettings.auto_print_receipt}
                      onCheckedChange={(checked) => setPosSettings(prev => ({ ...prev, auto_print_receipt: checked }))}
                    />
                    <Label htmlFor="auto-print">Tự động in hóa đơn</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="customer-display"
                      checked={posSettings.show_customer_display}
                      onCheckedChange={(checked) => setPosSettings(prev => ({ ...prev, show_customer_display: checked }))}
                    />
                    <Label htmlFor="customer-display">Hiển thị màn hình khách hàng</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require-customer"
                      checked={posSettings.require_customer_info}
                      onCheckedChange={(checked) => setPosSettings(prev => ({ ...prev, require_customer_info: checked }))}
                    />
                    <Label htmlFor="require-customer">Yêu cầu thông tin khách hàng</Label>
                  </div>
                </div>
                <Button onClick={savePOSSettings} disabled={saving} className="w-full">
                  {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu cài đặt POS
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt sao lưu</CardTitle>
                <CardDescription>
                  Cấu hình sao lưu dữ liệu tự động
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backup-frequency">Tần suất sao lưu</Label>
                    <select
                      id="backup-frequency"
                      value={backupSettings.backup_frequency}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_frequency: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="hourly">Hằng giờ</option>
                      <option value="daily">Hằng ngày</option>
                      <option value="weekly">Hằng tuần</option>
                      <option value="monthly">Hằng tháng</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="retention-days">Số ngày lưu trữ</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      min="1"
                      value={backupSettings.backup_retention_days}
                      onChange={(e) => setBackupSettings(prev => ({ ...prev, backup_retention_days: Number(e.target.value) }))}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-backup"
                      checked={backupSettings.auto_backup}
                      onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, auto_backup: checked }))}
                    />
                    <Label htmlFor="auto-backup">Tự động sao lưu</Label>
                  </div>
                </div>
                {backupSettings.last_backup && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Sao lưu gần nhất: {new Date(backupSettings.last_backup).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={saveBackupSettings} disabled={saving} className="flex-1">
                    {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu cài đặt sao lưu
                  </Button>
                  <Button onClick={createBackup} disabled={saving} variant="outline">
                    {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                    Tạo sao lưu ngay
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
                <CardDescription>
                  Quản lý các phương thức thanh toán được hỗ trợ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="font-medium">{method.name}</span>
                          <div className="text-sm text-gray-500">{method.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Hoạt động</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Không hoạt động</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default SettingsNew;
