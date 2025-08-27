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
        console.log('Login response:', response);
        // Lấy token từ response.data.token
        const token = response.data?.token;
        console.log('Token extracted:', token);
        if (response.success && token) {
          localStorage.setItem('adminToken', token);
          console.log('Token stored in localStorage');
        } else {
          console.log('Failed to store token - success:', response.success, 'token:', token);
        }
      })
    );
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('No token found');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Role from token:', payload.role);
      const isAdmin = (payload.role || '').trim().toLowerCase() === 'admin';
      console.log('Is admin:', isAdmin);
      return isAdmin;
    } catch (err) {
      console.error('Invalid token:', err);
      return false;
    }
  }

  getUserAvatar(): Observable<string | null> {
    const token = this.getToken();
    if (!token) {
      console.log('No token found for avatar');
      return new Observable(observer => observer.next(null));
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      console.log('Token payload for avatar:', payload);
      console.log('User ID from token for avatar:', userId);

      const headers = { 'Authorization': `Bearer ${token}` };
      console.log('Request headers for avatar:', headers);

      return this.http.get(`${this.apiUrl}/users/${userId}`, { headers }).pipe(
        tap((response: any) => {
          console.log('User response for avatar:', response);
          const avatar = response.data?.avatar || null;
          localStorage.setItem('userAvatar', avatar || '');
        }),
        map((response: any) => response.data?.avatar || null)
      );
    } catch (err) {
      console.error('Invalid token for avatar:', err);
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
    const token = localStorage.getItem('adminToken');
    console.log('Getting token from localStorage:', token);
    return token;
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userAvatar');
  }
}