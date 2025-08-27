import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lichsudonhang.component.html',
  styleUrls: ['./lichsudonhang.component.css'],
})
export class lichsudonhangComponent implements OnInit {
  user: any = null;
  orders: any[] = [];

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    this.user = userData ? JSON.parse(userData) : null;
    if (!this.user) {
      this.router.navigate(['/dangnhap']);
    } else {
      console.log('User data:', this.user);
      this.loadOrders();
    }
  }

  loadOrders(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Không tìm thấy token');
      this.router.navigate(['/dangnhap']);
      return;
    }

    console.log('Loading orders with token:', token);
    this.userService.getOrders().subscribe(
      (response) => {
        console.log('API response:', response);
        if (!response.success) {
          console.error('API response not successful:', response);
          alert('Không thể tải lịch sử đơn hàng: ' + (response.message || 'Lỗi không xác định'));
          return;
        }

        this.orders = response.data || [];
        this.orders = this.orders.map((order) => {
          console.log('Processing order:', order);
          const status = order.status ? order.status.trim() : '';
          return {
            ...order,
            orderDate: new Date(order.createdAt).toLocaleDateString('vi-VN'),
            status: status,
            product: order.items && order.items.length > 0 ? {
              productId: order.items[0].productId?._id || order.items[0].productId || '',
              productName: order.items[0].productName,
              quantity: order.items[0].quantity,
              image: order.items[0].thumbnail || order.items[0].productId?.thumbnail || ''
            } : {},
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('Processed orders:', this.orders);
      },
      (error) => {
        console.error('Error loading orders:', error);
        let errorMessage = 'Không thể tải lịch sử đơn hàng!';
        
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/dangnhap']);
        } else if (error.status === 404) {
          errorMessage = 'Không tìm thấy dữ liệu đơn hàng';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        alert(errorMessage);
      }
    );
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate([`/donhang/${orderId}`]);
  }

  reviewProduct(productId: string): void {
    if (productId) {
      this.router.navigate([`/chitiet/${productId}`], { queryParams: { review: true } });
    } else {
      console.error('Không tìm thấy productId để đánh giá');
      alert('Không thể mở trang đánh giá do lỗi dữ liệu sản phẩm.');
    }
  }

  logout(): void {
    this.userService.clearUser();
    this.router.navigate(['/dangnhap']);
  }
}