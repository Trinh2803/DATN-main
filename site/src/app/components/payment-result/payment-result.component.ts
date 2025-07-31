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
    this.paymentService.handlePaymentReturn(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.paymentResult = response;
        
        // Nếu thanh toán thành công, tạo đơn hàng
        if (this.isPaymentSuccessful()) {
          this.createOrderAfterPayment();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Không thể xử lý kết quả thanh toán';
        console.error('Payment return error:', error);
      }
    });
  }

  private createOrderAfterPayment(): void {
    const paymentData = this.getPaymentDetails();
    this.vnpayCallbackService.handlePaymentSuccess(paymentData).subscribe({
      next: (response: any) => {
        const orderId = response.data._id;
        this.vnpayCallbackService.onOrderCreated(orderId);
      },
      error: (error) => {
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