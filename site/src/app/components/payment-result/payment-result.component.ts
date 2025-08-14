import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { VNPayCallbackService } from '../../services/vnpay-callback.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class PaymentResultComponent implements OnInit {
  paymentResult: any = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private vnpayCallbackService: VNPayCallbackService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        this.handlePaymentReturn(params);
      } else {
        this.isLoading = false;
        this.errorMessage = 'Không có dữ liệu thanh toán';
      }
    });
  }

  private handlePaymentReturn(params: any): void {
    // Xử lý trực tiếp query params từ VNPay thay vì gọi API
    this.isLoading = false;
    
    // Tạo response object từ params
    this.paymentResult = {
      code: params.vnp_ResponseCode || '99',
      message: params.vnp_ResponseCode === '00' ? 'Transaction successful' : 'Transaction failed',
      data: params
    };
    
    // Nếu thanh toán thành công, tạo đơn hàng
    if (this.isPaymentSuccessful()) {
      this.createOrderAfterPayment();
    }
  }

  private createOrderAfterPayment(): void {
    const paymentData = this.getPaymentDetails();
    this.isLoading = true;
    
    this.vnpayCallbackService.handlePaymentSuccess(paymentData).subscribe({
      next: (response: any) => {
        console.log('Order created successfully:', response);
        const orderId = response.data._id;
        
        // Hiển thị thông báo thành công
        alert('Đơn hàng đã được tạo thành công! Đang chuyển đến trang hóa đơn...');
        
        // Chuyển đến trang hóa đơn
        this.vnpayCallbackService.onOrderCreated(orderId);
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.isLoading = false;
        this.errorMessage = 'Lỗi khi tạo đơn hàng: ' + (error.error?.message || error.message || 'Vui lòng thử lại');
        this.vnpayCallbackService.handlePaymentError(error);
      }
    });
  }

  isPaymentSuccessful(): boolean {
    return this.paymentResult && this.paymentService.isPaymentSuccessful(this.paymentResult.data?.vnp_ResponseCode);
  }

  getPaymentMessage(): string {
    if (!this.paymentResult) return '';
    
    const responseCode = this.paymentResult.data?.vnp_ResponseCode;
    if (responseCode) {
      return this.paymentService.getPaymentErrorMessage(responseCode);
    }
    return this.paymentResult.message || 'Không có thông tin';
  }

  getPaymentDetails(): any {
    return this.paymentResult?.data || {};
  }

  formatCurrency(amount: string): string {
    if (!amount) return '0 VND';
    const numAmount = parseInt(amount) / 100; // VNPay trả về số tiền nhân với 100
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numAmount);
  }

  goToHome(): void {
    // Điều hướng về trang chủ hoặc trang đơn hàng
    window.location.href = '/';
  }

  retryPayment(): void {
    // Có thể điều hướng về trang thanh toán để thử lại
    window.location.href = '/payment';
  }
} 