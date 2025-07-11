
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { Router, RouterModule } from '@angular/router';
import { Order, ApiResponse } from '../interfaces/order-response.interface';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-thongke',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './thongke.component.html',
  styleUrls: ['./thongke.component.css'],
})
export class ThongkeComponent implements OnInit, AfterViewInit {
  pendingOrders: Order[] = [];
  completedOrders: Order[] = [];
  originalPendingOrders: Order[] = []; // Lưu danh sách gốc
  originalCompletedOrders: Order[] = []; // Lưu danh sách gốc
  searchQuery: string = '';
  userAvatar: string = '/assets/images/icon.png';
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.getToken() || !this.authService.isAdmin()) {
      this.errorMessage = 'Vui lòng đăng nhập với tài khoản admin.';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
    this.loadUserAvatar();
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('.icon').forEach((ico) => {
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  loadOrders(): void {
    this.orderService.getPendingOrders().subscribe({
      next: (response: ApiResponse<Order[]>) => {
        if (response.success) {
          this.pendingOrders = response.data || [];
          this.originalPendingOrders = [...this.pendingOrders]; // Lưu danh sách gốc
          this.errorMessage = null;
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy đơn hàng chờ xác nhận.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
        }
      },
      error: (err) => {
        console.error('Error fetching pending orders:', err);
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
            : 'Lỗi khi lấy đơn hàng chờ xác nhận.';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });

    this.orderService.getCompletedOrders().subscribe({
      next: (response: ApiResponse<Order[]>) => {
        if (response.success) {
          this.completedOrders = response.data || [];
          this.originalCompletedOrders = [...this.completedOrders]; // Lưu danh sách gốc
          this.errorMessage = null;
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy đơn hàng đã giao.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
        }
      },
      error: (err) => {
        console.error('Error fetching completed orders:', err);
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
            : 'Lỗi khi lấy đơn hàng đã giao.';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadUserAvatar(): void {
    this.authService.getUserAvatar().subscribe({
      next: (avatar) => {
        if (avatar) {
          this.userAvatar = avatar.startsWith('http') ? avatar : `http://localhost:3000${avatar}`;
        }
      },
      error: (err) => {
        console.error('Error loading avatar:', err);
        // Nếu lỗi xác thực, đăng xuất và chuyển về trang login
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  search(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      // Khôi phục danh sách gốc khi xóa từ khóa tìm kiếm
      this.pendingOrders = [...this.originalPendingOrders];
      this.completedOrders = [...this.originalCompletedOrders];
      return;
    }

    // Lọc theo customerName hoặc status
    this.pendingOrders = this.originalPendingOrders.filter((order) => {
      const customerName = order.customerName?.toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      return customerName.includes(query) || status.includes(query);
    });

    this.completedOrders = this.originalCompletedOrders.filter((order) => {
      const customerName = order.customerName?.toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      return customerName.includes(query) || status.includes(query);
    });
  }

  logout(): void {
    this.authService.logout();
    Swal.fire('Thành công', 'Đăng xuất thành công', 'success');
    this.router.navigate(['/login']);
  }
}