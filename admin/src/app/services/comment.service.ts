import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comment, CommentStats, CommentFilters, ApiResponse } from '../interfaces/comment.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private apiUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Lấy tất cả bình luận với filter
  // Trong CommentService, phương thức getComments
getComments(filters?: CommentFilters): Observable<ApiResponse<Comment[]>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.productId) {
      params = params.set('productId', filters.productId);
    }
    if (filters?.rating) {
      params = params.set('rating', filters.rating.toString());
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<ApiResponse<Comment[]>>(this.apiUrl, { headers, params }).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = response.data.map(comment => ({
            ...comment,
            productId: comment.productId || { _id: 'unknown', name: 'Không xác định', thumbnail: '/assets/images/icon.png' },
            adminReply: comment.adminReply
              ? {
                  ...comment.adminReply,
                  adminId: comment.adminReply.adminId || { name: 'Admin không xác định' }
                }
              : undefined
          }));
        }
        return response;
      })
    );
  }

  // Các phương thức khác giữ nguyên
  getCommentById(id: string): Observable<ApiResponse<Comment>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = {
            ...response.data,
            productId: response.data.productId || { _id: 'unknown', name: 'Không xác định', thumbnail: '/assets/images/icon.png' }
          };
        }
        return response;
      })
    );
  }

  // Lấy thống kê bình luận
  getCommentStats(): Observable<ApiResponse<CommentStats>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<ApiResponse<CommentStats>>(`${this.apiUrl}/stats`, { headers });
  }

  // Cập nhật trạng thái bình luận
  updateCommentStatus(id: string, status: Comment['status']): Observable<ApiResponse<Comment>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}/status`, { status }, { headers });
  }

  // Trả lời bình luận
  replyToComment(id: string, content: string): Observable<ApiResponse<Comment>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}/reply`, { content }, { headers });
  }

  // Chỉnh sửa bình luận
  editComment(id: string, updateData: { content?: string; rating?: number }): Observable<ApiResponse<Comment>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}/edit`, updateData, { headers });
  }

  // Xóa bình luận
  deleteComment(id: string): Observable<ApiResponse<Comment>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { headers });
  }

  // Duyệt nhiều bình luận cùng lúc
  bulkUpdateStatus(commentIds: string[], status: Comment['status']): Observable<ApiResponse<any>> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk-update`, { commentIds, status }, { headers });
  }

  // Lấy bình luận theo sản phẩm (public API)
  getCommentsByProduct(productId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/product/${productId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = response.data.map(comment => ({
            ...comment,
            productId: comment.productId || { _id: productId, name: 'Không xác định', thumbnail: '/assets/images/icon.png' }
          }));
        }
        return response;
      })
    );
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
