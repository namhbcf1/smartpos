import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Autocomplete,
  Paper,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { api } from '../services/api';

interface Province {
  id: string;
  name: string;
  type: string;
}

// REMOVED: District interface - không cần nữa
// interface District { ... }

interface Ward {
  id: string;
  name: string;
  district_name: string;
  display_name?: string; // Hiển thị: "Phường X (Quận Y)"
  type: string;
}

interface AddressFormProps {
  onAddressChange?: (address: AddressData) => void;
  initialData?: Partial<AddressData>;
  title?: string;
  showValidation?: boolean;
}

export interface AddressData {
  fullName: string;
  phone: string;
  address: string;
  house_number?: string;
  hamlet?: string; // tổ/thôn/ấp/xóm
  province: Province | null;
  // district: District | null; // REMOVED
  district_name: string; // Lấy từ ward.district_name
  ward: Ward | null;
  province_id: string;
  // district_id: string; // REMOVED
  ward_id: string;
  full_address: string;
}

const AddressForm: React.FC<AddressFormProps> = ({
  onAddressChange,
  initialData,
  title = "Thông tin địa chỉ giao hàng",
  showValidation = true
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  // const [districts, setDistricts] = useState<District[]>([]); // REMOVED
  const [wards, setWards] = useState<Ward[]>([]);

  const [loading, setLoading] = useState({
    provinces: false,
    wards: false
  });

  const [addressData, setAddressData] = useState<AddressData>({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    house_number: initialData?.house_number || '',
    hamlet: initialData?.hamlet || '',
    province: initialData?.province || null,
    // district: initialData?.district || null, // REMOVED
    district_name: initialData?.district_name || '', // Lấy từ ward
    ward: initialData?.ward || null,
    province_id: initialData?.province_id || '',
    // district_id: initialData?.district_id || '', // REMOVED
    ward_id: initialData?.ward_id || '',
    full_address: ''
  });
  
  const [validation, setValidation] = useState({
    valid: false,
    errors: [] as string[]
  });

  const [typingTimer, setTypingTimer] = useState<number | undefined>(undefined);
  // Structured address helpers
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [hamlet, setHamlet] = useState<string>('');

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Update full address when components change (with debounce)
  useEffect(() => {
    window.clearTimeout(typingTimer);
    const id = window.setTimeout(() => {
      const fullAddress = [
        houseNumber,
        hamlet,
        addressData.address,
        addressData.ward?.name,
        addressData.district_name,
        addressData.province?.name
      ].filter((v) => !!(v && String(v).trim())).join(', ');

      const updatedData = {
        ...addressData,
        house_number: houseNumber,
        hamlet: hamlet,
        full_address: fullAddress
      };

      setAddressData(updatedData);

      if (onAddressChange) {
        onAddressChange(updatedData);
      }

      validateAddress(updatedData);
    }, 300);

    setTypingTimer(id);

    return () => {
      window.clearTimeout(id);
    };
  }, [addressData.province, addressData.district_name, addressData.ward, addressData.address, addressData.fullName, addressData.phone, houseNumber, hamlet]);

  const loadProvinces = async () => {
    try {
      setLoading(prev => ({ ...prev, provinces: true }));
      const response = await api.get('/shipping/geo/provinces');
      console.log('Provinces API response:', response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        setProvinces(response.data.data);
        console.log('Provinces loaded:', response.data.data);
      } else {
        console.error('Invalid provinces data format:', response.data);
        setProvinces([]);
      }
    } catch (error: any) {
      console.error('Failed to load provinces:', error);
      const status = error?.response?.status;

      if (status === 401) {
        console.warn('⚠️ Geo API requires authentication - this should be public!');
        // Still set empty to show proper message
        setProvinces([]);
      } else if (status === 404) {
        console.error('❌ Geo API endpoint not found');
        setProvinces([]);
      } else {
        // Network or other errors
        console.error('❌ Network or server error loading provinces');
        setProvinces([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  // REMOVED: loadDistricts - không cần nữa theo chuẩn GHTK mới

  // Load wards trực tiếp từ provinceId (bỏ qua districtId)
  const loadWards = async (provinceId: string) => {
    if (!provinceId) {
      setWards([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, wards: true }));
      console.log('Loading ALL wards for province:', provinceId);
      const response = await api.get(`/shipping/geo/wards-by-province/${provinceId}`);
      console.log('Wards response:', response.data);

      if (response.data.success && Array.isArray(response.data.data)) {
        setWards(response.data.data);
        console.log(`✅ Loaded ${response.data.total} wards for province ${provinceId}`);
      } else {
        console.error('Invalid wards data format:', response.data);
        setWards([]);
      }
    } catch (error: any) {
      console.error('Failed to load wards:', error);
      const status = error?.response?.status;

      if (status === 401) {
        console.warn('⚠️ Geo API requires authentication for wards');
      } else if (status === 404) {
        console.error('❌ Wards not found for province:', provinceId);
      } else {
        console.error('❌ Error loading wards');
      }
      setWards([]);
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  };

  const validateAddress = async (data: AddressData) => {
    if (!showValidation) return;

    const errors: string[] = [];

    if (!data.fullName.trim()) errors.push('Vui lòng nhập họ tên');
    if (!data.phone.trim()) errors.push('Vui lòng nhập số điện thoại');
    if (!data.address.trim()) errors.push('Vui lòng nhập địa chỉ chi tiết');
    if (!data.province) errors.push('Vui lòng chọn tỉnh/thành phố');
    if (!data.ward) errors.push('Vui lòng chọn phường/xã');

    const phoneRegex = /^[0-9]{10,11}$/;
    if (data.phone && !phoneRegex.test(data.phone.replace(/[^\d]/g, ''))) {
      errors.push('Số điện thoại không hợp lệ');
    }

    setValidation({
      valid: errors.length === 0,
      errors
    });
  };

  const handleProvinceChange = (province: Province | null) => {
    setAddressData(prev => ({
      ...prev,
      province,
      province_id: province?.id || '',
      district_name: '',
      ward: null,
      ward_id: ''
    }));

    if (province) {
      loadWards(province.id);
    } else {
      setWards([]);
    }
  };

  const handleWardChange = (ward: Ward | null) => {
    setAddressData(prev => ({
      ...prev,
      ward,
      ward_id: ward?.id || '',
      district_name: ward?.district_name || ''
    }));
  };

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Paper sx={{ 
      p: 6, 
      mb: 6, 
      borderRadius: 4, 
      boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid rgba(59, 130, 246, 0.1)'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 5,
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white'
      }}>
        <LocationIcon sx={{ mr: 3, fontSize: 36, color: 'white' }} />
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: 'white' }}>
          {title}
        </Typography>
      </Box>

      <Grid container spacing={5}>
        {/* Họ tên */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Họ và tên người nhận"
            value={addressData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="Nhập họ và tên đầy đủ"
            required
            error={validation.errors.includes('Vui lòng nhập họ tên')}
            helperText={validation.errors.includes('Vui lòng nhập họ tên') ? 'Vui lòng nhập họ tên' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '18px',
                height: '64px',
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: validation.errors.includes('Vui lòng nhập họ tên') ? '#ef4444' : '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: validation.errors.includes('Vui lòng nhập họ tên') ? '#dc2626' : '#3b82f6',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: 3,
                  borderColor: validation.errors.includes('Vui lòng nhập họ tên') ? '#dc2626' : '#3b82f6',
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px',
                fontWeight: 600,
                color: '#64748b',
                '&.Mui-focused': {
                  color: validation.errors.includes('Vui lòng nhập họ tên') ? '#dc2626' : '#3b82f6',
                }
              },
              '& .MuiFormHelperText-root': {
                fontSize: '14px',
                fontWeight: 500,
                marginTop: 1
              }
            }}
          />
        </Grid>

        {/* Số điện thoại */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Số điện thoại"
            value={addressData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Nhập số điện thoại"
            required
            error={validation.errors.includes('Số điện thoại không hợp lệ') || validation.errors.includes('Vui lòng nhập số điện thoại')}
            helperText={
              validation.errors.includes('Số điện thoại không hợp lệ') 
                ? 'Số điện thoại không hợp lệ' 
                : validation.errors.includes('Vui lòng nhập số điện thoại')
                ? 'Vui lòng nhập số điện thoại'
                : ''
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '18px',
                height: '64px',
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: (validation.errors.includes('Số điện thoại không hợp lệ') || validation.errors.includes('Vui lòng nhập số điện thoại')) ? '#ef4444' : '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: (validation.errors.includes('Số điện thoại không hợp lệ') || validation.errors.includes('Vui lòng nhập số điện thoại')) ? '#dc2626' : '#3b82f6',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: 3,
                  borderColor: (validation.errors.includes('Số điện thoại không hợp lệ') || validation.errors.includes('Vui lòng nhập số điện thoại')) ? '#dc2626' : '#3b82f6',
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px',
                fontWeight: 600,
                color: '#64748b',
                '&.Mui-focused': {
                  color: (validation.errors.includes('Số điện thoại không hợp lệ') || validation.errors.includes('Vui lòng nhập số điện thoại')) ? '#dc2626' : '#3b82f6',
                }
              },
              '& .MuiFormHelperText-root': {
                fontSize: '14px',
                fontWeight: 500,
                marginTop: 1
              }
            }}
          />
        </Grid>

        {/* Số nhà */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Số nhà (bắt buộc nếu có)"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="VD: Số 399"
          />
        </Grid>

        {/* Tổ/Thôn/Ấp/Xóm */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Tổ/Thôn/Ấp/Xóm *"
            value={hamlet}
            onChange={(e) => setHamlet(e.target.value)}
            placeholder="VD: Tổ 1 / Ấp 3 / Xóm 2"
            required
            helperText="Bắt buộc cho GHTK - nhập tổ/thôn/ấp/xóm của bạn"
            error={showValidation && !hamlet.trim()}
          />
        </Grid>

        {/* Địa chỉ chi tiết */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Địa chỉ chi tiết"
            value={addressData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Số nhà, tên đường, tên khu phố..."
            required
            error={validation.errors.includes('Vui lòng nhập địa chỉ chi tiết')}
            helperText={validation.errors.includes('Vui lòng nhập địa chỉ chi tiết') ? 'Vui lòng nhập địa chỉ chi tiết' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '18px',
                height: '64px',
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: validation.errors.includes('Vui lòng nhập địa chỉ chi tiết') ? '#ef4444' : '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: validation.errors.includes('Vui lòng nhập địa chỉ chi tiết') ? '#dc2626' : '#3b82f6',
                },
                '&.Mui-focused fieldset': {
                  borderWidth: 3,
                  borderColor: validation.errors.includes('Vui lòng nhập địa chỉ chi tiết') ? '#dc2626' : '#3b82f6',
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '16px',
                fontWeight: 600,
                color: '#64748b',
                '&.Mui-focused': {
                  color: validation.errors.includes('Vui lòng nhập địa chỉ chi tiết') ? '#dc2626' : '#3b82f6',
                }
              },
              '& .MuiFormHelperText-root': {
                fontSize: '14px',
                fontWeight: 500,
                marginTop: 1
              }
            }}
          />
        </Grid>

        {/* Tỉnh/Thành phố */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required error={validation.errors.includes('Vui lòng chọn tỉnh/thành phố')}>
            <InputLabel sx={{ 
              fontSize: '16px', 
              fontWeight: 600,
              color: '#64748b',
              '&.Mui-focused': {
                color: validation.errors.includes('Vui lòng chọn tỉnh/thành phố') ? '#dc2626' : '#3b82f6',
              }
            }}>
              🏛️ Tỉnh/Thành phố
            </InputLabel>
            <Select
              value={addressData.province_id}
              onChange={(e) => {
                const province = provinces.find(p => p.id === e.target.value);
                handleProvinceChange(province || null);
              }}
              label="🏛️ Tỉnh/Thành phố"
              disabled={loading.provinces}
              sx={{
                height: '64px',
                fontSize: '18px',
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                  borderColor: validation.errors.includes('Vui lòng chọn tỉnh/thành phố') ? '#ef4444' : '#e2e8f0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: validation.errors.includes('Vui lòng chọn tỉnh/thành phố') ? '#dc2626' : '#3b82f6',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 3,
                  borderColor: validation.errors.includes('Vui lòng chọn tỉnh/thành phố') ? '#dc2626' : '#3b82f6',
                },
              }}
            >
              {loading.provinces ? (
                <MenuItem disabled sx={{ fontSize: '18px', py: 3 }}>
                  <CircularProgress size={28} sx={{ mr: 3 }} />
                  Đang tải...
                </MenuItem>
              ) : Array.isArray(provinces) && provinces.length > 0 ? (
                provinces.map((province) => (
                  <MenuItem key={province.id} value={province.id} sx={{ fontSize: '18px', py: 3 }}>
                    {province.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled sx={{ fontSize: '18px', py: 3 }}>
                  Không có dữ liệu tỉnh/thành phố
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Phường/Xã */}
        <Grid item xs={12} md={6}>
          {(!loading.wards && Array.isArray(wards) && wards.length === 0 && addressData.province) ? (
            <TextField
              fullWidth
              label="🏠 Phường/Xã (nhập tay)"
              value={addressData.ward?.name || ''}
              onChange={(e) => handleWardChange({ id: 'manual', name: e.target.value, district_name: '', type: 'Ward' })}
              placeholder="Ví dụ: Phường Hồng Bàng"
              required
              error={validation.errors.includes('Vui lòng chọn phường/xã')}
              helperText={validation.errors.includes('Vui lòng chọn phường/xã') ? 'Vui lòng nhập phường/xã' : ''}
            />
          ) : (
            <FormControl fullWidth required error={validation.errors.includes('Vui lòng chọn phường/xã')}>
              <InputLabel sx={{ 
                fontSize: '16px', 
                fontWeight: 600,
                color: '#64748b',
                '&.Mui-focused': {
                  color: validation.errors.includes('Vui lòng chọn phường/xã') ? '#dc2626' : '#3b82f6',
                }
              }}>
                🏠 Phường/Xã
              </InputLabel>
              <Select
                value={addressData.ward_id}
                onChange={(e) => {
                  const ward = wards.find(w => w.id === e.target.value);
                  handleWardChange(ward || null);
                }}
                label="🏠 Phường/Xã"
                disabled={!addressData.province || loading.wards}
                sx={{
                  height: '64px',
                  fontSize: '18px',
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                    borderColor: validation.errors.includes('Vui lòng chọn phường/xã') ? '#ef4444' : '#e2e8f0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: validation.errors.includes('Vui lòng chọn phường/xã') ? '#dc2626' : '#3b82f6',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 3,
                    borderColor: validation.errors.includes('Vui lòng chọn phường/xã') ? '#dc2626' : '#3b82f6',
                  },
                }}
              >
                {loading.wards ? (
                  <MenuItem disabled sx={{ fontSize: '18px', py: 3 }}>
                    <CircularProgress size={28} sx={{ mr: 3 }} />
                    Đang tải...
                  </MenuItem>
                ) : Array.isArray(wards) && wards.length > 0 ? (
                  wards.map((ward) => (
                    <MenuItem key={ward.id} value={ward.id} sx={{ fontSize: '16px', py: 2 }}>
                      {ward.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled sx={{ fontSize: '18px', py: 3 }}>
                    {addressData.province ? 'Chọn tỉnh/thành phố trước' : 'Chưa chọn tỉnh/thành phố'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
        </Grid>

        {/* Địa chỉ đầy đủ */}
        {addressData.full_address && (
          <Grid item xs={12}>
            <Divider sx={{ my: 4 }} />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white'
            }}>
              <CheckCircleIcon sx={{ mr: 3, color: 'white', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                ✅ Địa chỉ đầy đủ
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ 
              p: 4, 
              bgcolor: 'rgba(16, 185, 129, 0.1)', 
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#065f46',
              lineHeight: 1.6
            }}>
              📍 {addressData.full_address}
            </Typography>
          </Grid>
        )}

        {/* Validation Status */}
        {showValidation && (
          <Grid item xs={12}>
            {validation.valid ? (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon sx={{ fontSize: 32 }} />}
                sx={{ 
                  fontSize: '18px',
                  py: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: 'white'
                  },
                  '& .MuiAlert-message': {
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'white'
                  }
                }}
              >
                🎉 Địa chỉ hợp lệ và đầy đủ thông tin!
              </Alert>
            ) : validation.errors.length > 0 ? (
              <Alert 
                severity="error"
                sx={{ 
                  fontSize: '18px',
                  py: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: 'white'
                  },
                  '& .MuiAlert-message': {
                    fontSize: '18px',
                    color: 'white'
                  }
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'white' }}>
                  ⚠️ Vui lòng kiểm tra lại thông tin:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 24, fontSize: '16px', color: 'white' }}>
                  {validation.errors.map((error, index) => (
                    <li key={index} style={{ marginBottom: '12px', fontWeight: 500 }}>{error}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default AddressForm;
