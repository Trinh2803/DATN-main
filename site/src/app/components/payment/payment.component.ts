import { Component, OnInit } from '@angular/core';
import { PaymentService, PaymentRequest } from '../../services/payment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class PaymentComponent implements OnInit {
  paymentData: PaymentRequest = {
    amount: 0,
    bankCode: '',
    language: 'vn',
    orderInfo: ''
  };

  banks = [
    { code: '', name: 'Chọn ngân hàng (không bắt buộc)' },
    { code: 'NCB', name: 'NCB' },
    { code: 'SCB', name: 'SCB' },
    { code: 'SACOMBANK', name: 'SACOMBANK' },
    { code: 'EXIMBANK', name: 'EXIMBANK' },
    { code: 'MSBANK', name: 'MSBANK' },
    { code: 'NAMABANK', name: 'NAMABANK' },
    { code: 'VNMART', name: 'VNMART' },
    { code: 'VIETINBANK', name: 'VIETINBANK' },
    { code: 'VIETCOMBANK', name: 'VIETCOMBANK' },
    { code: 'HDBANK', name: 'HDBANK' },
    { code: 'DONGABANK', name: 'DONGABANK' },
    { code: 'TPBANK', name: 'TPBANK' },
    { code: 'AGRIBANK', name: 'AGRIBANK' },
    { code: 'ACB', name: 'ACB' },
    { code: 'OCB', name: 'OCB' },
    { code: 'SHB', name: 'SHB' },
    { code: 'TECHCOMBANK', name: 'TECHCOMBANK' }
  ];

  languages = [
    { code: 'vn', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' }
  ];

  isLoading = false;
  paymentResult: any = null;
  errorMessage = '';

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (!this.paymentData.amount || this.paymentData.amount <= 0) {
      this.errorMessage = 'Vui lòng nhập số tiền hợp lệ';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.paymentResult = null;

    this.paymentService.createPayment(this.paymentData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.code === '00') {
          this.paymentResult = response;
          this.paymentService.openPaymentPage(response.data);
        } else {
          this.errorMessage = response.message || 'Có lỗi xảy ra';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
        console.error('Payment error:', error);
      }
    });
  }

  resetForm(): void {
    this.paymentData = {
      amount: 0,
      bankCode: '',
      language: 'vn',
      orderInfo: ''
    };
    this.paymentResult = null;
    this.errorMessage = '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  openPaymentPage(): void {
    if (this.paymentResult && this.paymentResult.data) {
      this.paymentService.openPaymentPage(this.paymentResult.data);
    }
  }
} 