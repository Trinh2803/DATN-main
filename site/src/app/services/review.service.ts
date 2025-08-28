// src/app/services/review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/api/reviews`;

  constructor(private http: HttpClient) {}

  // Tạo đánh giá mới
  createReview(reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
  }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post(this.apiUrl, reviewData, { headers });
  }

  // Lấy đánh giá của sản phẩm
  getProductReviews(productId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/product/${productId}`, { headers });
  }

  // Kiểm tra có thể đánh giá không
  canReviewProduct(productId: string, orderId: string): Observable<{ canReview: boolean }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<{ canReview: boolean }>(`${this.apiUrl}/can-review/${productId}/${orderId}`, { headers });
  }
}