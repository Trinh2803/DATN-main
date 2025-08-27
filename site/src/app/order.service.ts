import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// Interface cho API response - Đảm bảo có 'export'
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Interface cho Order - Đảm bảo có 'export'
export interface Order {
  _id: string;
  createdAt: string;
  items: Array<{
    productId: { _id: string; thumbnail: string } | string;
    productName: string;
    quantity: number;
    price: number;
    thumbnail?: string;
  }>;
  status?: string;
  isReviewed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  getOrderById(orderId: string): Observable<ApiResponse<Order>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${orderId}`, { headers });
  }
}