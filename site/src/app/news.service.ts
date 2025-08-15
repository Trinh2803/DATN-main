import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsItem {
  id: string;
  title: string;
  image: string;
  description: string;
  date: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'http://localhost:3000/api/news'; // Thay bằng URL backend của bạn

  constructor(private http: HttpClient) {}

  getNews(page: number, pageSize: number): Observable<{ news: NewsItem[], totalPages: number, currentPage: number }> {
    return this.http.get<{ news: NewsItem[], totalPages: number, currentPage: number }>(
      `${this.apiUrl}?page=${page}&pageSize=${pageSize}`
    );
  }

  getNewsById(id: string): Observable<NewsItem> {
    return this.http.get<NewsItem>(`${this.apiUrl}/${id}`);
  }
}
