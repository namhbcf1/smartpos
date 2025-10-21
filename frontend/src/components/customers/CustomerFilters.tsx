import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

export interface CustomerFilters {
  type?: string;
  status?: string;
  pointsMin?: number | '';
  pointsMax?: number | '';
  dobMonth?: number | '';
  hasContact?: boolean;
}

interface Props {
  value: CustomerFilters;
  onChange: (next: CustomerFilters) => void;
  onReset: () => void;
}

const CustomerFilters: React.FC<Props> = ({ value, onChange, onReset }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: 160 }}>
        <InputLabel>Loại KH</InputLabel>
        <Select label="Loại KH" value={value.type || ''} onChange={(e) => onChange({ ...value, type: String(e.target.value) || undefined })}>
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="regular">Thường</MenuItem>
          <MenuItem value="premium">Premium</MenuItem>
          <MenuItem value="vip">VIP</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 160 }}>
        <InputLabel>Trạng thái</InputLabel>
        <Select label="Trạng thái" value={value.status || ''} onChange={(e) => onChange({ ...value, status: String(e.target.value) || undefined })}>
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="active">Đang hoạt động</MenuItem>
          <MenuItem value="inactive">Ngưng</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Điểm tối thiểu"
        type="number"
        value={value.pointsMin === '' ? '' : value.pointsMin}
        onChange={(e) => onChange({ ...value, pointsMin: e.target.value === '' ? '' : Number(e.target.value) })}
        sx={{ width: 160 }}
      />
      <TextField
        label="Điểm tối đa"
        type="number"
        value={value.pointsMax === '' ? '' : value.pointsMax}
        onChange={(e) => onChange({ ...value, pointsMax: e.target.value === '' ? '' : Number(e.target.value) })}
        sx={{ width: 160 }}
      />

      <FormControl sx={{ minWidth: 160 }}>
        <InputLabel>Tháng sinh</InputLabel>
        <Select label="Tháng sinh" value={(value.dobMonth as any) ?? ''} onChange={(e) => onChange({ ...value, dobMonth: e.target.value === '' ? '' : Number(e.target.value) })}>
          <MenuItem value="">Tất cả</MenuItem>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 160 }}>
        <InputLabel>Liên hệ</InputLabel>
        <Select label="Liên hệ" value={value.hasContact == null ? '' : value.hasContact ? 'yes' : 'no'} onChange={(e) => {
          const v = String(e.target.value);
          onChange({ ...value, hasContact: v === '' ? undefined : v === 'yes' });
        }}>
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="yes">Có email/điện thoại</MenuItem>
          <MenuItem value="no">Không có</MenuItem>
        </Select>
      </FormControl>

      <Button variant="outlined" onClick={onReset}>Đặt lại</Button>
    </Box>
  );
};

export default CustomerFilters;
