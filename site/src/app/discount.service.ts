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

  // Check discount code validity
  checkDiscountCode(code: string, totalAmount: number, productIds: string[]): Observable<DiscountCheckResponse> {
    return this.http.post<DiscountCheckResponse>(`${this.apiUrl}/check`, {
      code,
      totalAmount,
      productIds
    });
  }

  // Apply discount to order
  applyDiscount(discountId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, { discountId });
  }
} 