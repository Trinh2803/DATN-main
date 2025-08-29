import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, map } from 'rxjs';

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

  /**
   * Gửi yêu cầu đặt lại mật khẩu
   * @param email Email cần đặt lại mật khẩu
   * @returns Observable với kết quả
   */
  requestPasswordReset(email: string): Observable<any> {
    if (!email) {
      return throwError(() => new Error('Email là bắt buộc'));
    }
    
    // Sử dụng apiUrl để gọi đến /users/forgot-password
    return this.http.post(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Yêu cầu đặt lại mật khẩu thất bại:', error);
        let errorMessage = 'Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu';
        
        if (error.status === 404) {
          errorMessage = 'Không tìm thấy tài khoản với email này';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Yêu cầu không hợp lệ';
        } else if (error.status === 429) {
          errorMessage = 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 5 phút';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        return throwError(() => ({
          status: error.status,
          message: errorMessage
        }));
      })
    );
  }

  verifyResetPasswordOtp(email: string, otp: string): Observable<any> {
    if (!email || !otp) {
      return throwError(() => new Error('Email và mã OTP là bắt buộc'));
    }
    
    return this.http.post(`${this.apiUrl}/verify-reset-otp`, { email, otp }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Xác minh OTP thất bại:', error);
        let errorMessage = 'Có lỗi xảy ra khi xác minh mã OTP';
        
        if (error.status === 400) {
          errorMessage = 'Mã OTP không hợp lệ hoặc đã hết hạn';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        return throwError(() => ({
          status: error.status,
          message: errorMessage
        }));
      })
    );
  }

  /**
   * Đặt lại mật khẩu mới sau khi xác minh OTP
   */
  resetPassword(email: string, newPassword: string, otp?: string): Observable<any> {
    if (!email || !newPassword) {
      return throwError(() => new Error('Email và mật khẩu mới là bắt buộc'));
    }
    
    const payload = otp 
      ? { email, newPassword, otp } 
      : { email, newPassword };
    
    return this.http.post(`${this.apiUrl}/reset-password`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Đặt lại mật khẩu thất bại:', error);
        let errorMessage = 'Có lỗi xảy ra khi đặt lại mật khẩu';
        
        if (error.status === 400) {
          errorMessage = 'Yêu cầu không hợp lệ';
        } else if (error.status === 404) {
          errorMessage = 'Không tìm thấy yêu cầu đặt lại mật khẩu';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        return throwError(() => ({
          status: error.status,
          message: errorMessage
        }));
      })
    );
  }

  // Các phương thức OTP khác
  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { email }).pipe(
      catchError(this.handleError('Gửi OTP'))
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.sendOtp(email);
  }

  verifyRegistration(email: string, otp: string): Observable<any> {
    return this.verifyOtp(email, otp);
  }

  verifyEmail(email: string, otp: string): Observable<any> {
    return this.verifyOtp(email, otp);
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp }).pipe(
      catchError(this.handleError('Xác minh OTP'))
    );
  }

  // Wishlist Methods
  addToWishlist(productId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.apiUrlT}/wishlist/add`, 
      { productId },
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError('Thêm vào danh sách yêu thích'))
    );
  }

  removeFromWishlist(productId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete(
      `${this.apiUrlT}/wishlist/remove/${productId}`, 
      { headers }
    ).pipe(
      map((response: any) => response?.data || response),
      catchError(this.handleError('Xóa khỏi danh sách yêu thích'))
    );
  }

  getWishlist(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get(
      `${this.apiUrlT}/wishlist/user`, 
      { headers }
    ).pipe(
      map((response: any) => {
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response?.data) {
          return Array.isArray(response.data) ? response.data : [];
        } else if (response?.success && Array.isArray(response.wishlist)) {
          return response.wishlist;
        }
        return [];
      }),
      catchError(this.handleError('Lấy danh sách yêu thích'))
    );
  }

  // Xử lý lỗi chung
  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse) => {
      console.error(`${operation} thất bại:`, error);
      return throwError(() => ({
        status: error.status,
        message: error.error?.message || `Có lỗi xảy ra khi ${operation.toLowerCase()}`
      }));
    };
  }
}
