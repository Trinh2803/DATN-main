import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductInterface, CategoryInterface } from './product-interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/products';
  private categoriesUrl = 'http://localhost:3000/categories';

  constructor(private http: HttpClient) {}

  // Lấy tất cả sản phẩm
  getAllProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(this.apiUrl);
  }

  // Lấy sản phẩm giảm giá
  getSaleProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(`${this.apiUrl}/sale?limit=8`);
  }

  // Lấy sản phẩm mới
  getNewProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(`${this.apiUrl}/new?limit=8`);
  }
 // Lấy sản phẩm hot
 getHotProducts(): Observable<ProductInterface[]> {
  return this.http.get<ProductInterface[]>(`${this.apiUrl}/hot?limit=8`);
}

  // Lấy danh mục
  getCategories(): Observable<CategoryInterface[]> {
    interface ApiResponse {
      success: boolean;
      data: CategoryInterface[];
    }
    return this.http.get<ApiResponse>(this.categoriesUrl).pipe(
      map((response: ApiResponse) => response.data || [])
    );
  }

  // Lọc sản phẩm theo giá
  getProductsByPriceSort(sortOrder: 'asc' | 'desc'): Observable<ProductInterface[]> {
    let params = new HttpParams().set('sortBy', 'price').set('order', sortOrder);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params });
  }

  // Tìm kiếm sản phẩm theo tên
  searchProductsByName(name: string): Observable<ProductInterface[]> {
    let params = new HttpParams().set('name', name);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params });
  }

  // Lọc sản phẩm theo danh mục
  getProductsByCategory(categoryId: string): Observable<ProductInterface[]> {
    let params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params });
  }

  // Tìm kiếm danh mục theo tên (mới)
  searchCategoriesByName(name: string): Observable<CategoryInterface[]> {
    let params = new HttpParams().set('name', name);
    interface ApiResponse {
      success: boolean;
      data: CategoryInterface[];
    }
    return this.http.get<ApiResponse>(this.categoriesUrl, { params }).pipe(
      map((response: ApiResponse) => response.data || [])
    );
  }
getProductById(id: string): Observable<ProductInterface> {
    return this.http.get<ProductInterface>(`${this.apiUrl}/${id}`);
  }
}
