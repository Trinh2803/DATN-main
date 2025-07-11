import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Discount {
  id?: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private apiUrl = 'http://localhost:3000/discounts';

  constructor(private http: HttpClient) {}

  getDiscounts(): Observable<Discount[]> {
    return this.http.get<Discount[]>(this.apiUrl);
  }

  getDiscountById(id: string): Observable<Discount> {
    return this.http.get<Discount>(`${this.apiUrl}/${id}`);
  }

  createDiscount(discount: Discount): Observable<Discount> {
    return this.http.post<Discount>(this.apiUrl, discount);
  }

  updateDiscount(id: string, discount: Discount): Observable<Discount> {
    return this.http.put<Discount>(`${this.apiUrl}/${id}`, discount);
  }

  deleteDiscount(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 