import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CartService } from '../cart.service';
import { UserService } from '../user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VNPayCallbackService {

  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CartService,
    private userService: UserService
  ) { }

  // Xử lý callback từ VNPay và tạo đơn hàng
  handlePaymentSuccess(paymentData: any): Observable<any> {
    const pendingOrder = localStorage.getItem('pendingVNPayOrder');
    if (!pendingOrder) {
      throw new Error('Không tìm thấy thông tin đơn hàng');
    }

    const orderData = JSON.parse(pendingOrder);
    
    // Cập nhật trạng thái đơn hàng
    orderData.status = 'Đã thanh toán';
    orderData.paymentTransactionId = paymentData.vnp_TxnRef;
    orderData.paymentAmount = paymentData.vnp_Amount;
    orderData.paymentBankCode = paymentData.vnp_BankCode;
    orderData.paymentDate = paymentData.vnp_PayDate;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post('http://localhost:3000/orders', orderData, { headers });
  }

  // Xử lý sau khi tạo đơn hàng thành công
  onOrderCreated(orderId: string): void {
    // Xóa thông tin đơn hàng tạm
    localStorage.removeItem('pendingVNPayOrder');
    localStorage.removeItem('pendingOrder');
    
    // Xóa giỏ hàng
    this.cartService.clearCart();
    
    // Chuyển đến trang đơn hàng
    this.router.navigate(['/donhang'], {
      queryParams: { orderId }
    });
  }

  // Xử lý lỗi thanh toán
  handlePaymentError(error: any): void {
    console.error('Payment error:', error);
    alert('Thanh toán thất bại. Vui lòng thử lại sau.');
    
    // Chuyển về trang checkout
    this.router.navigate(['/checkout']);
  }
} 