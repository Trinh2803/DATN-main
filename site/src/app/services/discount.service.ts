import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = 'http://localhost:3000/api/discounts';

  constructor(private http: HttpClient) { }

  checkDiscount(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check`, { code });
  }

  applyDiscount(code: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(`${this.apiUrl}/apply`, { code }, { headers });
  }
}
