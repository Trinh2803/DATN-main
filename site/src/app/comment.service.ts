import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, ApiResponse } from '../../admin/src/app/interfaces/comment.interface';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private apiUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient) {}

  // Lấy bình luận theo sản phẩm (public API)
  getCommentsByProduct(productId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/product/${productId}`);
  }

  // Tạo bình luận mới (public API)
  createComment(commentData: {
    productId: string;
    userName: string;
    userEmail: string;
    rating: number;
    content: string;
  }): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(this.apiUrl, commentData);
  }
} 