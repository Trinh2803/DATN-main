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
    
    // Chuẩn bị dữ liệu để gửi đến endpoint mới
    const requestData = {
      orderData: orderData,
      vnpayData: paymentData
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Sử dụng endpoint mới để tạo đơn hàng sau thanh toán VNPay
    return this.http.post('http://localhost:3000/payment/create_order_after_payment', requestData, { headers });
  }

  // Lấy thông tin hóa đơn
  getInvoice(orderId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`http://localhost:3000/payment/invoice/${orderId}`, { headers });
  }

  // Xử lý sau khi tạo đơn hàng thành công
  onOrderCreated(orderId: string): void {
    console.log('onOrderCreated called with orderId:', orderId);
    
    // Xóa thông tin đơn hàng tạm
    localStorage.removeItem('pendingVNPayOrder');
    localStorage.removeItem('pendingOrder');
    
    // Xóa giỏ hàng
    this.cartService.clearCart();
    
    console.log('Navigating to invoice page with orderId:', orderId);
    
    // Chuyển đến trang hóa đơn điện tử để hiển thị thông tin chi tiết
    this.router.navigate(['/invoice'], {
      queryParams: { orderId }
    }).then(success => {
      console.log('Navigation to invoice page success:', success);
      if (!success) {
        console.error('Navigation failed, trying alternative method');
        // Fallback: sử dụng window.location
        window.location.href = `/invoice?orderId=${orderId}`;
      }
    }).catch(error => {
      console.error('Navigation error:', error);
      // Fallback: sử dụng window.location
      window.location.href = `/invoice?orderId=${orderId}`;
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