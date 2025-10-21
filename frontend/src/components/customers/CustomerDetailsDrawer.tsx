import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import Person from '@mui/icons-material/Person';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Loyalty from '@mui/icons-material/Loyalty';
import Notes from '@mui/icons-material/Notes';
import api from '../../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: any;
}

const a11yProps = (index: number) => ({ id: `cust-tab-${index}`, 'aria-controls': `cust-tabpanel-${index}` });

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount || 0);

const CustomerDetailsDrawer: React.FC<Props> = ({ open, onClose, customer }) => {
  const [tab, setTab] = React.useState(0);
  const [displayProvince, setDisplayProvince] = React.useState<string>('-');
  const [displayDistrict, setDisplayDistrict] = React.useState<string>('-');
  const [displayWard, setDisplayWard] = React.useState<string>('-');
  const [displayStreet, setDisplayStreet] = React.useState<string>('-');

  // Auto-parse address to 4 levels for display
  React.useEffect(() => {
    const parse = async () => {
      try {
        const addr = (customer?.address || '').toLowerCase();
        if (!open || !addr) return;
        const pRes = await api.get('/shipping/geo/provinces');
        const provinces = pRes.data?.data || [];
        const p = provinces.find((pr: any) => addr.includes((pr.name || '').toLowerCase()));
        if (p) setDisplayProvince(p.name); else return;
        const dRes = await api.get(`/shipping/geo/districts/${p.id}`);
        const districts = dRes.data?.data || [];
        const d = districts.find((di: any) => addr.includes((di.name || '').toLowerCase()));
        if (d) setDisplayDistrict(d.name); else return;
        const wRes = await api.get(`/shipping/geo/wards/${d.id}`);
        const wards = wRes.data?.data || [];
        const w = wards.find((wa: any) => addr.includes((wa.name || '').toLowerCase()));
        if (w) setDisplayWard(w.name);
        try {
          const sRes = await api.get(`/shipping/geo/streets/${w.id}`);
          const streets = (sRes.data?.data || []).map((s: any) => typeof s === 'string' ? { name: s } : s);
          const s = streets.find((st: any) => addr.includes((st.name || '').toLowerCase()));
          if (s) setDisplayStreet(s.name);
        } catch {}
      } catch {}
    };
    // reset
    setDisplayProvince('-'); setDisplayDistrict('-'); setDisplayWard('-'); setDisplayStreet('-');
    parse();
  }, [open, customer]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560 } } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <Person />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>{customer?.name || 'Khách hàng'}</Typography>
          <Typography variant="body2" color="text.secondary">{customer?.email || 'Chưa có email'}</Typography>
        </Box>
        <IconButton aria-label="close details" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        <Tab label="Hồ sơ" {...a11yProps(0)} />
        <Tab label="Đơn hàng" icon={<ShoppingCart fontSize="small" />} iconPosition="start" {...a11yProps(1)} />
        <Tab label="Điểm" icon={<Loyalty fontSize="small" />} iconPosition="start" {...a11yProps(2)} />
        <Tab label="Ghi chú" icon={<Notes fontSize="small" />} iconPosition="start" {...a11yProps(3)} />
      </Tabs>

      {/* Tab Panels */}
      <Box role="tabpanel" id="cust-tabpanel-0" aria-labelledby="cust-tab-0" hidden={tab !== 0} sx={{ p: 2 }}>
        {tab === 0 && (
          <Box sx={{ p: 1 }}>
            <Box sx={{ p: 2, mb: 2, borderRadius: 2, background: 'linear-gradient(135deg,#f8f9ff 0%,#ffffff 100%)', border: '1px solid #eef2ff' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>👤 Thông tin khách hàng</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Số điện thoại:</strong> {customer?.phone || 'Chưa có'}</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Email:</strong> {customer?.email || 'Chưa có'}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip size="small" label={customer?.customer_type || 'regular'} color="primary" />
                <Chip size="small" label={customer?.is_active ? 'Active' : 'Inactive'} color={customer?.is_active ? 'success' : 'default'} />
              </Box>
            </Box>
            <Box sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg,#f8f9ff 0%,#ffffff 100%)', border: '1px solid #eef2ff' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>📍 Địa chỉ nhận hàng</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Tỉnh/TP:</strong> {customer?.province_name || '-'}</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Quận/Huyện:</strong> {customer?.district_name || '-'}</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Phường/Xã:</strong> {customer?.ward_name || '-'}</Typography>
              <Typography variant="body2"><strong>Đường/Ấp/Khu:</strong> {customer?.street || '-'}</Typography>
              {customer?.address && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{customer.address}</Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Box role="tabpanel" id="cust-tabpanel-1" aria-labelledby="cust-tab-1" hidden={tab !== 1} sx={{ p: 2 }}>
        {tab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tổng đơn hàng</Typography>
            <Typography variant="h6" fontWeight={700}>{customer?.total_orders || 0} đơn</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Tổng chi tiêu</Typography>
            <Typography variant="h6" fontWeight={700}>{formatCurrency(customer?.total_spent_cents || 0)}</Typography>
          </Box>
        )}
      </Box>

      <Box role="tabpanel" id="cust-tabpanel-2" aria-labelledby="cust-tab-2" hidden={tab !== 2} sx={{ p: 2 }}>
        {tab === 2 && (
          <Box>
            <Typography variant="body2" color="text.secondary">Điểm thưởng hiện tại</Typography>
            <Typography variant="h6" fontWeight={700}>{customer?.loyalty_points || 0} điểm</Typography>
          </Box>
        )}
      </Box>

      <Box role="tabpanel" id="cust-tabpanel-3" aria-labelledby="cust-tab-3" hidden={tab !== 3} sx={{ p: 2 }}>
        {tab === 3 && (
          <Box>
            <Typography variant="body2" color="text.secondary">Ghi chú</Typography>
            <Typography variant="body1">Chưa có ghi chú.</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CustomerDetailsDrawer;
