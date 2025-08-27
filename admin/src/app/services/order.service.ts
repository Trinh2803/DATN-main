import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiResponse, Order } from '../interfaces/order-response.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api/orders';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getPendingOrders(): Observable<ApiResponse<Order[]>> {
    const token = this.authService.getToken();
    console.log('Token for pending orders:', token);
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
    console.log('Headers for pending orders:', headers);
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/pending`, { headers });
  }

  getRevenue(params: { granularity: 'day'|'month'|'quarter'; start?: string; end?: string }): Observable<ApiResponse<any>> {
    const token = this.authService.getToken();
    console.log('Token for revenue:', token);
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
    console.log('Headers for revenue:', headers);
    const query = new URLSearchParams({ granularity: params.granularity });
    if (params.start) query.set('start', params.start);
    if (params.end) query.set('end', params.end);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/revenue?${query.toString()}`, { headers });
  }

  getCompletedOrders(): Observable<ApiResponse<Order[]>> {
    const token = this.authService.getToken();
    console.log('Getting completed orders with token:', token);
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    console.log('Headers for completed orders:', headers.keys());
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/completed`, { headers });
  }

  getOrderById(id: string): Observable<ApiResponse<Order>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`, { headers });
  }

  getOrders(): Observable<ApiResponse<Order[]>> {
    const token = this.authService.getToken();
    console.log('Getting orders with token:', token);
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    console.log('Headers for get orders:', headers.keys());
    return this.http.get<ApiResponse<Order[]>>(this.apiUrl, { headers });
  }

  updateOrderStatus(id: string, status: Order['status']): Observable<ApiResponse<Order>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${id}`, { status }, { headers });
  }
}