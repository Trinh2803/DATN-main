# Hướng dẫn tích hợp thanh toán VNPay

## Cấu hình

### 1. Thông tin VNPay
- **TMN Code**: 11C2Q5KU (sandbox)
- **Hash Secret**: QJCHXRBOHGMEULTKFURYSZCNODWIBZ (sandbox)
- **URL**: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html (sandbox)

### 2. Các file đã tạo
- `src/config/vnpayConfig.js` - Cấu hình VNPay
- `src/controllers/paymentController.js` - Controller xử lý thanh toán
- `src/routes/payment.js` - Route thanh toán
- `test-payment.html` - File test thanh toán

## API Endpoints

### 1. Tạo URL thanh toán
**POST** `/payment/create_payment_url`

**Request Body:**
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

### 2. Nhận kết quả thanh toán
**GET** `/payment/vnpay_return`

**Response thành công:**
```json
{
    "code": "00",
    "message": "Transaction successful",
    "data": {
        "vnp_ResponseCode": "00",
        "vnp_TxnRef": "2025073012542372936",
        "vnp_Amount": "148000000",
        ...
    }
}
```

## Cách sử dụng

### 1. Khởi động server
```bash
cd DATN-main/API
npm start
```

### 2. Test thanh toán
- Mở file `test-payment.html` trong trình duyệt
- Điền thông tin thanh toán
- Click "Tạo URL thanh toán"
- Click "Mở trang thanh toán" để chuyển đến VNPay

### 3. Tích hợp vào frontend

**Angular Service:**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:3000/payment';

  constructor(private http: HttpClient) { }

  createPayment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create_payment_url`, data);
  }
}
```

**Component sử dụng:**
```typescript
import { Component } from '@angular/core';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-payment',
  template: `
    <button (click)="createPayment()">Thanh toán</button>
  `
})
export class PaymentComponent {
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
          window.open(response.data, '_blank');
        }
      },
      error: (error) => {
        console.error('Lỗi thanh toán:', error);
      }
    });
  }
}
```

## Lưu ý quan trọng

1. **Môi trường test**: Hiện tại đang sử dụng sandbox VNPay
2. **Số tiền**: Phải nhân với 100 (VNPay yêu cầu)
3. **Chữ ký**: Tự động tạo và xác thực
4. **IP Address**: Tự động lấy từ request
5. **Mã đơn hàng**: Tự động tạo theo format YYYYMMDDHHmmss + random

## Cấu hình production

Để chuyển sang production, cần:

1. Đăng ký tài khoản merchant với VNPay
2. Cập nhật thông tin trong `vnpayConfig.js`:
   - `vnp_TmnCode`: Mã merchant thật
   - `vnp_HashSecret`: Hash secret thật
   - `vnp_Url`: URL production
   - `vnp_ReturnUrl`: URL callback thật

3. Sử dụng biến môi trường:
```javascript
const vnpayConfig = {
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_HashSecret: process.env.VNP_HASH_SECRET,
    vnp_Url: process.env.VNP_URL,
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
};
```

## Xử lý lỗi

- **Code 00**: Thành công
- **Code 97**: Chữ ký không hợp lệ
- **Code 99**: Lỗi hệ thống
- **Code khác**: Lỗi từ VNPay (xem tài liệu VNPay) 