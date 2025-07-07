import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getCategories(name?: string): Observable<ApiResponse<Category[]>> {
    const url = name ? `${this.apiUrl}/categories?name=${encodeURIComponent(name)}` : `${this.apiUrl}/categories`;
    return this.http.get<ApiResponse<Category[]>>(url);
  }

  addCategory(category: { name: string; slug: string; image?: File }): Observable<ApiResponse<Category>> {
    const formData = new FormData();
    formData.append('name', category.name);
    formData.append('slug', category.slug);
    if (category.image) {
      formData.append('image', category.image);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories/add`, formData, { headers });
  }

  updateCategory(id: string, category: { name: string; slug: string; image?: File }): Observable<ApiResponse<Category>> {
    const formData = new FormData();
    formData.append('name', category.name);
    formData.append('slug', category.slug);
    if (category.image) {
      formData.append('image', category.image);
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/categories/update/${id}`, formData, { headers });
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Thiếu token xác thực'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/categories/delete/${id}`, { headers });
  }
}