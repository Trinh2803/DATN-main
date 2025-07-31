# Hướng dẫn Test Thanh toán VNPay

## 🚀 Cách Test Nhanh

### 1. Khởi động Backend
```bash
cd DATN-main/API
npm start
```

### 2. Test API Thanh toán
- Mở file `DATN-main/API/test-payment.html` trong trình duyệt
- Điền thông tin thanh toán:
  - **Số tiền**: 1480000 VND
  - **Ngân hàng**: NCB (hoặc để trống)
  - **Ngôn ngữ**: vn
  - **Thông tin đơn hàng**: Thanh toán test
- Click "Tạo URL thanh toán"
- Click "Mở trang thanh toán" để chuyển đến VNPay Sandbox

### 3. Test Frontend Angular
```bash
cd DATN-main/site
ng serve
```
- Truy cập: `http://localhost:4200/payment`
- Điền thông tin và test thanh toán

## 📋 Thông tin Test VNPay Sandbox

### Tài khoản Test
- **TMN Code**: 11C2Q5KU
- **Hash Secret**: QJCHXRBOHGMEULTKFURYSZCNODWIBZ
- **URL**: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

### Thẻ Test
- **Ngân hàng**: NCB
- **Số thẻ**: 9704198526191432198
- **Tên chủ thẻ**: NGUYEN VAN A
- **Ngày phát hành**: 07/15
- **OTP**: 123456

## 🔗 API Endpoints

### Tạo URL thanh toán
```
POST http://localhost:3000/payment/create_payment_url
Content-Type: application/json

{
  "amount": 1480000,
  "bankCode": "NCB",
  "language": "vn",
  "orderInfo": "Thanh toán đơn hàng"
}
```

### Xử lý kết quả
```
GET http://localhost:3000/payment/vnpay_return?vnp_ResponseCode=00&vnp_TxnRef=...
```

## ✅ Kiểm tra hoạt động

1. **Backend hoạt động**: API trả về URL thanh toán
2. **VNPay Sandbox**: Chuyển đến trang thanh toán VNPay
3. **Thanh toán thành công**: Chuyển về trang kết quả
4. **Frontend**: Component payment hiển thị đúng

## 🐛 Troubleshooting

### Lỗi thường gặp
- **CORS error**: Kiểm tra cấu hình CORS trong backend
- **Chữ ký không hợp lệ**: Kiểm tra Hash Secret
- **Số tiền không đúng**: Đảm bảo nhân với 100

### Debug
- Mở DevTools (F12) để xem console
- Kiểm tra Network tab để xem API calls
- Kiểm tra log server trong terminal

## 📁 File quan trọng

- `DATN-main/API/src/config/vnpayConfig.js` - Cấu hình VNPay
- `DATN-main/API/src/controllers/paymentController.js` - Logic xử lý
- `DATN-main/API/src/routes/payment.js` - API routes
- `DATN-main/site/src/app/services/payment.service.ts` - Frontend service
- `DATN-main/site/src/app/components/payment/` - Component thanh toán

## 🎯 Kết quả mong đợi

1. ✅ Backend tạo URL thanh toán thành công
2. ✅ Chuyển đến VNPay Sandbox
3. ✅ Thanh toán test thành công
4. ✅ Chuyển về trang kết quả
5. ✅ Hiển thị thông tin giao dịch

---
**Lưu ý**: Đây là môi trường test (sandbox). Để chuyển sang production, cần đăng ký tài khoản merchant với VNPay. 