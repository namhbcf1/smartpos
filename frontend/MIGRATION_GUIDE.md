# 🔄 Migration Guide - Dashboard Optimization

## 📋 Hướng dẫn chuyển đổi từ Dashboard cũ sang Dashboard tối ưu

### 1. Backup Dashboard cũ (Tùy chọn)

```bash
# Backup Dashboard.tsx hiện tại
cp src/pages/Dashboard.tsx src/pages/Dashboard.backup.tsx
```

### 2. Thay thế Dashboard.tsx

```bash
# Thay thế Dashboard cũ bằng version tối ưu
mv src/pages/DashboardOptimized.tsx src/pages/Dashboard.tsx
```

### 3. Update imports trong App.tsx (nếu cần)

Kiểm tra file `src/App.tsx` hoặc router config để đảm bảo import đúng:

```typescript
// Đảm bảo import này vẫn hoạt động
import Dashboard from './pages/Dashboard';
```

### 4. Test các tính năng

Kiểm tra các tính năng sau hoạt động bình thường:

- ✅ **Stats Cards**: Hiển thị doanh thu, đơn hàng, sản phẩm
- ✅ **Charts**: Line chart, pie chart, bar chart
- ✅ **Recent Activity**: Giao dịch gần đây, sản phẩm sắp hết
- ✅ **Speed Dial**: Quick actions (bán hàng, thêm sản phẩm, etc.)
- ✅ **Settings**: Dark mode, auto refresh, fullscreen
- ✅ **Time Period**: Selector cho today/week/month/quarter

### 5. Verify Performance Improvements

```bash
# Chạy development server
npm run dev

# Mở DevTools → Performance tab
# Record performance khi load Dashboard
# So sánh với version cũ (nếu có backup)
```

### 6. Update useApiData imports (nếu cần)

Nếu có components khác sử dụng useApiData, có thể chuyển sang version tối ưu:

```typescript
// Cũ
import { usePaginatedQuery } from '../hooks/useApiData';

// Mới (tùy chọn)
import { usePaginatedQuery } from '../hooks/useApiDataOptimized';
```

## 🔧 Troubleshooting

### Lỗi thường gặp:

**1. Import errors:**
```
Module not found: Can't resolve '../components/dashboard/...'
```
**Giải pháp**: Đảm bảo tất cả dashboard components đã được tạo trong `src/components/dashboard/`

**2. TypeScript errors:**
```
Property 'xxx' does not exist on type 'yyy'
```
**Giải pháp**: Import types từ `src/types/api.ts`:
```typescript
import { DashboardStats, Product, Sale } from '../types/api';
```

**3. Chart library errors:**
```
Module not found: Can't resolve 'recharts'
```
**Giải pháp**: Install recharts nếu chưa có:
```bash
npm install recharts @types/recharts
```

**4. Date picker errors:**
```
Module not found: Can't resolve '@mui/x-date-pickers'
```
**Giải pháp**: Install MUI date pickers:
```bash
npm install @mui/x-date-pickers
```

### Performance Issues:

**1. Dashboard load chậm:**
- Kiểm tra API response time
- Verify caching hoạt động đúng
- Check network tab trong DevTools

**2. Memory leaks:**
- Mở DevTools → Memory tab
- Take heap snapshots trước/sau navigation
- Verify cleanup hooks hoạt động

## 🎯 Expected Results

Sau khi migration thành công:

- **Dashboard load time**: Giảm 40-60%
- **Bundle size**: Giảm nhờ code splitting
- **Type safety**: 100% TypeScript coverage
- **Maintainability**: Dễ maintain với components nhỏ
- **Performance**: Smooth scrolling, no memory leaks
- **User Experience**: Responsive, fast interactions

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:

1. **Check console errors** (DevTools → Console)
2. **Verify all files created** theo danh sách trên
3. **Test từng component riêng lẻ** trước khi test tổng thể
4. **Rollback nếu cần**: Sử dụng Dashboard.backup.tsx

## 🚀 Next Steps

Sau khi Dashboard migration thành công:

1. **Apply tương tự cho Sales.tsx** (638 lines → components nhỏ)
2. **Optimize Products.tsx** với virtual scrolling
3. **Add unit tests** cho các components mới
4. **Implement React Query** cho advanced caching
5. **Add Storybook** cho component documentation
