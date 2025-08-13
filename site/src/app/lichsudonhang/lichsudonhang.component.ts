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
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.userService.getOrders().subscribe(
      (response) => {
        console.log('API response:', response);
        this.orders = response.data || response;
        this.orders = this.orders.map((order) => {
          console.log('Order items:', order.items);
          return {
            ...order,
            orderDate: new Date(order.createdAt).toLocaleDateString('vi-VN'),
            product: order.items && order.items.length > 0 ? {
              productName: order.items[0].productName,
              quantity: order.items[0].quantity,
              image: order.items[0].thumbnail || order.items[0].productId?.thumbnail || '' // Ưu tiên thumbnail từ items
            } : {},
          };
        });
        console.log('Mapped orders:', this.orders);
      },
      (error) => {
        console.error('Error loading orders:', error);
        let errorMessage = 'Không thể tải lịch sử đơn hàng!';
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          this.router.navigate(['/dangnhap']);
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        alert(errorMessage);
      }
    );
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/donhang'], { queryParams: { orderId } });
  }

  logout(): void {
    this.userService.clearUser();
    this.router.navigate(['/dangnhap']);
  }
}
