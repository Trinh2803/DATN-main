import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VNPayCallbackService } from '../../services/vnpay-callback.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css']
})
export class InvoiceComponent implements OnInit {
  invoice: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vnpayCallbackService: VNPayCallbackService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      if (orderId) {
        this.loadInvoice(orderId);
      } else {
        this.error = 'Không tìm thấy mã đơn hàng';
        this.loading = false;
      }
    });
  }

  loadInvoice(orderId: string): void {
    this.vnpayCallbackService.getInvoice(orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.invoice = response.data;
        } else {
          this.error = response.message || 'Không thể tải thông tin hóa đơn';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.error = 'Lỗi khi tải thông tin hóa đơn';
        this.loading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  printInvoice(): void {
    window.print();
  }

  goToOrders(): void {
    this.router.navigate(['/donhang']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
