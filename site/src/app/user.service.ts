import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';
  private apiUrlT = 'http://localhost:3000';
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.userSubject.next(JSON.parse(userData));
    }
  }

  // Đăng ký
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Đăng nhập
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap({
        next: (response: any) => {
          // Handle both response formats for backward compatibility
          const token = response?.token || response?.data?.token;
          const user = response?.user || response?.data?.user;
          
          if (token && user) {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            this.userSubject.next(user);
          } else {
            console.error('Invalid response format from server:', response);
            throw new Error('Invalid response format from server');
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          throw error; // Re-throw to let the component handle it
        }
      })
    );
  }

  // Cập nhật thông tin người dùng
  updateProfile(user: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.put(`${this.apiUrl}/profile`, user, { headers }).pipe(
      tap((response: any) => {
        if (response.data) {
          this.userSubject.next(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      })
    );
  }

  // Cập nhật avatar
  updateAvatar(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put(`${this.apiUrl}/profile`, formData, { headers });
  }

  // Quản lý user trong context
  updateUser(user: any): void {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearUser(): void {
    this.userSubject.next(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  getCurrentUser(): any {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value || !!localStorage.getItem('token');
  }

  // Lấy đơn hàng người dùng
  getOrders(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.apiUrlT}/api/orders/user`, { headers });
  }

  // Request password reset OTP
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Password reset request failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Verify password reset OTP
  verifyResetPasswordOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-reset-otp`, { email, otp });
  }

  // Reset password after OTP verification
  resetPasswordAfterOtpVerification(email: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email, newPassword });
  }

  // Gửi OTP về email
  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { email });
  }

  // Gửi lại OTP
  resendOtp(email: string): Observable<any> {
    return this.sendOtp(email);
  }

  // Xác minh OTP đăng ký
  verifyRegistration(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-registration`, { email, otp });
  }

  // Xác minh OTP
  verifyEmail(email: string, otp: string): Observable<any> {
    return this.verifyOtp(email, otp);
  }

  // Xác minh mã OTP
  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  // Đặt lại mật khẩu mới
  resetPassword(email: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email, newPassword });
  }
}
