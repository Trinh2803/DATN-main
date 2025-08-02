# Hướng dẫn tích hợp thanh toán VNPay

## Tổng quan

Dự án đã được tích hợp thanh toán VNPay với đầy đủ các chức năng:
- Tạo URL thanh toán
- Xử lý kết quả trả về từ VNPay
- Giao diện thanh toán đẹp mắt
- Xử lý lỗi và thông báo

## Cấu trúc file đã tạo

### Backend (API)
```
DATN-main/API/
├── src/
│   ├── config/
│   │   └── vnpayConfig.js          # Cấu hình VNPay
│   ├── controllers/
│   │   └── paymentController.js     # Controller xử lý thanh toán
│   └── routes/
│       └── payment.js              # Route thanh toán
├── test-payment.html               # File test thanh toán
└── README_VNPAY.md                # Hướng dẫn chi tiết
```

### Frontend (Angular)
```
DATN-main/site/src/app/
├── services/
│   └── payment.service.ts          # Service thanh toán
└── components/
    ├── payment/
    │   ├── payment.component.ts    # Component thanh toán
    │   ├── payment.component.html  # Template thanh toán
    │   └── payment.component.css   # CSS thanh toán
    └── payment-result/
        ├── payment-result.component.ts    # Component kết quả
        ├── payment-result.component.html  # Template kết quả
        └── payment-result.component.css   # CSS kết quả
```

## Cách sử dụng

### 1. Khởi động Backend
```bash
cd DATN-main/API
npm start
```

### 2. Test API thanh toán
- Mở file `DATN-main/API/test-payment.html` trong trình duyệt
- Điền thông tin thanh toán
- Click "Tạo URL thanh toán"
- Click "Mở trang thanh toán" để chuyển đến VNPay

### 3. Tích hợp vào Angular
- Import `PaymentService` vào component cần sử dụng
- Sử dụng method `createPayment()` để tạo URL thanh toán
- Xử lý kết quả trả về từ VNPay

## API Endpoints

### POST /payment/create_payment_url
Tạo URL thanh toán VNPay

**Request:**
```json
{
  "amount": 1480000,
  "bankCode": "NCB",
  "language": "vn",
  "orderInfo": "Thanh toán đơn hàng"
}
```

**Response:**
```json
{
  "code": "00",
  "message": "Success",
  "data": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "orderId": "2025073012542372936",
  "amount": 148000000
}
```

### GET /payment/vnpay_return
Xử lý kết quả trả về từ VNPay

**Response thành công:**
```json
{
  "code": "00",
  "message": "Transaction successful",
  "data": {
    "vnp_ResponseCode": "00",
    "vnp_TxnRef": "2025073012542372936",
    "vnp_Amount": "148000000",
    "vnp_BankCode": "NCB",
    "vnp_PayDate": "20250730125423"
  }
}
```

## Cấu hình VNPay

### Sandbox (Test)
- **TMN Code**: 11C2Q5KU
- **Hash Secret**: QJCHXRBOHGMEULTKFURYSZCNODWIBZ
- **URL**: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
- **Return URL**: http://localhost:3000/payment/vnpay_return

### Production
Để chuyển sang production, cần:
1. Đăng ký tài khoản merchant với VNPay
2. Cập nhật thông tin trong `vnpayConfig.js`
3. Sử dụng biến môi trường

## Ví dụ sử dụng trong Angular

### Service
```typescript
import { PaymentService } from '../services/payment.service';

constructor(private paymentService: PaymentService) {}

createPayment() {
  const paymentData = {
    amount: 1480000,
    bankCode: 'NCB',
    language: 'vn',
    orderInfo: 'Thanh toán đơn hàng'
  };

  this.paymentService.createPayment(paymentData).subscribe({
    next: (response) => {
      if (response.code === '00') {
        this.paymentService.openPaymentPage(response.data);
      }
    },
    error: (error) => {
      console.error('Lỗi thanh toán:', error);
    }
  });
}
```

### Component
```typescript
// Sử dụng component có sẵn
<app-payment></app-payment>

// Hoặc tạo component tùy chỉnh
<app-payment-result></app-payment-result>
```

## Xử lý lỗi

### Mã lỗi VNPay
- **00**: Giao dịch thành công
- **07**: Giao dịch bị nghi ngờ
- **09**: Thẻ chưa đăng ký Internet Banking
- **10**: Xác thực thông tin không đúng
- **11**: Hết hạn chuyển tiền tự động
- **12**: Thẻ bị khóa
- **13**: Sai mật khẩu OTP
- **20**: Khách hàng hủy giao dịch
- **65**: Tài khoản bị khóa
- **75**: Ngân hàng bảo trì
- **79**: Sai mật khẩu quá số lần
- **97**: Chữ ký không hợp lệ
- **99**: Lỗi khác

## Lưu ý quan trọng

1. **Số tiền**: VNPay yêu cầu số tiền nhân với 100
2. **Chữ ký**: Tự động tạo và xác thực
3. **IP Address**: Tự động lấy từ request
4. **Mã đơn hàng**: Tự động tạo theo format YYYYMMDDHHmmss + random
5. **Môi trường test**: Hiện tại đang sử dụng sandbox VNPay

## Bảo mật

1. **Hash Secret**: Không được chia sẻ công khai
2. **Validation**: Luôn kiểm tra chữ ký từ VNPay
3. **Amount**: Kiểm tra số tiền trả về có khớp với số tiền gửi đi
4. **Order ID**: Đảm bảo mã đơn hàng duy nhất

## Troubleshooting

### Lỗi thường gặp
1. **Chữ ký không hợp lệ**: Kiểm tra Hash Secret
2. **Số tiền không đúng**: Đảm bảo nhân với 100
3. **URL không hoạt động**: Kiểm tra cấu hình VNPay
4. **CORS error**: Kiểm tra cấu hình CORS trong backend

### Debug
- Kiểm tra console browser
- Kiểm tra log server
- Sử dụng Postman để test API
- Kiểm tra network tab trong DevTools

## Tài liệu tham khảo

- [VNPay Documentation](https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop)
- [VNPay Sandbox](https://sandbox.vnpayment.vn/merchantv2/)
- [VNPay Production](https://merchant.vnpayment.vn/) 