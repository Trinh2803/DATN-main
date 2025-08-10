import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

export interface WishlistItem {
  _id: string;
  userId: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    thumbnail: string;
    discountPercent?: number;
    discountPrice?: number;
    categoryId: string;
  };
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:3000/wishlist';
  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadWishlist();
  }

  // Tạo tiêu đề HTTP với token xác thực
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Thêm sản phẩm vào danh sách yêu thích
  addToWishlist(productId: string): Observable<ApiResponse<WishlistItem>> {
    const currentWishlist = this.wishlistSubject.getValue();
    if (currentWishlist.some(item => item.productId._id === productId)) {
      return throwError(() => new Error('Sản phẩm đã có trong danh sách yêu thích'));
    }
    return this.http.post<ApiResponse<WishlistItem>>(
      `${this.apiUrl}/add`,
      { productId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.loadWishlist())
    );
  }

  // Xóa sản phẩm khỏi danh sách yêu thích
  removeFromWishlist(productId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/remove/${productId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.loadWishlist())
    );
  }

  // Lấy danh sách yêu thích của người dùng
  getUserWishlist(): Observable<ApiResponse<WishlistItem[]>> {
    return this.http.get<ApiResponse<WishlistItem[]>>(
      `${this.apiUrl}/user`,
      { headers: this.getHeaders() }
    );
  }

  // Kiểm tra trạng thái danh sách yêu thích
  checkWishlistStatus(productId: string): Observable<ApiResponse<{ isInWishlist: boolean }>> {
    return this.http.get<ApiResponse<{ isInWishlist: boolean }>>(
      `${this.apiUrl}/check/${productId}`,
      { headers: this.getHeaders() }
    );
  }

  // Xóa toàn bộ danh sách yêu thích
  clearWishlist(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/clear`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.wishlistSubject.next([]))
    );
  }

  // Tải danh sách yêu thích và cập nhật trạng thái
  private loadWishlist(): void {
  const token = localStorage.getItem('token');
  if (!token) {
    this.wishlistSubject.next([]);
    Swal.fire('Lỗi', 'Vui lòng đăng nhập để xem danh sách yêu thích', 'warning');
    return;
  }
  this.getUserWishlist().subscribe({
    next: (response) => {
      if (response.success) {
        this.wishlistSubject.next(response.data);
      } else {
        console.error('Lỗi khi tải danh sách yêu thích:', response.message);
        this.wishlistSubject.next([]);
        Swal.fire('Lỗi', 'Không thể tải danh sách yêu thích. Vui lòng thử lại.', 'error');
      }
    },
    error: (error) => {
      console.error('Lỗi khi tải danh sách yêu thích:', error);
      this.wishlistSubject.next([]);
      Swal.fire('Lỗi', 'Không thể tải danh sách yêu thích. Vui lòng thử lại.', 'error');
    }
  });
}
  // Lấy số lượng mục trong danh sách yêu thích
  getWishlistCount(): Observable<number> {
    return new Observable(observer => {
      this.wishlist$.subscribe(wishlist => {
        observer.next(wishlist.length);
      });
    });
  }

  // Kiểm tra xem sản phẩm có trong danh sách yêu thích không
  isInWishlist(productId: string): Observable<boolean> {
    return this.checkWishlistStatus(productId).pipe(
      map(response => response.data.isInWishlist)
    );
  }
}
