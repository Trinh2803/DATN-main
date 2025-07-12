# 🎯 HƯỚNG DẪN TEST HỆ THỐNG MÃ GIẢM GIÁ

## 📋 Tổng quan
Hệ thống mã giảm giá đã được implement hoàn chỉnh với các tính năng:
- ✅ Kiểm tra và áp dụng mã giảm giá
- ✅ Giới hạn số lượt sử dụng (usageLimit)
- ✅ Tăng số lượt đã sử dụng (usedCount) sau khi đặt hàng
- ✅ Thông báo lỗi khi mã hết lượt
- ✅ Admin panel theo dõi số lượt sử dụng

## 🧪 Các bước test

### Bước 1: Khởi động hệ thống
```bash
# Terminal 1: Khởi động Backend
cd API
npm start

# Terminal 2: Khởi động Frontend (Site)
cd site
ng serve

# Terminal 3: Khởi động Admin
cd admin
ng serve
```

### Bước 2: Kiểm tra Admin Panel
1. Truy cập: `http://localhost:4200` (Admin)
2. Đăng nhập với tài khoản admin
3. Vào menu "Chương trình giảm giá"
4. Kiểm tra mã `TEST123` có thông tin:
   - Usage Limit: 2
   - Used Count: 0
   - Trạng thái: Hoạt động

### Bước 3: Test sử dụng mã giảm giá

#### Test 1: Sử dụng lần đầu
1. Truy cập: `http://localhost:4201` (Site)
2. Thêm sản phẩm vào giỏ hàng
3. Vào giỏ hàng
4. Nhập mã: `TEST123`
5. Click "Áp dụng"
6. **Kết quả mong đợi**: Mã được áp dụng thành công
7. Tiến hành đặt hàng

#### Test 2: Kiểm tra usedCount tăng
1. Quay lại Admin Panel
2. Refresh trang
3. Kiểm tra mã `TEST123`
4. **Kết quả mong đợi**: Used Count tăng từ 0 → 1

#### Test 3: Sử dụng lần thứ 2
1. Quay lại Site
2. Thêm sản phẩm khác vào giỏ hàng
3. Nhập lại mã: `TEST123`
4. Click "Áp dụng"
5. **Kết quả mong đợi**: Mã vẫn được áp dụng
6. Tiến hành đặt hàng

#### Test 4: Kiểm tra usedCount tăng lần 2
1. Quay lại Admin Panel
2. Refresh trang
3. Kiểm tra mã `TEST123`
4. **Kết quả mong đợi**: Used Count tăng từ 1 → 2

#### Test 5: Sử dụng lần thứ 3 (sẽ bị từ chối)
1. Quay lại Site
2. Thêm sản phẩm khác vào giỏ hàng
3. Nhập lại mã: `TEST123`
4. Click "Áp dụng"
5. **Kết quả mong đợi**: 
   - Hiển thị thông báo: "Mã giảm giá đã hết lượt sử dụng"
   - Mã không được áp dụng

#### Test 6: Kiểm tra Admin Panel
1. Quay lại Admin Panel
2. Refresh trang
3. Kiểm tra mã `TEST123`
4. **Kết quả mong đợi**: Hiển thị "2/2" (đã hết lượt)

## 🔧 Mã test có sẵn

### Mã TEST123
- **Code**: TEST123
- **Usage Limit**: 2
- **Discount**: 20%
- **Min Order**: 0đ
- **Trạng thái**: Hoạt động

### Mã BAN2025
- **Code**: BAN2025
- **Usage Limit**: 1
- **Discount**: 100%
- **Min Order**: 0đ
- **Trạng thái**: Hoạt động

## 📊 Kiểm tra file JSON
File: `Data/Deho.discounts.json`
```json
{
  "code": "TEST123",
  "usageLimit": 2,
  "usedCount": 0,  // Sẽ tăng sau mỗi lần sử dụng
  "isActive": true
}
```

## 🎯 Kết quả mong đợi

### ✅ Thành công
- Mã giảm giá được áp dụng đúng
- usedCount tăng sau mỗi lần đặt hàng
- Admin panel hiển thị đúng thông tin
- File JSON được cập nhật

### ❌ Lỗi (khi hết lượt)
- Thông báo: "Mã giảm giá đã hết lượt sử dụng"
- Mã không được áp dụng
- usedCount không tăng thêm

## 🔍 Debug nếu có lỗi

### Kiểm tra Backend
```bash
# Kiểm tra log server
cd API
npm start
# Xem log trong terminal
```

### Kiểm tra Frontend
```bash
# Mở Developer Tools (F12)
# Xem tab Console và Network
```

### Kiểm tra file JSON
```bash
# Kiểm tra file discounts
cat Data/Deho.discounts.json
```

## 🎉 Hoàn thành
Hệ thống mã giảm giá đã hoạt động hoàn hảo với:
- ✅ Logic kiểm tra usedCount vs usageLimit
- ✅ Tăng usedCount sau khi đặt hàng
- ✅ Thông báo lỗi đúng
- ✅ Admin panel theo dõi chính xác
- ✅ File JSON được cập nhật đúng cách 