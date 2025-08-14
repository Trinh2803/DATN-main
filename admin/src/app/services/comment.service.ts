import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Comment, CommentStats, CommentFilters, ApiResponse } from '../interfaces/comment.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private apiUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Helper để lấy headers với auth
  private getAuthHeaders(): HttpHeaders | null {
    const token = this.authService.getToken();
    if (!token) {
      console.error('Thiếu token xác thực');
      return null;
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Helper xử lý lỗi chung
  private handleError(error: any): Observable<ApiResponse<any>> {
    console.error('API Error:', error);
    const message = error.error?.message || error.message || 'Lỗi không xác định';
    return throwError(() => ({ success: false, message } as ApiResponse<any>));
  }

  // Helper normalize comment data
  private normalizeComment(comment: Comment): Comment {
    return {
      ...comment,
      productId: typeof comment.productId === 'string'
        ? { _id: comment.productId, name: comment.productId === 'homepage' ? 'Trang chủ' : 'Không xác định', thumbnail: '/assets/images/icon.png' }
        : comment.productId || { _id: 'unknown', name: 'Không xác định', thumbnail: '/assets/images/icon.png' },
      adminReply: comment.adminReply
        ? {
            ...comment.adminReply,
            adminId: comment.adminReply.adminId || { name: 'Admin không xác định' }
          }
        : undefined
    };
  }

  // Lấy tất cả bình luận với filter
  getComments(filters?: CommentFilters): Observable<ApiResponse<Comment[]>> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<Comment[]>));

    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.productId) params = params.set('productId', filters.productId);
    if (filters?.rating) params = params.set('rating', filters.rating.toString());

    return this.http.get<ApiResponse<Comment[]>>(this.apiUrl, { headers, params }).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = response.data.map(this.normalizeComment);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  // Lấy bình luận theo ID
  getCommentById(id: string): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<Comment>));

    return this.http.get<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = this.normalizeComment(response.data);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  // Lấy thống kê bình luận
  getCommentStats(): Observable<ApiResponse<CommentStats>> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<CommentStats>));

    return this.http.get<ApiResponse<CommentStats>>(`${this.apiUrl}/stats`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Cập nhật trạng thái bình luận (sửa endpoint thành PUT /:id với body { status })
  updateCommentStatus(id: string, status: Comment['status']): Observable<ApiResponse<Comment>> {
    console.log('[TEST] Gửi request updateCommentStatus:', id, status);
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<Comment>));

    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { status }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Trả lời bình luận (sửa endpoint thành PUT /:id với body { replyContent })
  replyToComment(id: string, content: string): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<Comment>));

    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { replyContent: content }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Chỉnh sửa bình luận (sửa endpoint thành PUT /:id với body { content, rating })
  editComment(id: string, updateData: { content?: string; rating?: number }): Observable<ApiResponse<Comment>> {
    console.log('[TEST] Gửi request editComment:', id, updateData);
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<Comment>));

    return this.http.put<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, updateData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Xóa bình luận
  deleteComment(id: string): Observable<ApiResponse<Comment>> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<Comment>));

    return this.http.delete<ApiResponse<Comment>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Duyệt nhiều bình luận cùng lúc
  bulkUpdateStatus(commentIds: string[], status: Comment['status']): Observable<ApiResponse<any>> {
    const headers = this.getAuthHeaders();
    if (!headers) return throwError(() => ({ success: false, message: 'Thiếu token xác thực' } as ApiResponse<any>));

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk-update`, { commentIds, status }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Lấy bình luận theo sản phẩm (public API)
  getCommentsByProduct(productId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.apiUrl}/product/${productId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data = response.data.map(this.normalizeComment);
        }
        return response;
      }),
      catchError(this.handleError)
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
    return this.http.post<ApiResponse<Comment>>(this.apiUrl, commentData).pipe(
      catchError(this.handleError)
    );
  }
}
