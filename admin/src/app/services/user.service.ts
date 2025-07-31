import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface User {
  _id?: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'customer';
  avatar?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getUsers(searchQuery?: string): Observable<ApiResponse<User[]>> {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const url = searchQuery ? `${this.apiUrl}?search=${encodeURIComponent(searchQuery)}` : `${this.apiUrl}`;
    return this.http.get<ApiResponse<User[]>>(url, { headers });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`, { headers });
  }

  changeUserRole(id: string, role: 'admin' | 'customer'): Observable<ApiResponse<User>> {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}/role`, { role }, { headers });
  }
}