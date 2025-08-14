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

  // Hàm xác định các trạng thái hợp lệ tiếp theo
  getAllowedStatuses(currentStatus: Order['status']): Order['status'][] {
    switch (currentStatus) {
      case 'Chờ xác nhận':
        return ['Chờ xác nhận', 'Đang chuẩn bị', 'Đã hủy'];
      case 'Đang chuẩn bị':
        return ['Đang chuẩn bị', 'Đang giao', 'Đã hủy'];
      case 'Đang giao':
        return ['Đang giao', 'Đã giao', 'Đã hủy']; // Cho phép hủy khi đang giao (trường hợp đặc biệt)
      case 'Đã giao':
        return ['Đã giao', 'Đã hoàn thành']; // Cho phép chuyển từ đã giao sang hoàn thành
      case 'Đã hủy':
        return ['Đã hủy', 'Chờ xác nhận']; // Admin có thể khôi phục đơn hàng đã hủy
      case 'Đã hoàn thành':
        return ['Đã hoàn thành']; // Trạng thái cuối, không thể thay đổi
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
    // Cho phép dropdown cho tất cả trạng thái trừ 'Đã hoàn thành'
    return status !== 'Đã hoàn thành';
  }

  // Kiểm tra xem có phải đơn hàng VNPay không
  isVnpayOrder(order: Order): boolean {
    return order.paymentMethod === 'vnpay';
  }

  // Lấy trạng thái thanh toán
  getPaymentStatusText(order: Order): string {
    if (order.paymentMethod === 'vnpay') {
      switch (order.paymentStatus) {
        case 'completed': return 'Đã thanh toán';
        case 'pending': return 'Chờ thanh toán';
        case 'failed': return 'Thanh toán thất bại';
        default: return 'Không xác định';
      }
    }
    return 'Thanh toán khi nhận hàng';
  }

  // Lấy class CSS cho trạng thái thanh toán
  getPaymentStatusClass(order: Order): string {
    if (order.paymentMethod === 'vnpay') {
      switch (order.paymentStatus) {
        case 'completed': return 'badge-success';
        case 'pending': return 'badge-warning';
        case 'failed': return 'badge-danger';
        default: return 'badge-secondary';
      }
    }
    return 'badge-info';
  }

  updateOrderStatus(orderId: string, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as Order['status'];
    const currentOrder = this.orders.find(order => order._id === orderId);
    
    if (!currentOrder) {
      Swal.fire('Lỗi', 'Không tìm thấy đơn hàng.', 'error');
      return;
    }

    // Kiểm tra trạng thái có được phép chuyển đổi không
    const allowedStatuses = this.getAllowedStatuses(currentOrder.status);
    if (!allowedStatuses.includes(newStatus)) {
      Swal.fire('Cảnh báo', `Không thể chuyển từ trạng thái "${currentOrder.status}" sang "${newStatus}".`, 'warning');
      // Reset dropdown về trạng thái hiện tại
      setTimeout(() => {
        selectElement.value = currentOrder.status;
      }, 100);
      return;
    }

    // Xác nhận đặc biệt cho việc khôi phục đơn hàng đã hủy
    if (currentOrder.status === 'Đã hủy' && newStatus === 'Chờ xác nhận') {
      Swal.fire({
        title: 'Khôi phục đơn hàng',
        text: 'Bạn có chắc muốn khôi phục đơn hàng đã hủy này về trạng thái "Chờ xác nhận"?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Khôi phục',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ff9800',
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeStatusUpdate(orderId, newStatus, selectElement, currentOrder);
        } else {
          selectElement.value = currentOrder.status;
        }
      });
      return;
    }

    // Xác nhận đặc biệt cho việc hủy đơn hàng đang giao
    if (newStatus === 'Đã hủy' && currentOrder.status === 'Đang giao') {
      Swal.fire({
        title: 'Hủy đơn hàng đang giao',
        text: 'Đơn hàng đang trong quá trình giao. Bạn có chắc muốn hủy?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Hủy đơn hàng',
        cancelButtonText: 'Không hủy',
        confirmButtonColor: '#dc3545',
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeStatusUpdate(orderId, newStatus, selectElement, currentOrder);
        } else {
          selectElement.value = currentOrder.status;
        }
      });
      return;
    }

    // Xác nhận thông thường
    Swal.fire({
      title: 'Xác nhận',
      text: `Bạn có chắc muốn cập nhật trạng thái thành "${newStatus}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeStatusUpdate(orderId, newStatus, selectElement, currentOrder);
      } else {
        selectElement.value = currentOrder.status;
      }
    });
  }

  // Hàm thực hiện cập nhật trạng thái
  private executeStatusUpdate(orderId: string, newStatus: Order['status'], selectElement: HTMLSelectElement, currentOrder: Order): void {
    console.log('Updating status for order:', orderId, 'to', newStatus);
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (response: ApiResponse<Order>) => {
        if (response.success) {
          this.loadOrders();
          this.errorMessage = undefined;
          
          // Thông báo thành công tùy theo loại cập nhật
          let successMessage = 'Cập nhật trạng thái thành công';
          if (currentOrder.status === 'Đã hủy' && newStatus === 'Chờ xác nhận') {
            successMessage = 'Khôi phục đơn hàng thành công';
          } else if (newStatus === 'Đã hoàn thành') {
            successMessage = 'Đơn hàng đã được hoàn thành';
          }
          
          Swal.fire('Thành công', successMessage, 'success');
          console.log('Order status updated:', response.data);
        } else {
          this.errorMessage = response.message || 'Lỗi khi cập nhật trạng thái.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
          console.log('Update status failed:', response.message);
          // Reset dropdown về trạng thái cũ khi có lỗi
          selectElement.value = currentOrder.status;
        }
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.errorMessage = err.error?.message || err.message || 'Lỗi khi cập nhật trạng thái';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        // Reset dropdown về trạng thái cũ khi có lỗi
        selectElement.value = currentOrder.status;
      },
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