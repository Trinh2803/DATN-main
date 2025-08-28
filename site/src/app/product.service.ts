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

  // Lấy tất cả sản phẩm (chỉ lấy sản phẩm còn hàng)
  getAllProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(this.apiUrl).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Lấy sản phẩm giảm giá (chỉ lấy sản phẩm còn hàng)
  getSaleProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(`${this.apiUrl}/sale?limit=8`).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Lấy sản phẩm mới (chỉ lấy sản phẩm còn hàng)
  getNewProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(`${this.apiUrl}/new?limit=8`).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Lấy sản phẩm hot (sản phẩm bán chạy, còn hàng)
  getHotProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(`${this.apiUrl}/hot?limit=8`).pipe(
      map(products => {
        // Lọc bỏ sản phẩm hết hàng (quantity > 0 hoặc không có quantity)
        // Sắp xếp theo số lượng bán được (sold) giảm dần
        return products
          .filter(product => (product.quantity ?? 1) > 0) // Nếu quantity là undefined, coi như còn hàng
          .sort((a, b) => (b.sold || 0) - (a.sold || 0))
          .slice(0, 8); // Giới hạn 8 sản phẩm
      })
    );
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

  // Lọc sản phẩm theo giá (chỉ lấy sản phẩm còn hàng)
  getProductsByPriceSort(sortOrder: 'asc' | 'desc'): Observable<ProductInterface[]> {
    let params = new HttpParams().set('sortBy', 'price').set('order', sortOrder);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params }).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Lọc sản phẩm theo danh mục và sắp xếp theo giá (chỉ lấy sản phẩm còn hàng)
  getProductsByCategoryAndPriceSort(categoryId: string, sortOrder: 'asc' | 'desc'): Observable<ProductInterface[]> {
    let params = new HttpParams()
      .set('categoryId', categoryId)
      .set('sortBy', 'price')
      .set('order', sortOrder);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params }).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Tìm kiếm sản phẩm theo tên (chỉ lấy sản phẩm còn hàng)
  searchProductsByName(name: string): Observable<ProductInterface[]> {
    let params = new HttpParams().set('name', name);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params }).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Lọc sản phẩm theo danh mục (chỉ lấy sản phẩm còn hàng)
  getProductsByCategory(categoryId: string): Observable<ProductInterface[]> {
    let params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<ProductInterface[]>(this.apiUrl, { params }).pipe(
      map(products => products.filter(product => (product.quantity ?? 1) > 0))
    );
  }

  // Tìm kiếm danh mục theo tên
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

  // Lấy sản phẩm theo ID
  getProductById(id: string): Observable<ProductInterface> {
    return this.http.get<ProductInterface>(`${this.apiUrl}/${id}`);
  }
}
