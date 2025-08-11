import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

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

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  addToWishlist(productId: string): Observable<ApiResponse<WishlistItem>> {
    return this.http.post<ApiResponse<WishlistItem>>(
      `${this.apiUrl}/add`,
      { productId },
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.loadWishlist())
    );
  }

  removeFromWishlist(productId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/remove/${productId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.loadWishlist())
    );
  }

  getUserWishlist(): Observable<ApiResponse<WishlistItem[]>> {
    return this.http.get<ApiResponse<WishlistItem[]>>(
      `${this.apiUrl}/user`,
      { headers: this.getHeaders() }
    );
  }

  checkWishlistStatus(productId: string): Observable<ApiResponse<{ isInWishlist: boolean }>> {
    return this.http.get<ApiResponse<{ isInWishlist: boolean }>>(
      `${this.apiUrl}/check/${productId}`,
      { headers: this.getHeaders() }
    );
  }

  clearWishlist(): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/clear`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => this.wishlistSubject.next([]))
    );
  }

<<<<<<< HEAD
  private loadWishlist(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.getUserWishlist().subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistSubject.next(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading wishlist:', error);
          this.wishlistSubject.next([]);
        }
      });
=======
  // Tải danh sách yêu thích và cập nhật trạng thái
// wishlist.service.ts
private loadWishlist(): void {
  const token = localStorage.getItem('token');
  if (!token) {
    this.wishlistSubject.next([]); // Đặt danh sách trống mà không hiển thị thông báo
    return;
  }
  this.getUserWishlist().subscribe({
    next: (response) => {
      if (response.success) {
        this.wishlistSubject.next(response.data);
      } else {
        console.error('Lỗi khi tải danh sách yêu thích:', response.message);
        this.wishlistSubject.next([]);
      }
    },
    error: (error) => {
      console.error('Lỗi khi tải danh sách yêu thích:', error);
      this.wishlistSubject.next([]);
>>>>>>> Trinh
    }
  }

  getWishlistCount(): Observable<number> {
    return new Observable(observer => {
      this.wishlist$.subscribe(wishlist => {
        observer.next(wishlist.length);
      });
    });
  }

  isInWishlist(productId: string): Observable<boolean> {
    return new Observable(observer => {
      this.wishlist$.subscribe(wishlist => {
        const isInWishlist = wishlist.some(item => item.productId._id === productId);
        observer.next(isInWishlist);
      });
    });
  }
} 