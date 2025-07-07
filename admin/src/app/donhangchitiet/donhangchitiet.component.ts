import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../services/order.service';
import { Order, ApiResponse } from '../interfaces/order-response.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-donhangchitiet',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './donhangchitiet.component.html',
  styleUrls: ['./donhangchitiet.component.css'],
})
export class DonhangchitietComponent implements OnInit, AfterViewInit {
  order: Order | null = null;
  errorMessage: string | undefined;
  userAvatar: string = '/assets/images/icon.png';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Vui lòng đăng nhập.';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      this.router.navigate(['/login']);
      return;
    }

    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.errorMessage = 'Không tìm thấy ID đơn hàng.';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      this.router.navigate(['/quanlydonhang']);
    }

    this.loadUserAvatar();
  }

  ngAfterViewInit(): void {
    // Xử lý icons trong sidebar
    document.querySelectorAll('.icon').forEach((ico) => {
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  loadOrderDetails(orderId: string): void {
    this.orderService.getOrderById(orderId).subscribe({
      next: (response: ApiResponse<Order>) => {
        if (response.success && response.data) {
          this.order = response.data;
          this.errorMessage = undefined;
          console.log('Order details loaded:', this.order);
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy chi tiết đơn hàng.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
          this.router.navigate(['/quanlydonhang']);
        }
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
            : err.error?.message || err.message || 'Lỗi khi lấy chi tiết đơn hàng.';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadUserAvatar(): void {
    const avatar = localStorage.getItem('userAvatar') || '/assets/images/icon.png';
    this.userAvatar = avatar;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userAvatar');
    console.log('Logging out');
    Swal.fire('Thành công', 'Đăng xuất thành công', 'success');
    this.router.navigate(['/login']);
  }
}