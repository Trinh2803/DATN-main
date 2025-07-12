import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface Variant {
  _id: string;
  size: string;
  price: number;
  salePrice?: number;
  stock: number;
}

export interface Product {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  thumbnail?: string;
  images?: string[];
  variants?: Variant[];
  categoryId: string;
  discountId?: string;
  createdAt?: string;
  updatedAt?: string;
  sellCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getProducts(params: { categoryId?: string; sortBy?: string; order?: string; name?: string } = {}): Observable<Product[]> {
    let url = `${this.apiUrl}/products`;
    const queryParams = new URLSearchParams();
    if (params.categoryId) queryParams.set('categoryId', params.categoryId);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.order) queryParams.set('order', params.order);
    if (params.name) queryParams.set('name', params.name);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;

    const token = localStorage.getItem('adminToken');
    if (!token) return throwError(() => new Error('Thiếu token xác thực'));
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.get<Product[]>(url, { headers });
  }

  getProductById(id: string): Observable<Product> {
    const token = localStorage.getItem('adminToken');
    if (!token) return throwError(() => new Error('Thiếu token xác thực'));
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.get<Product>(`${this.apiUrl}/products/${id}`, { headers });
  }

  addProduct(product: {
    name: string;
    slug: string;
    description: string;
    price: number;
    salePrice?: number;
    categoryId: string;
    thumbnail?: File;
    images?: File[];
    variants?: Variant[];
    discountId?: string;
  }): Observable<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('slug', product.slug);
    formData.append('description', product.description);
    formData.append('price', product.price.toString());
    if (product.salePrice) formData.append('salePrice', product.salePrice.toString());
    formData.append('categoryId', product.categoryId);
    if (product.thumbnail) formData.append('thumbnail', product.thumbnail);
    if (product.images) product.images.forEach((file, index) => formData.append('images', file));
    if (product.variants) formData.append('variants', JSON.stringify(product.variants));

    const token = localStorage.getItem('adminToken');
    if (!token) return throwError(() => new Error('Thiếu token xác thực'));
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/products/add`, formData, { headers });
  }

  updateProduct(id: string, product: {
    name: string;
    slug: string;
    description: string;
    price: number;
    salePrice?: number;
    categoryId: string;
    thumbnail?: File;
    images?: File[];
    variants?: Variant[];
    discountId?: string;
  }): Observable<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('slug', product.slug);
    formData.append('description', product.description);
    formData.append('price', product.price.toString());
    if (product.salePrice) formData.append('salePrice', product.salePrice.toString());
    formData.append('categoryId', product.categoryId);
    if (product.thumbnail) formData.append('thumbnail', product.thumbnail);
    if (product.images) product.images.forEach((file, index) => formData.append('images', file));
    if (product.variants) formData.append('variants', JSON.stringify(product.variants));

    const token = localStorage.getItem('adminToken');
    if (!token) return throwError(() => new Error('Thiếu token xác thực'));
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/products/${id}`, formData, { headers });
  }

  deleteProduct(id: string): Observable<ApiResponse<null>> {
    const token = localStorage.getItem('adminToken');
    if (!token) return throwError(() => new Error('Thiếu token xác thực'));
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/products/${id}`, { headers });
  }
}
