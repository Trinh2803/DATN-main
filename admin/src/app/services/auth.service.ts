import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { tap, map } from 'rxjs/operators'; // Thêm map

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  adminLogin(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token); // Lưu token
        }
      })
    );
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'admin';
    } catch (err) {
      console.error('Invalid token:', err);
      return false;
    }
  }

  getUserAvatar(): Observable<string | null> {
    const token = this.getToken();
    if (!token) {
      console.log('No token found');
      return new Observable(observer => observer.next(null));
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      console.log('Token payload:', payload);
      console.log('User ID from token:', userId);

      const headers = { 'Authorization': `Bearer ${token}` };
      console.log('Request headers:', headers);

      return this.http.get(`${this.apiUrl}/users/${userId}`, { headers }).pipe(
        tap((response: any) => {
          console.log('User response:', response);
          const avatar = response.data?.avatar || null;
          localStorage.setItem('userAvatar', avatar || '');
        }),
        map((response: any) => response.data?.avatar || null)
      );
    } catch (err) {
      console.error('Invalid token:', err);
      return new Observable(observer => observer.next(null));
    }
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch (err) {
      console.error('Invalid token:', err);
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userAvatar');
  }
}