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
  searchQuery: string = '';
  
  // Phân trang
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  
  // Lọc và sắp xếp
  statusFilter: string = 'all';
  sortBy: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Thống kê
  orderStats = {
    total: 0,
    pending: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
    completed: 0
  };
  
  // Loading state
  isLoading: boolean = false;

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
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
    this.isLoading = true;
    console.log('Loading orders');
    this.orderService.getOrders().subscribe({
      next: (response: ApiResponse<Order[]>) => {
        if (response.success) {
          this.orders = response.data || [];
          this.calculateOrderStats();
          this.applyFiltersAndSort();
          this.errorMessage = undefined;
          console.log('Orders loaded:', this.orders);
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy danh sách đơn hàng.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
          console.log('Error response from getOrders:', response.message);
        }
        this.isLoading = false;
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
        this.isLoading = false;
      },
    });
  }

  calculateOrderStats(): void {
    this.orderStats = {
      total: this.orders.length,
      pending: this.orders.filter(o => o.status === 'Chờ xác nhận').length,
      processing: this.orders.filter(o => o.status === 'Đang chuẩn bị').length,
      shipping: this.orders.filter(o => o.status === 'Đang giao').length,
      delivered: this.orders.filter(o => o.status === 'Đã giao').length,
      cancelled: this.orders.filter(o => o.status === 'Đã hủy').length,
      completed: this.orders.filter(o => o.status === 'Đã hoàn thành').length
    };
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.orders];

    // Lọc theo từ khóa tìm kiếm
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const customerName = order.customerName?.toLowerCase() || '';
        const customerEmail = order.customerEmail?.toLowerCase() || '';
        const customerPhone = order.customerPhone?.toLowerCase() || '';
        const status = order.status?.toLowerCase() || '';
        return customerName.includes(query) || 
               customerEmail.includes(query) || 
               customerPhone.includes(query) || 
               status.includes(query);
      });
    }

    // Lọc theo trạng thái
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredOrders = filtered;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  search(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Helper method for template
  get Math() {
    return Math;
  }

  // Helper methods for template conditions
  canShowCancelOption(status: string): boolean {
    return status !== 'Đã giao' && status !== 'Đã hoàn thành';
  }

  canShowDropdown(status: string): boolean {
    return status !== 'Chờ xác nhận' && status !== 'Đã hủy' && status !== 'Đã hoàn thành';
  }

  updateOrderStatus(orderId: string, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as Order['status'];

    // Ngăn chặn việc quay lại trạng thái "Chờ xác nhận"
    if (newStatus === 'Chờ xác nhận') {
      Swal.fire('Cảnh báo', 'Không thể quay lại trạng thái "Chờ xác nhận" sau khi đã xác nhận đơn hàng.', 'warning');
      // Reset dropdown về trạng thái hiện tại
      setTimeout(() => {
        const currentOrder = this.orders.find(order => order._id === orderId);
        if (currentOrder) {
          selectElement.value = currentOrder.status;
        }
      }, 100);
      return;
    }

    // Ngăn chặn việc chuyển từ trạng thái "Đã hủy" sang trạng thái khác
    const currentOrder = this.orders.find(order => order._id === orderId);
    if (currentOrder && currentOrder.status === 'Đã hủy' && newStatus !== 'Đã hủy') {
      Swal.fire('Cảnh báo', 'Đơn hàng đã hủy không thể chuyển sang trạng thái khác.', 'warning');
      // Reset dropdown về trạng thái hiện tại
      setTimeout(() => {
        if (currentOrder) {
          selectElement.value = currentOrder.status;
        }
      }, 100);
      return;
    }

    // Ngăn chặn việc chuyển sang "Đã hủy" từ các trạng thái đã hoàn thành
    if (newStatus === 'Đã hủy' && currentOrder && (currentOrder.status === 'Đã giao' || currentOrder.status === 'Đã hoàn thành')) {
      Swal.fire('Cảnh báo', 'Đơn hàng đã giao hoặc hoàn thành không thể hủy.', 'warning');
      // Reset dropdown về trạng thái hiện tại
      setTimeout(() => {
        if (currentOrder) {
          selectElement.value = currentOrder.status;
        }
      }, 100);
      return;
    }

    // Ngăn chặn việc thay đổi trạng thái đã hoàn thành
    if (currentOrder && currentOrder.status === 'Đã hoàn thành' && newStatus !== 'Đã hoàn thành') {
      Swal.fire('Cảnh báo', 'Đơn hàng đã hoàn thành không thể thay đổi trạng thái.', 'warning');
      // Reset dropdown về trạng thái hiện tại
      setTimeout(() => {
        if (currentOrder) {
          selectElement.value = currentOrder.status;
        }
      }, 100);
      return;
    }

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
      } else {
        // Reset dropdown về trạng thái hiện tại nếu user hủy
        const currentOrder = this.orders.find(order => order._id === orderId);
        if (currentOrder) {
          selectElement.value = currentOrder.status;
        }
      }
    });
  }

  confirmOrder(orderId: string): void {
    Swal.fire({
      title: 'Xác nhận đơn hàng',
      text: 'Bạn có chắc muốn xác nhận đơn hàng này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Confirming order:', orderId);
        this.orderService.updateOrderStatus(orderId, 'Đang chuẩn bị').subscribe({
          next: (response: ApiResponse<Order>) => {
            if (response.success) {
              this.loadOrders();
              this.errorMessage = undefined;
              Swal.fire('Thành công', 'Đã xác nhận đơn hàng', 'success');
              console.log('Order confirmed:', response.data);
            } else {
              this.errorMessage = response.message || 'Lỗi khi xác nhận đơn hàng.';
              Swal.fire('Lỗi', this.errorMessage, 'error');
              console.log('Confirm order failed:', response.message);
            }
          },
          error: (err) => {
            console.error('Error confirming order:', err);
            this.errorMessage = err.error?.message || err.message || 'Lỗi khi xác nhận đơn hàng';
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Chờ xác nhận': return '#ff9800';
      case 'Đang chuẩn bị': return '#2196f3';
      case 'Đang giao': return '#9c27b0';
      case 'Đã giao': return '#4caf50';
      case 'Đã hủy': return '#f44336';
      case 'Đã hoàn thành': return '#2e7d32';
      default: return '#757575';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Chờ xác nhận': return 'badge-warning';
      case 'Đang chuẩn bị': return 'badge-info';
      case 'Đang giao': return 'badge-primary';
      case 'Đã giao': return 'badge-success';
      case 'Đã hủy': return 'badge-danger';
      case 'Đã hoàn thành': return 'badge-completed';
      default: return 'badge-secondary';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  loadUserAvatar(): void {
    const avatar = localStorage.getItem('userAvatar') || '/assets/images/icon.png';
    this.userAvatar = avatar;
    console.log('User avatar loaded:', this.userAvatar);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userAvatar');
    console.log('Logging out');
    Swal.fire('Thành công', 'Đăng xuất thành công', 'success');
    this.router.navigate(['/login']);
  }
}