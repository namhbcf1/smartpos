// Used by: frontend/src/pages/public/WarrantyCheck.tsx
import api from './api';

export const warrantyCheckApi_WarrantyChecktsx = {
  byCode: (warrantyCode: string) =>
    api.get('/public/warranty-check', { params: { warranty_code: warrantyCode } }),
  byPhone: (phone: string) =>
    api.get('/public/warranty-check', { params: { phone } }),
  bySerial: (serial: string) =>
    api.get('/public/warranty-check', { params: { serial } }),
};

export default warrantyCheckApi_WarrantyChecktsx;

