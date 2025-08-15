import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Discount {
  _id?: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscountCheckResponse {
  success: boolean;
  discount: {
    _id: string;
    code: string;
    name: string;
    description: string;
    discountType: string;
    discountValue: number;
    maxDiscount?: number;
    discountAmount: number;
    finalAmount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = 'http://localhost:3000/api/discounts';

  constructor(private http: HttpClient) { }

  // Get applicable discounts for a product/category
  getApplicable(productId?: string, categoryId?: string): Observable<{ success: boolean; data: Discount[] }>{
    const params: any = {};
    if (productId) params.productId = productId;
    if (categoryId) params.categoryId = categoryId;
    return this.http.get<{ success: boolean; data: Discount[] }>(`${this.apiUrl}/applicable`, { params, headers: this.getAuthHeaders() });
  }

  // Get auth headers with token
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Check discount code validity
  checkDiscountCode(code: string, totalAmount: number, productIds: string[]): Observable<DiscountCheckResponse> {
    return this.http.post<DiscountCheckResponse>(
      `${this.apiUrl}/check`, 
      { code, totalAmount, productIds },
      { headers: this.getAuthHeaders() }
    );
  }

  // Apply discount to order
  applyDiscount(discountId: string, code: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/apply`, 
      { code }, // Gửi code thay vì discountId để phù hợp với API backend
      { headers: this.getAuthHeaders() }
    );
  }
}