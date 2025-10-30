// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Divider,
  Paper,
  Grid,
  Autocomplete,
  Switch,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  LocalShipping,
  Info as InfoIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import CustomerDetailsDrawer from '../../components/customers/CustomerDetailsDrawer';

const GHTKOrderCreate: React.FC = () => {
  const navigate = useNavigate();

  const [receiverData, setReceiverData] = useState({
    phone: '',
    fullName: '',
    street: '', // Tên đường (VD: Trần Hưng Đạo)
    hamlet: '', // Tổ/Thôn/Ấp/Xóm
    provinceId: '',
    // districtId: '', // REMOVED - theo chuẩn GHTK mới không cần ID của Quận/Huyện
    districtName: '', // Thêm districtName - lấy từ ward.district_name
    wardId: ''
  });

  const [productData, setProductData] = useState({
    name: '',
    weight: 0,
    quantity: 1,
    codAmount: 0,
    productValue: 0
  });

  const [shippingOptions, setShippingOptions] = useState({
    transport: 'express',
    pickupOption: 'pickup',
    pickupLocation: '407 Trần Hưng Đạo, Tổ 10, Phường Phương Lâm, Hòa Bình'
  });

  const [pickAddresses, setPickAddresses] = useState<any[]>([]);
  const [defaultPickId, setDefaultPickId] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<any[]>([]);
  // const [districts, setDistricts] = useState<any[]>([]); // REMOVED - không cần Quận/Huyện
  const [wards, setWards] = useState<any[]>([]);
  const [streets, setStreets] = useState<string[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [feeEstimate, setFeeEstimate] = useState<any>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [sourceAddress, setSourceAddress] = useState('');
  const [openCustomerDrawer, setOpenCustomerDrawer] = useState(false);
  const [openProductSelector, setOpenProductSelector] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const streetPickTimer = React.useRef<any>(null);
  const provincePickTimer = React.useRef<any>(null);
  // const districtPickTimer = React.useRef<any>(null); // REMOVED - không cần auto-pick district
  const wardPickTimer = React.useRef<any>(null);
  const housePickTimer = React.useRef<any>(null);

  // REMOVED: Fallback auto-select district - không cần nữa vì bỏ Quận/Huyện
  // useEffect(() => { ... }, [districts]);

  // Fallback auto-select after lists load (ward)
  // Sửa: Check provinceId thay vì districtId
  useEffect(() => {
    const addr = (receiverData as any).address || '';
    if (wardPickTimer.current) { clearTimeout(wardPickTimer.current); wardPickTimer.current = null; }
    if (!addr || !receiverData.provinceId || receiverData.wardId || wards.length === 0) return;
    const lower = (addr as string).toLowerCase();
    wardPickTimer.current = setTimeout(() => {
      const match = wards.find((w: any) => lower.includes((w.name || '').toLowerCase()));
      if (match) setReceiverData(prev => ({ ...prev, wardId: String(match.id) }));
    }, 2000);
  }, [wards]);
  
  // Policy states
  const [deliveryPolicy, setDeliveryPolicy] = useState({
    saveForNext: false,
    viewGoods: true,
    callShopWhenFail: false,
    partialDeliverySelect: false,
    partialDeliveryExchange: true,
    recalledProducts: false,
    partialDeliveryDocuments: false,
    chargeWhenUndeliverable: false,
    undeliverableFee: 0
  });
  
  const [returnPolicy, setReturnPolicy] = useState({
    saveForNext: false,
    sameDayReturn: false,
    autoStoreCheck: true,
    noStoreReturn: false,
    noAcceptReturn: false,
    callShopBeforeReturn: false,
    returnConfirmation: false,
    returnAtPostOffice: false,
    needShopConfirmation: false,
    returnAddress: '415 Trần Hưng Đạo, Tổ 10, Phường Phương Lâm, Hòa Bình'
  });
  
  const [pickupPolicy, setPickupPolicy] = useState({
    saveForNext: false,
    callShopBeforePickup: false,
    coCheckPickup: false,
    pickupAddress: '415 Trần Hưng Đạo, Tổ 10, Phường Phương Lâm, Hòa Bình'
  });
  

  // Debug log để kiểm tra state
  useEffect(() => {
    console.log('🔍 Current receiverData:', receiverData);
  }, [receiverData]);

  // Function to parse Vietnamese address and find geographic IDs
  const parseAddressAndFindIds = async (address: string) => {
    if (!address) return;

    try {
      setIsAutoFilling(true);
      console.log('🔍 Parsing address:', address);
      
      // Parse address components using Vietnamese address patterns
      const addressLower = address.toLowerCase();
      
      // Extract province (tỉnh/thành phố)
      let provinceName = '';
      if (addressLower.includes('hà nội')) provinceName = 'Hà Nội';
      else if (addressLower.includes('hồ chí minh') || addressLower.includes('tp.hcm')) provinceName = 'TP. Hồ Chí Minh';
      else if (addressLower.includes('đà nẵng')) provinceName = 'Đà Nẵng';
      else if (addressLower.includes('hải phòng')) provinceName = 'Hải Phòng';
      else if (addressLower.includes('cần thơ')) provinceName = 'Cần Thơ';
      else if (addressLower.includes('an giang')) provinceName = 'An Giang';
      else if (addressLower.includes('bà rịa - vũng tàu')) provinceName = 'Bà Rịa - Vũng Tàu';
      else if (addressLower.includes('bắc giang')) provinceName = 'Bắc Giang';
      else if (addressLower.includes('bắc kạn')) provinceName = 'Bắc Kạn';
      else if (addressLower.includes('bạc liêu')) provinceName = 'Bạc Liêu';
      else if (addressLower.includes('bắc ninh')) provinceName = 'Bắc Ninh';
      else if (addressLower.includes('bến tre')) provinceName = 'Bến Tre';
      else if (addressLower.includes('bình định')) provinceName = 'Bình Định';
      else if (addressLower.includes('bình dương')) provinceName = 'Bình Dương';
      else if (addressLower.includes('bình phước')) provinceName = 'Bình Phước';
      else if (addressLower.includes('bình thuận')) provinceName = 'Bình Thuận';
      else if (addressLower.includes('cà mau')) provinceName = 'Cà Mau';
      else if (addressLower.includes('cao bằng')) provinceName = 'Cao Bằng';
      else if (addressLower.includes('đắk lắk')) provinceName = 'Đắk Lắk';
      else if (addressLower.includes('đắk nông')) provinceName = 'Đắk Nông';
      else if (addressLower.includes('điện biên')) provinceName = 'Điện Biên';
      else if (addressLower.includes('đồng nai')) provinceName = 'Đồng Nai';
      else if (addressLower.includes('đồng tháp')) provinceName = 'Đồng Tháp';
      else if (addressLower.includes('gia lai')) provinceName = 'Gia Lai';
      else if (addressLower.includes('hà giang')) provinceName = 'Hà Giang';
      else if (addressLower.includes('hà nam')) provinceName = 'Hà Nam';
      else if (addressLower.includes('hà tĩnh')) provinceName = 'Hà Tĩnh';
      else if (addressLower.includes('hải dương')) provinceName = 'Hải Dương';
      else if (addressLower.includes('hậu giang')) provinceName = 'Hậu Giang';
      else if (addressLower.includes('hòa bình')) provinceName = 'Hòa Bình';
      else if (addressLower.includes('hưng yên')) provinceName = 'Hưng Yên';
      else if (addressLower.includes('khánh hòa')) provinceName = 'Khánh Hòa';
      else if (addressLower.includes('kiên giang')) provinceName = 'Kiên Giang';
      else if (addressLower.includes('kon tum')) provinceName = 'Kon Tum';
      else if (addressLower.includes('lai châu')) provinceName = 'Lai Châu';
      else if (addressLower.includes('lâm đồng')) provinceName = 'Lâm Đồng';
      else if (addressLower.includes('lạng sơn')) provinceName = 'Lạng Sơn';
      else if (addressLower.includes('lào cai')) provinceName = 'Lào Cai';
      else if (addressLower.includes('long an')) provinceName = 'Long An';
      else if (addressLower.includes('nam định')) provinceName = 'Nam Định';
      else if (addressLower.includes('nghệ an')) provinceName = 'Nghệ An';
      else if (addressLower.includes('ninh bình')) provinceName = 'Ninh Bình';
      else if (addressLower.includes('ninh thuận')) provinceName = 'Ninh Thuận';
      else if (addressLower.includes('phú thọ')) provinceName = 'Phú Thọ';
      else if (addressLower.includes('phú yên')) provinceName = 'Phú Yên';
      else if (addressLower.includes('quảng bình')) provinceName = 'Quảng Bình';
      else if (addressLower.includes('quảng nam')) provinceName = 'Quảng Nam';
      else if (addressLower.includes('quảng ngãi')) provinceName = 'Quảng Ngãi';
      else if (addressLower.includes('quảng ninh')) provinceName = 'Quảng Ninh';
      else if (addressLower.includes('quảng trị')) provinceName = 'Quảng Trị';
      else if (addressLower.includes('sóc trăng')) provinceName = 'Sóc Trăng';
      else if (addressLower.includes('sơn la')) provinceName = 'Sơn La';
      else if (addressLower.includes('tây ninh')) provinceName = 'Tây Ninh';
      else if (addressLower.includes('thái bình')) provinceName = 'Thái Bình';
      else if (addressLower.includes('thái nguyên')) provinceName = 'Thái Nguyên';
      else if (addressLower.includes('thanh hóa')) provinceName = 'Thanh Hóa';
      else if (addressLower.includes('thừa thiên huế')) provinceName = 'Thừa Thiên Huế';
      else if (addressLower.includes('tiền giang')) provinceName = 'Tiền Giang';
      else if (addressLower.includes('trà vinh')) provinceName = 'Trà Vinh';
      else if (addressLower.includes('tuyên quang')) provinceName = 'Tuyên Quang';
      else if (addressLower.includes('vĩnh long')) provinceName = 'Vĩnh Long';
      else if (addressLower.includes('vĩnh phúc')) provinceName = 'Vĩnh Phúc';
      else if (addressLower.includes('yên bái')) provinceName = 'Yên Bái';

      if (!provinceName) {
        console.log('❌ Could not identify province from address');
        return;
      }

      console.log('📍 Identified province:', provinceName);

      // Get provinces and find the matching one
      const provincesRes = await api.get('/shipping/geo/provinces');
      const provincesData = provincesRes.data;
      
      if (!provincesData.success) {
        console.error('❌ Failed to fetch provinces');
        return;
      }

      const province = provincesData.data.find((p: any) => 
        p.name.toLowerCase().includes(provinceName.toLowerCase()) ||
        provinceName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (!province) {
        console.error('❌ Province not found:', provinceName);
        return;
      }

      console.log('✅ Found province:', province);

      // Extract district (huyện/quận)
      let districtName = '';
      if (addressLower.includes('đông anh')) districtName = 'Đông Anh';
      else if (addressLower.includes('cầu giấy')) districtName = 'Cầu Giấy';
      else if (addressLower.includes('đống đa')) districtName = 'Đống Đa';
      else if (addressLower.includes('hai bà trưng')) districtName = 'Hai Bà Trưng';
      else if (addressLower.includes('hoàn kiếm')) districtName = 'Hoàn Kiếm';
      else if (addressLower.includes('hoàng mai')) districtName = 'Hoàng Mai';
      else if (addressLower.includes('long biên')) districtName = 'Long Biên';
      else if (addressLower.includes('tây hồ')) districtName = 'Tây Hồ';
      else if (addressLower.includes('thanh xuân')) districtName = 'Thanh Xuân';
      else if (addressLower.includes('sóc sơn')) districtName = 'Sóc Sơn';
      else if (addressLower.includes('gia lâm')) districtName = 'Gia Lâm';
      else if (addressLower.includes('mê linh')) districtName = 'Mê Linh';
      else if (addressLower.includes('hà đông')) districtName = 'Hà Đông';
      else if (addressLower.includes('sơn tây')) districtName = 'Sơn Tây';
      else if (addressLower.includes('ba vì')) districtName = 'Ba Vì';
      else if (addressLower.includes('chương mỹ')) districtName = 'Chương Mỹ';
      else if (addressLower.includes('đan phượng')) districtName = 'Đan Phượng';
      else if (addressLower.includes('hoài đức')) districtName = 'Hoài Đức';
      else if (addressLower.includes('mỹ đức')) districtName = 'Mỹ Đức';
      else if (addressLower.includes('phú xuyên')) districtName = 'Phú Xuyên';
      else if (addressLower.includes('phúc thọ')) districtName = 'Phúc Thọ';
      else if (addressLower.includes('quốc oai')) districtName = 'Quốc Oai';
      else if (addressLower.includes('thạch thất')) districtName = 'Thạch Thất';
      else if (addressLower.includes('thanh oai')) districtName = 'Thanh Oai';
      else if (addressLower.includes('thanh trì')) districtName = 'Thanh Trì';
      else if (addressLower.includes('thường tín')) districtName = 'Thường Tín';
      else if (addressLower.includes('ứng hòa')) districtName = 'Ứng Hòa';

      // If districtName not identified, we will fallback to fuzzy matching below
      if (!districtName) {
        console.log('⚠️ District name not explicitly found. Will try fuzzy match.');
      }

      console.log('📍 Identified district:', districtName);

      // Get districts for the province
      const districtsRes = await api.get(`/shipping/geo/districts/${province.id}`);
      const districtsData = districtsRes.data;
      
      if (!districtsData.success) {
        console.error('❌ Failed to fetch districts');
        return;
      }

      let district = null as any;
      if (districtName) {
        district = districtsData.data.find((d: any) => 
          d.name.toLowerCase().includes(districtName.toLowerCase()) ||
          districtName.toLowerCase().includes(d.name.toLowerCase())
        );
      }
      if (!district) {
        district = districtsData.data.find((d: any) => (d.name || '').toLowerCase() && addressLower.includes((d.name || '').toLowerCase()));
      }

      if (!district) {
        console.error('❌ District not found:', districtName);
        return;
      }

      console.log('✅ Found district:', district);

      // Extract ward (phường/xã)
      let wardName = '';
      if (addressLower.includes('kim nỗ')) wardName = 'Kim Nỗ';
      else if (addressLower.includes('kim chung')) wardName = 'Kim Chung';
      else if (addressLower.includes('kim hạ')) wardName = 'Kim Hạ';
      else if (addressLower.includes('kim lũ')) wardName = 'Kim Lũ';
      else if (addressLower.includes('kim sơn')) wardName = 'Kim Sơn';
      else if (addressLower.includes('kim trung')) wardName = 'Kim Trung';
      else if (addressLower.includes('kim xá')) wardName = 'Kim Xá';
      else if (addressLower.includes('kim an')) wardName = 'Kim An';
      else if (addressLower.includes('kim đồng')) wardName = 'Kim Đồng';
      else if (addressLower.includes('kim giang')) wardName = 'Kim Giang';
      else if (addressLower.includes('kim liên')) wardName = 'Kim Liên';
      else if (addressLower.includes('kim mã')) wardName = 'Kim Mã';
      else if (addressLower.includes('kim ngưu')) wardName = 'Kim Ngưu';
      else if (addressLower.includes('kim quang')) wardName = 'Kim Quang';
      else if (addressLower.includes('kim thạch')) wardName = 'Kim Thạch';
      else if (addressLower.includes('kim thư')) wardName = 'Kim Thư';
      else if (addressLower.includes('kim tiến')) wardName = 'Kim Tiến';
      else if (addressLower.includes('kim toàn')) wardName = 'Kim Toàn';
      else if (addressLower.includes('kim văn')) wardName = 'Kim Văn';
      else if (addressLower.includes('kim vinh')) wardName = 'Kim Vinh';

      // If wardName not identified, we will fallback to fuzzy matching below
      if (!wardName) {
        console.log('⚠️ Ward name not explicitly found. Will try fuzzy match.');
      }

      console.log('📍 Identified ward:', wardName);

      // Get wards for the district
      const wardsRes = await api.get(`/shipping/geo/wards/${district.id}`);
      const wardsData = wardsRes.data;
      
      if (!wardsData.success) {
        console.error('❌ Failed to fetch wards');
        return;
      }

      let ward = null as any;
      if (wardName) {
        ward = wardsData.data.find((w: any) => 
          w.name.toLowerCase().includes(wardName.toLowerCase()) ||
          wardName.toLowerCase().includes(w.name.toLowerCase())
        );
      }
      if (!ward) {
        ward = wardsData.data.find((w: any) => (w.name || '').toLowerCase() && addressLower.includes((w.name || '').toLowerCase()));
      }

      if (!ward) {
        console.error('❌ Ward not found:', wardName);
        return;
      }

      console.log('✅ Found ward:', ward);

      // Extract street/hamlet/area (đường/ấp/khu)
      let streetName = '';
      let hamletName = '';
      if (addressLower.includes('xóm bến')) streetName = 'Xóm Bến';
      else if (addressLower.includes('đường')) {
        const streetMatch = addressLower.match(/đường\s+([^,\s]+)/);
        if (streetMatch) streetName = streetMatch[1];
      } else if (addressLower.includes('phố')) {
        const streetMatch = addressLower.match(/phố\s+([^,\s]+)/);
        if (streetMatch) streetName = streetMatch[1];
      } else if (addressLower.includes('khu')) {
        const streetMatch = addressLower.match(/khu\s+([^,\s]+)/);
        if (streetMatch) streetName = streetMatch[1];
      } else if (addressLower.includes('ấp')) {
        const streetMatch = addressLower.match(/ấp\s+([^,\s]+)/);
        if (streetMatch) streetName = streetMatch[1];
      }

      // Try detect hamlet keywords
      const hamletMatch = addressLower.match(/\b(xóm|ấp|tổ|thôn|khu)\s+([^,]+)/);
      if (hamletMatch) {
        hamletName = `${hamletMatch[1]} ${hamletMatch[2]}`.trim();
      }

      // Extract house number (fallback)
      let houseNumber = '';
      const houseMatch = addressLower.match(/số\s+nhà\s+([\w\-\/]+)/);
      if (houseMatch) {
        houseNumber = houseMatch[1];
      } else {
        const firstComma = address.split(',')[0];
        if (firstComma) houseNumber = firstComma.trim();
      }

      console.log('📍 Identified street:', streetName);
      console.log('📍 Identified house number:', houseNumber);

      // Update receiver data with found IDs
      setReceiverData(prev => ({
        ...prev,
        provinceId: String(province.id),
        districtName: district.name,
        wardId: String(ward.id),
        street: streetName,
        address: houseNumber ? `Số nhà ${houseNumber}` : '',
        hamlet: hamletName || prev.hamlet || 'Khu dân cư'
      }));

      // Load streets for the ward
      if (ward.id) {
        try {
          const streetsRes = await api.get(`/shipping/geo/streets/${ward.id}`);
          const streetsData = streetsRes.data;
          
          if (streetsData.success && streetsData.data) {
            setStreets(streetsData.data);
            console.log('✅ Loaded streets:', streetsData.data.length);
          }
        } catch (error) {
          console.error('❌ Failed to load streets:', error);
        }
      }

      console.log('✅ Address parsing completed successfully');

    } catch (error) {
      console.error('❌ Error parsing address:', error);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Load customer data from localStorage if available
  useEffect(() => {
    const customerData = localStorage.getItem('ghtk_customer_data');
    if (customerData) {
      try {
        const parsed = JSON.parse(customerData);
        setSourceAddress(parsed.address || '');

        // If individual address components are available, use them directly
        if (parsed.provinceId && parsed.wardId) {
          setReceiverData(prev => ({
            ...prev,
            phone: parsed.phone || '',
            fullName: parsed.name || '',
            street: parsed.street || '',
            hamlet: parsed.hamlet || '',
            provinceId: String(parsed.provinceId),
            districtName: parsed.districtName || '',
            wardId: String(parsed.wardId)
          }));
          console.log('✅ Loaded customer data with address components:', parsed);
        } else {
          // Fallback to old behavior: parse address string
          setReceiverData(prev => ({
            ...prev,
            phone: parsed.phone || '',
            fullName: parsed.name || '',
            address: parsed.address || ''
          }));

          // Parse address and find geographic IDs
          if (parsed.address) {
            parseAddressAndFindIds(parsed.address);
          }
          console.log('✅ Loaded customer data, parsing address:', parsed);
        }

        // Clear the data after using it
        localStorage.removeItem('ghtk_customer_data');
      } catch (error) {
        console.error('❌ Failed to parse customer data:', error);
        localStorage.removeItem('ghtk_customer_data');
      }
    }
  }, []);

  // Delayed auto-pick street/hamlet after streets loaded
  useEffect(() => {
    if (streetPickTimer.current) {
      clearTimeout(streetPickTimer.current);
      streetPickTimer.current = null;
    }
    const hasStreets = Array.isArray(streets) && streets.length > 0;
    const hasWard = !!receiverData.wardId;
    const streetEmpty = !receiverData.street;
    if (!hasStreets || !hasWard || !streetEmpty) return;
    const addressText = (sourceAddress || '').toLowerCase();
    streetPickTimer.current = setTimeout(() => {
      if (!addressText) return;
      const normalize = (v: any) => (typeof v === 'string' ? v : (v?.name || ''));
      const best = streets.find((s: any) => addressText.includes(normalize(s).toLowerCase()));
      const picked = normalize(best || streets[0]);
      if (picked) {
        setReceiverData(prev => ({ ...prev, street: picked }));
      }
    }, 5000); // 5s per request
    return () => {
      if (streetPickTimer.current) clearTimeout(streetPickTimer.current);
    };
  }, [streets, receiverData.wardId, receiverData.street, sourceAddress]);

  // Province auto-pick 2s after provinces loaded and address contains province
  useEffect(() => {
    if (provincePickTimer.current) { clearTimeout(provincePickTimer.current); provincePickTimer.current = null; }
    if (!sourceAddress || provinces.length === 0 || receiverData.provinceId) return;
    const lower = sourceAddress.toLowerCase();
    provincePickTimer.current = setTimeout(() => {
      const match = provinces.find((p: any) => lower.includes((p.name || '').toLowerCase()));
      if (match) setReceiverData(prev => ({ ...prev, provinceId: String(match.id) }));
    }, 2000);
  }, [provinces, sourceAddress, receiverData.provinceId]);

  // House number auto-fill after 2s if empty
  useEffect(() => {
    if (housePickTimer.current) { clearTimeout(housePickTimer.current); housePickTimer.current = null; }
    if (receiverData.address) return;
    const text = sourceAddress || '';
    if (!text) return;
    housePickTimer.current = setTimeout(() => {
      const parts = text.split(',');
      const first = parts[0]?.trim();
      if (first) setReceiverData(prev => ({ ...prev, address: first }));
    }, 2000);
  }, [sourceAddress, receiverData.address]);

  // Calculate shipping fee
  const calculateShippingFee = async () => {
    if (!receiverData.provinceId || !receiverData.districtName || !receiverData.wardId || !receiverData.street) {
      alert('Vui lòng chọn đầy đủ Tỉnh/TP, Phường/Xã và Đường/Ấp/Khu trước khi tính phí');
      return;
    }

    setLoadingFee(true);
    try {
      const params = new URLSearchParams();
      params.append('pick_province', 'Hòa Bình');
      params.append('pick_district', 'Thành phố Hòa Bình');
      params.append('pick_address', '407 Trần Hưng Đạo, Tổ 10, Phường Phương Lâm');
      params.append('province', receiverData.provinceId);
      params.append('district', receiverData.districtName);
      params.append('weight', productData.weight.toString());
      
      if (receiverData.wardId) params.append('ward', receiverData.wardId);
      if (receiverData.street) params.append('street', receiverData.street);
      if (receiverData.address) params.append('address', receiverData.address);
      if (productData.value) params.append('value', productData.value.toString());
      if (shippingOptions.transport) params.append('transport', shippingOptions.transport);

      const response = await api.get(`/shipping/ghtk/calculate-fee?${params.toString()}`);
      if (response.data.success) {
        setFeeEstimate(response.data.data);
        console.log('✅ Fee calculated:', response.data.data);
      }
    } catch (error) {
      console.error('❌ Fee calculation failed:', error);
    } finally {
      setLoadingFee(false);
    }
  };

  useEffect(() => {
  api.get('/shipping/geo/provinces').then(res => {
      if (res.data.success) setProvinces(res.data.data || []);
    });
  // Load pick addresses from GHTK and default from localStorage
  const cached = localStorage.getItem('ghtk_default_pick_id');
  if (cached) setDefaultPickId(cached);
  api.get('/shipping/ghtk/pick-addresses').then(res => {
    if (res.data.success) {
      setPickAddresses(res.data.data?.data || res.data.data || []);
    }
  }).catch(() => setPickAddresses([]));
  }, []);

  // REMOVED: Load districts - không cần nữa
  // useEffect(() => { ... }, [receiverData.provinceId]);

  // Load wards trực tiếp từ provinceId (bỏ qua districtId)
  useEffect(() => {
    if (!receiverData.provinceId) {
      setWards([]);
      return;
    }

    console.log('📍 Loading ALL wards for province:', receiverData.provinceId);
    setLoadingWards(true);

    api.get(`/shipping/geo/wards-by-province/${receiverData.provinceId}`)
      .then(res => {
        if (res.data.success) {
          const wardsData = res.data.data || [];
          console.log(`✅ Loaded ${res.data.total} wards for province ${receiverData.provinceId}`);
          console.log('Sample ward:', wardsData[0]); // Debug: xem ward có district_name không
          setWards(wardsData);

          if (!isAutoFilling) {
            setReceiverData(prev => ({
              ...prev,
              wardId: prev.wardId ? prev.wardId : '',
              districtName: prev.districtName ? prev.districtName : '',
              street: prev.street ? prev.street : ''
            }));
          }
        }
      })
      .catch(err => {
        console.error('❌ Failed to load wards:', err);
        setWards([]);
      })
      .finally(() => {
        setLoadingWards(false);
      });
  }, [receiverData.provinceId, isAutoFilling]);

  useEffect(() => {
    if (receiverData.wardId) {
      // Lấy danh sách đường/ấp/khu từ GHTK Level-4 API theo ward đã chọn
      setLoadingStreets(true);
      console.log('🔍 Loading streets for ward:', receiverData.wardId);

      api.get(`/shipping/geo/streets/${receiverData.wardId}`)
        .then(res => {
          if (res.data.success) {
            const streetData = res.data.data || [];
            console.log('✅ Loaded', streetData.length, 'streets from', res.data.source || 'API');
            setStreets(streetData);
          } else {
            console.warn('⚠️ API returned no streets, using fallback');
            const commonStreets = [
              'Trần Hưng Đạo', 'Lê Lợi', 'Nguyễn Huệ', 'Hai Bà Trưng', 'Lý Thường Kiệt',
              'Điện Biên Phủ', 'Lê Duẩn', 'Cách Mạng Tháng Tám', 'Nguyễn Thị Minh Khai',
              'Võ Văn Tần', 'Trần Phú', 'Phan Đình Phùng', 'Nguyễn Văn Cừ', 'Lê Thánh Tông',
              'Hoàng Diệu', 'Trường Chinh', 'Nguyễn Trãi', 'Quang Trung', 'Lạc Long Quân',
              'Âu Cơ', 'Nguyễn Du', 'Bà Triệu', 'Phan Chu Trinh', 'Hùng Vương', 'Lý Tự Trọng',
              'Võ Thị Sáu', 'Trần Quốc Toản', 'Lê Văn Sỹ', 'Nguyễn Đình Chiểu', 'Hoàng Văn Thụ'
            ];
            setStreets(commonStreets);
          }
        })
        .catch(err => {
          console.error('❌ Failed to load streets:', err);
          // Fallback: danh sách đường phổ biến
          const commonStreets = [
            'Trần Hưng Đạo', 'Lê Lợi', 'Nguyễn Huệ', 'Hai Bà Trưng', 'Lý Thường Kiệt',
            'Điện Biên Phủ', 'Lê Duẩn', 'Cách Mạng Tháng Tám', 'Nguyễn Thị Minh Khai',
            'Võ Văn Tần', 'Trần Phú', 'Phan Đình Phùng', 'Nguyễn Văn Cừ', 'Lê Thánh Tông',
            'Hoàng Diệu', 'Trường Chinh', 'Nguyễn Trãi', 'Quang Trung', 'Lạc Long Quân',
            'Âu Cơ', 'Nguyễn Du', 'Bà Triệu', 'Phan Chu Trinh', 'Hùng Vương', 'Lý Tự Trọng',
            'Võ Thị Sáu', 'Trần Quốc Toản', 'Lê Văn Sỹ', 'Nguyễn Đình Chiểu', 'Hoàng Văn Thụ'
          ];
          setStreets(commonStreets);
        })
        .finally(() => {
          setLoadingStreets(false);
        });
    } else {
      setStreets([]);
      setLoadingStreets(false);
    }
  }, [receiverData.wardId]);

  useEffect(() => {
    if (receiverData.provinceId && receiverData.districtName && productData.weight > 0) {
      const timer = setTimeout(() => calculateFee(), 500);
      return () => clearTimeout(timer);
    }
  }, [receiverData.provinceId, receiverData.districtName, productData.weight, shippingOptions.transport, productData.codAmount]);

  const calculateFee = () => {
    const province = provinces.find(p => p.id === receiverData.provinceId);
    if (!province || !receiverData.districtName) return;

    const transport = shippingOptions.transport === 'express' || shippingOptions.transport === 'bbs' ? 'road' : shippingOptions.transport;

    api.post('/shipping/ghtk/fee', {
      pick_province: 'Ha Noi',
      pick_district: 'Quan Hoan Kiem',
      province: province.name,
      district: receiverData.districtName, // Dùng districtName từ ward
      weight: productData.weight * 1000,
      value: productData.codAmount,
      transport
    }).then(res => {
      if (res.data.success) setFeeEstimate(res.data.data?.fee || 0);
    }).catch(err => console.error('Failed to calculate fee:', err));
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const province = provinces.find(p => p.id === receiverData.provinceId);
      const ward = wards.find(w => w.id === receiverData.wardId);

      if (!province || !receiverData.districtName || !ward) {
        throw new Error('Vui lòng chọn đầy đủ địa chỉ');
      }

      const transport = shippingOptions.transport === 'express' || shippingOptions.transport === 'bbs' ? 'road' : shippingOptions.transport;

      const payload = {
        order: {
          id: `ORDER-${Date.now()}`,
          name: receiverData.fullName,
          tel: receiverData.phone,
          address: receiverData.street, // Chỉ tên đường
          hamlet: receiverData.hamlet || 'Khu dân cư', // Tổ/Thôn/Ấp (bắt buộc theo GHTK)
          province: province.name,
          district: receiverData.districtName, // Lấy từ ward.district_name
          ward: ward.name,
          pick_name: 'TRƯỜNG PHÁT COMPUTER',
          pick_tel: '0836768597',
          pick_address: '407 Trần Hưng Đạo, Tổ 10, Phường Phương Lâm',
          pick_province: 'Hòa Bình',
          pick_district: 'Thành phố Hòa Bình',
          value: Math.max(1, productData.productValue),
          pick_money: 0, // Đơn không thu tiền - COD = 0
          weight: productData.weight,
          transport,
          note: '',
          is_freeship: 0
        },
        products: [{
          name: productData.name,
          weight: productData.weight,
          quantity: productData.quantity,
          value: Math.max(1, productData.productValue) // GHTK yêu cầu value >= 1 đồng
        }]
      };

      console.log('🚀 Creating GHTK order:', payload);
      const response = await api.post('/shipping/ghtk/order', payload);
      return response.data;
    },
    onSuccess: () => {
      alert('✅ Tạo đơn thành công!');
      navigate('/shipping/orders');
    },
    onError: (error: any) => {
      console.error('❌ Failed:', error);
      console.error('❌ Response data:', error?.response?.data);
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Không thể tạo đơn';
      const ghtkError = error?.response?.data?.data?.message || '';
      const fullError = ghtkError ? `${errorMsg}\nGHTK: ${ghtkError}` : errorMsg;
      alert('❌ Lỗi: ' + fullError);
    }
  });

  // Load products from API
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.get('/api/products');
      console.log('📦 Products loaded:', response.data);

      if (response.data.success && response.data.data) {
        setProducts(response.data.data);
      } else if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle product selection
  const handleSelectProduct = (product: any) => {
    console.log('✅ Selected product:', product);

    // Fill product data from selected product
    setProductData({
      name: product.name || product.product_name || '',
      weight: parseFloat(product.weight) || 0.5, // Default 0.5kg if not specified
      quantity: 1,
      codAmount: parseFloat(product.price) || 0,
      productValue: parseFloat(product.price) || 0
    });

    // Close the product selector dialog
    setOpenProductSelector(false);
    setProductSearch('');

    alert(`✅ Đã chọn sản phẩm: ${product.name || product.product_name}`);
  };

  // Load products when opening the product selector
  useEffect(() => {
    if (openProductSelector && products.length === 0) {
      loadProducts();
    }
  }, [openProductSelector]);

  const isFormValid = () => {
    const isValid = (
      receiverData.phone &&
      receiverData.fullName &&
      receiverData.provinceId &&
      receiverData.districtName &&
      receiverData.wardId &&
      receiverData.street &&
      // hamlet không bắt buộc - có thể để trống
      productData.name &&
      productData.weight > 0
    );
    
    // Debug log để kiểm tra validation
    console.log('🔍 Form Validation Debug:', {
      phone: receiverData.phone,
      fullName: receiverData.fullName,
      provinceId: receiverData.provinceId,
      districtName: receiverData.districtName,
      wardId: receiverData.wardId,
      street: receiverData.street,
      hamlet: receiverData.hamlet,
      productName: productData.name,
      productWeight: productData.weight,
      isValid
    });
    
    return isValid;
  };

  const totalWeight = productData.weight * productData.quantity;
  const totalAmount = (feeEstimate?.fee || 0) + productData.codAmount;

  // Build a lightweight customer object for the details drawer (to mirror registration view)
  const selectedProvince = provinces.find((p: any) => String(p.id) === String(receiverData.provinceId));
  const selectedWard = wards.find((w: any) => String(w.id) === String(receiverData.wardId));
  const composedAddress = [receiverData.address, receiverData.street, selectedWard?.name, receiverData.districtName, selectedProvince?.name]
    .filter(Boolean)
    .join(', ');
  const drawerCustomer = {
    name: receiverData.fullName,
    phone: receiverData.phone,
    email: '',
    customer_type: 'regular',
    is_active: true,
    province_name: selectedProvince?.name,
    district_name: receiverData.districtName, // Lấy từ ward.district_name
    ward_name: selectedWard?.name,
    street: receiverData.street,
    address: composedAddress,
    total_orders: 0,
    total_spent_cents: 0,
    loyalty_points: 0
  } as any;

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          p: 3,
          bgcolor: 'rgba(255,255,255,0.95)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28
            }}>
              🚚
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Tạo đơn hàng GHTK
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mt: 0.5, fontSize: 15 }}>
                Giao hàng tiết kiệm - Nhanh chóng & Tiện lợi
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="large"
            sx={{
              borderColor: '#667eea',
              color: '#667eea',
              textTransform: 'none',
              fontSize: 16,
              fontWeight: 600,
              px: 3,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                borderColor: '#764ba2',
                bgcolor: 'rgba(102, 126, 234, 0.05)'
              }
            }}
          >
            📷 Ảnh ĐH
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {/* LEFT COLUMN */}
          <Grid item xs={12} md={6}>
            {/* NGƯỜI NHẬN */}
            <Paper elevation={3} sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    👤
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', fontSize: 20 }}>
                    NGƯỜI NHẬN
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                  label={<Typography sx={{ fontSize: 16, fontWeight: 500 }}>Giao về shop</Typography>}
                  sx={{ m: 0 }}
                />
              </Box>

              <TextField
                fullWidth
                placeholder="Nhập số điện thoại khách hàng"
                value={receiverData.phone}
                onChange={(e) => setReceiverData({ ...receiverData, phone: e.target.value })}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    fontSize: 17,
                    height: 56,
                    bgcolor: '#f8f9ff',
                    '&:hover': { bgcolor: '#f0f2ff' },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                      '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                    }
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><span style={{ fontSize: 24 }}>📞</span></InputAdornment>
                }}
              />

              <TextField
                fullWidth
                placeholder="Tên khách hàng"
                value={receiverData.fullName}
                onChange={(e) => setReceiverData({ ...receiverData, fullName: e.target.value })}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    fontSize: 17,
                    height: 56,
                    bgcolor: '#f8f9ff',
                    '&:hover': { bgcolor: '#f0f2ff' },
                    '&.Mui-focused': {
                      bgcolor: '#fff',
                      '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                    }
                  }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><span style={{ fontSize: 24 }}>👤</span></InputAdornment>
                }}
              />

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenCustomerDrawer(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Xem chi tiết khách hàng
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/dang-ky-khach-hang')}
                  sx={{ textTransform: 'none' }}
                >
                  Đăng ký khách hàng
                </Button>
              </Box>

              {/* FORM ĐỊA CHỈ 2x2 GRID - Chọn địa chỉ theo thứ tự */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2, 
                mb: 3 
              }}>
                {/* Hàng 1 - Cột 1: Địa chỉ đầy đủ (read-only) */}
                <TextField
                  fullWidth
                  label="Địa chỉ đầy đủ"
                  value={composedAddress}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <span style={{ fontSize: 18, color: '#667eea' }}>📍</span>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: 16,
                      height: 56,
                      bgcolor: '#f8f9ff',
                      '&:hover': { bgcolor: '#f0f2ff' },
                      '&.Mui-focused': {
                        bgcolor: '#fff',
                        '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                      }
                    },
                    '& .MuiInputLabel-root': { fontSize: 16, fontWeight: 500 }
                  }}
                />

                {/* Hàng 1 - Cột 2: Đường/Ấp/Khu (GHTK Level-4) */}
                <Autocomplete
                  options={streets}
                  value={receiverData.street || null}
                  onChange={(event, newValue) => {
                    console.log('🔍 Street selected via Autocomplete:', newValue);
                    setReceiverData(prev => ({ ...prev, street: newValue || '' }));
                  }}
                  disabled={!receiverData.wardId || loadingStreets}
                  loading={loadingStreets}
                  loadingText="Đang tải địa chỉ từ GHTK..."
                  noOptionsText={receiverData.wardId ? 'Không có dữ liệu' : 'Chọn Phường/Xã trước'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={loadingStreets ? 'Đang tải...' : 'Đường/Ấp/Khu'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: 16,
                          height: 56,
                          bgcolor: receiverData.wardId && !loadingStreets ? '#f8f9ff' : '#f5f5f5',
                          '&:hover': { bgcolor: receiverData.wardId && !loadingStreets ? '#f0f2ff' : '#f5f5f5' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                            borderWidth: 2
                          },
                          '&.Mui-disabled': {
                            bgcolor: '#f5f5f5',
                            '& .MuiAutocomplete-endAdornment': { color: '#999' }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: 16,
                          fontWeight: 500,
                          '&.Mui-focused': { color: '#667eea' },
                          '&.Mui-disabled': { color: '#999' }
                        },
                        '& .MuiAutocomplete-endAdornment': {
                          color: '#667eea',
                          fontSize: 20
                        }
                      }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStreets ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        fontSize: 15,
                        padding: '12px 16px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#f0f2ff'
                        }
                      }}
                    >
                      {option}
                    </Box>
                  )}
                  ListboxProps={{
                    sx: {
                      maxHeight: 400,
                      '& .MuiAutocomplete-option': {
                        fontSize: 15,
                        padding: '12px 16px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#f0f2ff'
                        },
                        '&.Mui-focused': {
                          bgcolor: '#e3f2fd'
                        }
                      }
                    }
                  }}
                />
                {streets.length > 0 && !loadingStreets && (
                  <Typography variant="caption" sx={{ mt: 0.5, ml: 1, color: '#4caf50', fontSize: 12 }}>
                    ✅ {streets.length} địa chỉ từ GHTK
                  </Typography>
                )}

                {/* Hàng 2 - Cột 1: Phường/Xã - Hiển thị "Phường X (Quận Y)" */}
                <Box>
                  <FormControl fullWidth>
                    <InputLabel sx={{
                      fontSize: 16,
                      fontWeight: 500,
                      '&.Mui-focused': { color: '#667eea' }
                    }}>
                      {loadingWards ? 'Đang tải...' : 'Phường/Xã'}
                    </InputLabel>
                    <Select
                      value={receiverData.wardId}
                      label={loadingWards ? 'Đang tải...' : 'Phường/Xã'}
                      onChange={(e) => {
                        const selectedWard = wards.find(w => w.id === e.target.value);
                        console.log('🔍 Ward selected:', selectedWard);
                        setReceiverData({
                          ...receiverData,
                          wardId: e.target.value,
                          districtName: selectedWard?.district_name || '' // Lưu district_name từ ward
                        });
                      }}
                      disabled={!receiverData.provinceId || loadingWards}
                      sx={{
                        fontSize: 16,
                        height: 56,
                        bgcolor: receiverData.provinceId && !loadingWards ? '#f8f9ff' : '#f5f5f5',
                        '&:hover': { bgcolor: receiverData.provinceId && !loadingWards ? '#f0f2ff' : '#f5f5f5' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#667eea',
                          borderWidth: 2
                        },
                        '& .MuiSelect-icon': {
                          fontSize: 20,
                          color: '#667eea'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 400,
                            '& .MuiMenuItem-root': {
                              fontSize: 15,
                              padding: '10px 16px',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word'
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: 16 }}>
                        <em>-- Chọn Phường/Xã --</em>
                      </MenuItem>
                      {loadingWards ? (
                        <MenuItem disabled sx={{ fontSize: 16 }}>
                          <CircularProgress size={20} sx={{ mr: 2 }} />
                          Đang tải phường/xã...
                        </MenuItem>
                      ) : wards.length === 0 ? (
                        <MenuItem disabled sx={{ fontSize: 16 }}>
                          <em>{receiverData.provinceId ? 'Không có dữ liệu' : 'Chọn Tỉnh/TP trước'}</em>
                        </MenuItem>
                      ) : (
                        wards.map(w => (
                          <MenuItem key={w.id} value={w.id} sx={{ fontSize: 15 }}>
                            {w.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {wards.length > 0 && !loadingWards && (
                    <Typography variant="caption" sx={{ mt: 0.5, ml: 1, color: '#4caf50', fontSize: 12, display: 'block' }}>
                      ✅ {wards.length} phường/xã trong tỉnh
                    </Typography>
                  )}
                </Box>

                {/* Hàng 2 - Cột 2: Tỉnh/TP */}
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    fontSize: 16, 
                    fontWeight: 500, 
                    '&.Mui-focused': { color: '#667eea' } 
                  }}>
                    Tỉnh/TP
                  </InputLabel>
                  <Select
                    value={receiverData.provinceId}
                    label="Tỉnh/TP"
                    onChange={(e) => setReceiverData({ ...receiverData, provinceId: e.target.value })}
                    sx={{
                      fontSize: 16,
                      height: 56,
                      bgcolor: '#f8f9ff',
                      '&:hover': { bgcolor: '#f0f2ff' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#667eea',
                        borderWidth: 2
                      },
                      '& .MuiSelect-icon': {
                        fontSize: 20,
                        color: '#667eea'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            fontSize: 16,
                            padding: '8px 16px'
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: 16 }}>
                      <em>-- Chọn Tỉnh/TP --</em>
                    </MenuItem>
                    {provinces.map(p => (
                      <MenuItem key={p.id} value={p.id} sx={{ fontSize: 16 }}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* QUẬN/HUYỆN - REMOVED theo chuẩn GHTK mới */}
              {/* Phường/Xã sẽ load trực tiếp từ Tỉnh/TP */}
            </Paper>

            {/* LẤY & GIAO TẬN NƠI */}
            <Paper elevation={3} sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  🚚
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', fontSize: 20 }}>
                  Lấy & Giao tận nơi
                </Typography>
              </Box>

              <RadioGroup
                value={shippingOptions.transport}
                onChange={(e) => setShippingOptions({ ...shippingOptions, transport: e.target.value })}
              >
                <FormControlLabel
                  value="express"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                  label={<Typography sx={{ fontSize: 17, fontWeight: 500 }}>EXPRESS nhanh &lt; 20kg</Typography>}
                  sx={{ mb: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8f9ff' } }}
                />
                <FormControlLabel
                  value="bbs"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                  label={<Typography sx={{ fontSize: 17, fontWeight: 500 }}>BBS lớn ≥ 20kg</Typography>}
                  sx={{ mb: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8f9ff' } }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8f9ff' } }}>
                  <Radio
                    value="road"
                    checked={shippingOptions.transport === 'road'}
                    onChange={(e) => setShippingOptions({ ...shippingOptions, transport: e.target.value })}
                    sx={{ '&.Mui-checked': { color: '#667eea' } }}
                  />
                  <Typography sx={{ fontSize: 17, fontWeight: 500, mr: 2 }}>Bộ</Typography>
                  <Grid container spacing={1} sx={{ flex: 1 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Hẹn lấy</InputLabel>
                        <Select
                          label="Hẹn lấy"
                          sx={{ fontSize: 14, height: 40, bgcolor: '#f8f9ff' }}
                        >
                          <MenuItem value="">-- Chọn --</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Hẹn giao</InputLabel>
                        <Select
                          label="Hẹn giao"
                          sx={{ fontSize: 14, height: 40, bgcolor: '#f8f9ff' }}
                        >
                          <MenuItem value="">-- Chọn --</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8f9ff' } }}>
                  <Radio
                    value="fly"
                    checked={shippingOptions.transport === 'fly'}
                    onChange={(e) => setShippingOptions({ ...shippingOptions, transport: e.target.value })}
                    sx={{ '&.Mui-checked': { color: '#667eea' } }}
                  />
                  <Typography sx={{ fontSize: 17, fontWeight: 500, mr: 2 }}>Bay</Typography>
                  <Grid container spacing={1} sx={{ flex: 1 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Hẹn lấy</InputLabel>
                        <Select
                          label="Hẹn lấy"
                          sx={{ fontSize: 14, height: 40, bgcolor: '#f8f9ff' }}
                        >
                          <MenuItem value="">-- Chọn --</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Hẹn giao</InputLabel>
                        <Select
                          label="Hẹn giao"
                          sx={{ fontSize: 14, height: 40, bgcolor: '#f8f9ff' }}
                        >
                          <MenuItem value="">-- Chọn --</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </RadioGroup>
            </Paper>

            {/* HÌNH THỨC LẤY HÀNG */}
            <Paper elevation={3} sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  📦
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', fontSize: 20 }}>
                  Hình thức lấy hàng
                </Typography>
              </Box>

              <RadioGroup
                value={shippingOptions.pickupOption}
                onChange={(e) => setShippingOptions({ ...shippingOptions, pickupOption: e.target.value })}
              >
                <FormControlLabel
                  value="pickup"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                  label={<Typography sx={{ fontSize: 17, fontWeight: 500 }}>Lấy hàng tận nơi</Typography>}
                  sx={{ mb: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8f9ff' } }}
                />
                {shippingOptions.pickupOption === 'pickup' && (
                  <Box sx={{
                    ml: 6,
                    mt: 1,
                    mb: 2,
                    p: 2.5,
                    bgcolor: '#f8f9ff',
                    borderRadius: 2,
                    border: '2px dashed #667eea'
                  }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Điểm lấy hàng (GHTK)</InputLabel>
                      <Select
                        label="Điểm lấy hàng (GHTK)"
                        value={defaultPickId || ''}
                        onChange={(e) => { setDefaultPickId(e.target.value as string); localStorage.setItem('ghtk_default_pick_id', String(e.target.value)); }}
                      >
                        <MenuItem value="">-- Chọn --</MenuItem>
                        {pickAddresses.map((p: any) => (
                          <MenuItem key={p.id || p.pick_address_id || p.address} value={String(p.id || p.pick_address_id || p.address)}>
                            {p.name || p.pick_name} - {(p.address || p.pick_address)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <TextField
                        fullWidth
                        value={shippingOptions.pickupLocation}
                        onChange={(e) => setShippingOptions({ ...shippingOptions, pickupLocation: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: 16,
                            height: 48,
                            bgcolor: '#fff',
                            '&:hover': { bgcolor: '#f8f9ff' },
                            '&.Mui-focused': {
                              bgcolor: '#fff',
                              '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                            }
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <span style={{ fontSize: 20, color: '#667eea' }}>▼</span>
                            </InputAdornment>
                          )
                        }}
                      />
                    </FormControl>
                  </Box>
                )}

                <FormControlLabel
                  value="dropoff"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#667eea' } }} />}
                  label={<Typography sx={{ fontSize: 17, fontWeight: 500 }}>Gửi hàng bưu cục</Typography>}
                  sx={{ p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8f9ff' } }}
                />
                {shippingOptions.pickupOption === 'dropoff' && (
                  <Box sx={{ ml: 6, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        fontSize: 16,
                        height: 48,
                        bgcolor: '#f8f9ff',
                        borderColor: '#667eea',
                        color: '#667eea',
                        textTransform: 'none',
                        fontWeight: 500,
                        justifyContent: 'space-between',
                        px: 2,
                        '&:hover': {
                          bgcolor: '#f0f2ff',
                          borderColor: '#764ba2'
                        }
                      }}
                      endIcon={<span style={{ fontSize: 20 }}>▼</span>}
                    >
                      Bấm chọn Bưu cục gần nhất
                    </Button>
                  </Box>
                )}
              </RadioGroup>
            </Paper>
          </Grid>

          {/* RIGHT COLUMN */}
          <Grid item xs={12} md={6}>
            {/* SẢN PHẨM */}
            <Paper elevation={3} sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                pb: 2,
                borderBottom: '2px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    🛍️
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', fontSize: 20 }}>
                    Sản phẩm
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setOpenProductSelector(true)}
                  sx={{
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    textTransform: 'none',
                    borderStyle: 'dashed',
                    fontSize: 15,
                    fontWeight: 600,
                    px: 2.5,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#45a049',
                      bgcolor: '#f1f8f4'
                    }
                  }}
                >
                  ➕ Sản phẩm có sẵn
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  border: '3px dashed #667eea',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f8f9ff',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#764ba2',
                    transform: 'scale(1.05)'
                  }
                }}>
                  <Typography sx={{ fontSize: 40 }}>📦</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="1. Nhập tên sản phẩm"
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        fontSize: 17,
                        height: 56,
                        bgcolor: '#f8f9ff',
                        '&:hover': { bgcolor: '#f0f2ff' },
                        '&.Mui-focused': {
                          bgcolor: '#fff',
                          '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                        }
                      }
                    }}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Khối lượng (kg)"
                        type="number"
                        value={productData.weight || ''}
                        onChange={(e) => setProductData({ ...productData, weight: parseFloat(e.target.value) || 0 })}
                        inputProps={{ min: 0, step: 0.1 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: 16,
                            height: 56,
                            bgcolor: '#f8f9ff',
                            '&:hover': { bgcolor: '#f0f2ff' },
                            '&.Mui-focused': {
                              bgcolor: '#fff',
                              '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                            }
                          },
                          '& .MuiInputLabel-root': { fontSize: 15 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Số lượng"
                        type="number"
                        value={productData.quantity}
                        onChange={(e) => setProductData({ ...productData, quantity: parseInt(e.target.value) || 1 })}
                        inputProps={{ min: 1 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: 16,
                            height: 56,
                            bgcolor: '#f8f9ff',
                            '&:hover': { bgcolor: '#f0f2ff' },
                            '&.Mui-focused': {
                              bgcolor: '#fff',
                              '& fieldset': { borderColor: '#667eea', borderWidth: 2 }
                            }
                          },
                          '& .MuiInputLabel-root': { fontSize: 15 }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Button
                  sx={{
                    minWidth: 56,
                    width: 56,
                    height: 56,
                    bgcolor: '#4caf50',
                    color: 'white',
                    fontSize: 32,
                    borderRadius: 2,
                    alignSelf: 'flex-start',
                    '&:hover': {
                      bgcolor: '#45a049',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  +
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Tính phí vận chuyển */}
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8f9ff', borderRadius: 2, border: '1px solid #e3f2fd' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
                  💰 Tính phí vận chuyển
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    onClick={calculateShippingFee}
                    disabled={loadingFee || !receiverData.provinceId || !receiverData.districtName || !productData.weight}
                    startIcon={loadingFee ? <CircularProgress size={20} /> : <LocalShipping />}
                    sx={{ 
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': { borderColor: '#5a6fd8', bgcolor: '#f0f2ff' }
                    }}
                  >
                    {loadingFee ? 'Đang tính...' : 'Tính phí vận chuyển'}
                  </Button>
                  
                  {feeEstimate && (
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phí vận chuyển: <strong style={{ color: '#4caf50' }}>{feeEstimate.fee?.toLocaleString()} VNĐ</strong>
                      </Typography>
                      {feeEstimate.insurance_fee > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Phí khai giá: <strong>{feeEstimate.insurance_fee?.toLocaleString()} VNĐ</strong>
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Gói cước: {feeEstimate.name} | Giao hàng: {feeEstimate.delivery ? '✅ Hỗ trợ' : '❌ Không hỗ trợ'}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Summary Grid */}
              <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      Tổng KL
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 14 }}>
                      {totalWeight.toFixed(2)} kg
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      KL tính cước
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 14 }}>
                      {totalWeight.toFixed(2)} kg
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      Tiền thu hộ
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={productData.codAmount}
                      onChange={(e) => setProductData({ ...productData, codAmount: parseInt(e.target.value) || 0 })}
                      inputProps={{ min: 0 }}
                      InputProps={{ sx: { fontSize: 14 } }}
                      sx={{ '& .MuiOutlinedInput-root': { height: 36 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      Giá trị hàng
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={productData.productValue}
                      onChange={(e) => setProductData({ ...productData, productValue: parseInt(e.target.value) || 0 })}
                      inputProps={{ min: 0 }}
                      InputProps={{ sx: { fontSize: 14 } }}
                      sx={{ '& .MuiOutlinedInput-root': { height: 36 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                      Phí ship
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 14, color: feeEstimate ? '#1976d2' : '#999' }}>
                      {feeEstimate?.fee ? `${feeEstimate.fee.toLocaleString()}đ` : '0đ'}
                    </Typography>
                    <Button size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: 12, color: '#1976d2' }}>
                      Khách trả ship
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ bgcolor: '#fff3cd', p: 1.5, borderRadius: 1, border: '1px solid #ffe082' }}>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                        Tổng tiền
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ fontSize: 18, color: '#f57c00' }}>
                        {totalAmount.toLocaleString()}đ
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder="Nhập mã đơn hàng riêng của shop"
                label="Mã ĐH riêng"
                InputProps={{ sx: { fontSize: 14 } }}
                InputLabelProps={{ sx: { fontSize: 14 } }}
              />
            </Paper>

          </Grid>
        </Grid>

        {/* CHÍNH SÁCH GIAO HÀNG */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
            🚚 Chính sách giao hàng
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={deliveryPolicy.saveForNext}
                onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, saveForNext: e.target.checked })}
              />
            }
            label="Lưu cho các lần đăng đơn tiếp theo"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Xem hàng <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Miễn phí</Typography>
                </Box>
                <Switch
                  checked={deliveryPolicy.viewGoods}
                  onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, viewGoods: e.target.checked })}
                  color="success"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Gọi shop khi không giao được <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Miễn phí</Typography>
                </Box>
                <Switch
                  checked={deliveryPolicy.callShopWhenFail}
                  onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, callShopWhenFail: e.target.checked })}
                  color="success"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Giao hàng 1 phần chọn SP <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Phí hoàn</Typography>
                </Box>
                <Switch
                  checked={deliveryPolicy.partialDeliverySelect}
                  onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, partialDeliverySelect: e.target.checked })}
                  color="success"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Giao hàng 1 phần đổi trả hàng <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Phí hoàn</Typography>
                </Box>
                <Switch
                  checked={deliveryPolicy.partialDeliveryExchange}
                  onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, partialDeliveryExchange: e.target.checked })}
                  color="success"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Sản phẩm thu hồi
                  </Typography>
                </Box>
                <Button variant="outlined" size="small" endIcon={<ArrowForwardIosIcon />}>
                  Chọn sản phẩm
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Không giao được thu phí <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Phí hoàn</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    value={deliveryPolicy.undeliverableFee}
                    onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, undeliverableFee: parseInt(e.target.value) || 0 })}
                    sx={{ width: 80 }}
                    InputProps={{
                      endAdornment: <Typography variant="caption">đ</Typography>
                    }}
                  />
                  <Switch
                    checked={deliveryPolicy.chargeWhenUndeliverable}
                    onChange={(e) => setDeliveryPolicy({ ...deliveryPolicy, chargeWhenUndeliverable: e.target.checked })}
                    color="success"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* CHÍNH SÁCH HOÀN HÀNG */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
            🔄 Chính sách hoàn hàng
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={returnPolicy.saveForNext}
                onChange={(e) => setReturnPolicy({ ...returnPolicy, saveForNext: e.target.checked })}
              />
            }
            label="Lưu cho các lần đăng đơn tiếp theo"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            {[
              { key: 'sameDayReturn', label: 'Hoàn ngay trong ngày với đơn XFAST Nối điểm', icon: true },
              { key: 'autoStoreCheck', label: 'Tự động lưu kho chờ check', icon: true },
              { key: 'noStoreReturn', label: 'Không lưu kho/Hoàn ngay', icon: true },
              { key: 'noAcceptReturn', label: 'Không nhận hàng trả', icon: true },
              { key: 'callShopBeforeReturn', label: 'Gọi shop trước khi trả hàng', icon: true },
              { key: 'returnConfirmation', label: 'Biên bản xác nhận trả hàng', icon: true },
              { key: 'returnAtPostOffice', label: 'Nhận hàng trả tại bưu cục', icon: true },
              { key: 'needShopConfirmation', label: 'Đã trả cần shop xác nhận', icon: true }
            ].map((item) => (
              <Grid item xs={12} md={6} key={item.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {item.label} {item.icon && <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Miễn phí</Typography>
                  </Box>
                  <Switch
                    checked={returnPolicy[item.key as keyof typeof returnPolicy] as boolean}
                    onChange={(e) => setReturnPolicy({ ...returnPolicy, [item.key]: e.target.checked })}
                    color="success"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Trả hàng tại: {returnPolicy.returnAddress}
            </Typography>
          </Box>
        </Paper>

        {/* CHÍNH SÁCH LẤY HÀNG */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
            📦 Chính sách lấy hàng
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={pickupPolicy.saveForNext}
                onChange={(e) => setPickupPolicy({ ...pickupPolicy, saveForNext: e.target.checked })}
              />
            }
            label="Lưu cho các lần đăng đơn tiếp theo"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Gọi shop trước khi lấy hàng <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Miễn phí</Typography>
                </Box>
                <Switch
                  checked={pickupPolicy.callShopBeforePickup}
                  onChange={(e) => setPickupPolicy({ ...pickupPolicy, callShopBeforePickup: e.target.checked })}
                  color="success"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Đồng kiểm khi lấy hàng <InfoIcon sx={{ fontSize: 16, color: '#4caf50', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Miễn phí</Typography>
                </Box>
                <Switch
                  checked={pickupPolicy.coCheckPickup}
                  onChange={(e) => setPickupPolicy({ ...pickupPolicy, coCheckPickup: e.target.checked })}
                  color="success"
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Lấy hàng tận nơi tại: {pickupPolicy.pickupAddress}
            </Typography>
          </Box>
        </Paper>

        {/* BOTTOM BUTTONS */}
        <Box sx={{
          display: 'flex',
          gap: 3,
          mt: 4,
          p: 3,
          bgcolor: 'rgba(255,255,255,0.95)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Button
            variant="outlined"
            size="large"
            sx={{
              textTransform: 'none',
              fontSize: 17,
              fontWeight: 600,
              borderColor: '#667eea',
              color: '#667eea',
              px: 4,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                borderColor: '#764ba2',
                bgcolor: 'rgba(102, 126, 234, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={<span style={{ fontSize: 20 }}>➕</span>}
          >
            Thêm ĐH mới
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{
              textTransform: 'none',
              fontSize: 17,
              fontWeight: 600,
              borderColor: '#ffa726',
              color: '#ffa726',
              px: 4,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                borderColor: '#fb8c00',
                bgcolor: 'rgba(255, 167, 38, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(255, 167, 38, 0.2)'
              },
              transition: 'all 0.3s ease'
            }}
            startIcon={<span style={{ fontSize: 20 }}>💾</span>}
          >
            Lưu nháp
          </Button>
          <Button
            variant="contained"
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
              textTransform: 'none',
              fontSize: 18,
              fontWeight: 700,
              px: 6,
              py: 1.5,
              boxShadow: '0 4px 20px rgba(0, 200, 83, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a844 0%, #00c853 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 28px rgba(0, 200, 83, 0.5)'
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#999',
                boxShadow: 'none'
              },
              transition: 'all 0.3s ease'
            }}
            disabled={!isFormValid() || createOrderMutation.isPending}
            onClick={() => createOrderMutation.mutate()}
            startIcon={createOrderMutation.isPending ? <CircularProgress size={24} color="inherit" /> : <span style={{ fontSize: 22 }}>✓</span>}
          >
            {createOrderMutation.isPending ? 'Đang tạo đơn...' : '🚀 Đăng đơn ngay'}
          </Button>
        </Box>

        {/* ERROR */}
        {createOrderMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(createOrderMutation.error as any)?.response?.data?.error || 'Có lỗi xảy ra'}
          </Alert>
        )}

        {/* Customer Details Drawer */}
        <CustomerDetailsDrawer
          open={openCustomerDrawer}
          onClose={() => setOpenCustomerDrawer(false)}
          customer={drawerCustomer}
        />

        {/* Product Selector Dialog */}
        <Dialog
          open={openProductSelector}
          onClose={() => setOpenProductSelector(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Box sx={{ fontSize: 32 }}>📦</Box>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Chọn sản phẩm có sẵn
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Chọn sản phẩm từ danh sách để tự động điền thông tin
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {/* Search Box */}
            <TextField
              fullWidth
              placeholder="Tìm kiếm sản phẩm..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ fontSize: 20 }}>🔍</Box>
                  </InputAdornment>
                ),
              }}
            />

            {/* Product List */}
            {loadingProducts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : products.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Không có sản phẩm nào. Vui lòng thêm sản phẩm vào hệ thống trước.
              </Alert>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {products
                  .filter((product) => {
                    const searchLower = productSearch.toLowerCase();
                    return (
                      product.name?.toLowerCase().includes(searchLower) ||
                      product.product_name?.toLowerCase().includes(searchLower) ||
                      product.sku?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((product) => (
                    <ListItem key={product.id} disablePadding sx={{ mb: 1 }}>
                      <ListItemButton
                        onClick={() => handleSelectProduct(product)}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid #e0e0e0',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            borderColor: '#667eea',
                            transform: 'translateX(4px)',
                            transition: 'all 0.2s'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: '#667eea',
                              width: 56,
                              height: 56
                            }}
                          >
                            <Box sx={{ fontSize: 24 }}>📦</Box>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={600}>
                              {product.name || product.product_name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                SKU: {product.sku || 'N/A'} | Giá: {product.price?.toLocaleString() || '0'} VNĐ
                              </Typography>
                              {product.weight && (
                                <Chip
                                  label={`⚖️ ${product.weight} kg`}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
            <Button
              onClick={() => setOpenProductSelector(false)}
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GHTKOrderCreate;
