import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderService } from '../services/order.service';
import { Order, ApiResponse } from '../interfaces/order-response.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-quanlydonhang',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './quanlydonhang.component.html',
  styleUrls: ['./quanlydonhang.component.css'],
})
export class QuanlydonhangComponent implements OnInit, AfterViewInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  userAvatar: string = '/assets/images/icon.png';
  errorMessage: string | undefined;
  searchQuery: string = ''; // Biến lưu từ khóa tìm kiếm

  // Hàm xác định các trạng thái hợp lệ tiếp theo
  getAllowedStatuses(currentStatus: Order['status']): Order['status'][] {
    switch (currentStatus) {
      case 'Chờ xác nhận':
        return ['Chờ xác nhận', 'Đang chuẩn bị', 'Đã hủy'];
      case 'Đang chuẩn bị':
        return ['Đang chuẩn bị', 'Đang giao', 'Đã hủy'];
      case 'Đang giao':
        return ['Đang giao', 'Đã giao'];
      case 'Đã giao':
        return ['Đã giao', 'Đã hoàn thành'];
      case 'Đã hủy':
      case 'Đã hoàn thành':
        return [currentStatus];
      default:
        return [currentStatus];
    }
  }

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      this.errorMessage = 'Vui lòng đăng nhập.';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      console.log('No token found, redirecting to login');
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
    console.log('Loading orders');
    this.orderService.getOrders().subscribe({
      next: (response: ApiResponse<Order[]>) => {
        if (response.success) {
          this.orders = response.data || [];
          this.filteredOrders = this.orders; // Khởi tạo filteredOrders
          this.errorMessage = undefined;
          console.log('Orders loaded:', this.orders);
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy danh sách đơn hàng.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
          console.log('Error response from getOrders:', response.message);
        }
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
            : err.error?.message || err.message || 'Lỗi khi lấy danh sách đơn hàng';
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
    console.log('User avatar loaded:', this.userAvatar);
  }

  search(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredOrders = this.orders; // Nếu không có từ khóa, hiển thị tất cả đơn hàng
      return;
    }

    this.filteredOrders = this.orders.filter((order) => {
      const customerName = order.customerName?.toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      return customerName.includes(query) || status.includes(query);
    });
  }

  updateOrderStatus(orderId: string, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as Order['status'];

    Swal.fire({
      title: 'Xác nhận',
      text: `Bạn có chắc muốn cập nhật trạng thái thành "${newStatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Updating status for order:', orderId, 'to', newStatus);
        this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
          next: (response: ApiResponse<Order>) => {
            if (response.success) {
              this.loadOrders();
              this.errorMessage = undefined;
              Swal.fire('Thành công', 'Cập nhật trạng thái thành công', 'success');
              console.log('Order status updated:', response.data);
            } else {
              this.errorMessage = response.message || 'Lỗi khi cập nhật trạng thái.';
              Swal.fire('Lỗi', this.errorMessage, 'error');
              console.log('Update status failed:', response.message);
            }
          },
          error: (err) => {
            console.error('Error updating order status:', err);
            this.errorMessage = err.error?.message || err.message || 'Lỗi khi cập nhật trạng thái';
            Swal.fire('Lỗi', this.errorMessage, 'error');
          },
        });
      }
    });
  }

  viewOrderDetails(orderId: string): void {
    console.log('Navigating to order details for ID:', orderId);
    this.router.navigate(['/order', orderId]);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userAvatar');
    console.log('Logging out');
    Swal.fire('Thành công', 'Đăng xuất thành công', 'success');
    this.router.navigate(['/login']);
  }
}