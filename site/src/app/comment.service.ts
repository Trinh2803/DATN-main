import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, ApiResponse } from './interfaces/comment.interface';

@Injectable({
  providedIn: 'root',
})

export class CommentService {
  private apiUrl = 'http://localhost:3000/api/comments';

  constructor(private http: HttpClient) {}

  // Lấy bình luận theo sản phẩm (public API, không cần token)
  getCommentsByProduct(productId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/product/${productId}`);
  }

  // Tạo bình luận mới (yêu cầu token)
  createComment(commentData: {
    productId: string;
    userName: string;
    userEmail: string;
    rating: number;
    content: string;
  }): Observable<ApiResponse<Comment>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<ApiResponse<Comment>>(this.apiUrl, commentData, { headers });
  }

 // Kiểm tra xem người dùng đã đánh giá sản phẩm chưa (yêu cầu token)
  getCommentByUserAndProduct(productId: string): Observable<ApiResponse<Comment>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<ApiResponse<Comment>>(`${this.apiUrl}/user-product/${productId}`, { headers });
  }
}