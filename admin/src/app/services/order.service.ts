import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiResponse, Order } from '../interfaces/order-response.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/orders';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getPendingOrders(): Observable<ApiResponse<Order[]>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/pending`, { headers });
  }

  getRevenue(params: { granularity: 'day'|'month'|'quarter'; start?: string; end?: string }): Observable<ApiResponse<any>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
    const query = new URLSearchParams({ granularity: params.granularity });
    if (params.start) query.set('start', params.start);
    if (params.end) query.set('end', params.end);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/revenue?${query.toString()}`, { headers });
  }

  getCompletedOrders(): Observable<ApiResponse<Order[]>> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
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
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<ApiResponse<Order[]>>(this.apiUrl, { headers });
  }

  updateOrderStatus(id: string, status: Order['status']): Observable<ApiResponse<Order>> {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${id}`, { status }, { headers });
  }
}