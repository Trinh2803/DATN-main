import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

export interface Order {
  _id: string;
  userId: string;
  products: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  totalAmount: number;
  shippingAddress: string;
  status: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) { }

  // Lấy chi tiết đơn hàng theo ID
  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }

  // Lấy danh sách đơn hàng của người dùng
  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/user`);
  }

  // Tạo đơn hàng mới
  createOrder(orderData: any): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData);
  }

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, { status });
  }
}
