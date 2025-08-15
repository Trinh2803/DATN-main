import { Component, OnInit } from '@angular/core';
import { NewsService, NewsItem } from '../news.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-tintuc',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './tintuc.component.html',
  styleUrls: ['./tintuc.component.css']
})
export class TintucComponent implements OnInit {
  newsItems: NewsItem[] = [];
  latestPosts: NewsItem[] = [];
  categories = ['Media', 'News', 'People', 'Inspiration', 'Tips', 'Kitchen', 'Báo chí'];
  isLoading = true;
  error: string | null = null;
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews(this.currentPage);
  }

  loadNews(page: number): void {
    this.isLoading = true;
    this.newsService.getNews(page, this.pageSize).subscribe({
      next: (data) => {
        if (data && Array.isArray(data.news)) {
          this.newsItems = data.news;
          this.latestPosts = data.news.slice(0, 5);
          this.totalPages = data.totalPages || 1;
          this.currentPage = data.currentPage || page;
        } else {
          this.error = 'Dữ liệu tin tức không hợp lệ.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Không thể tải tin tức. Vui lòng thử lại sau.';
        this.isLoading = false;
        console.error('Error fetching news:', err);
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadNews(page);
    }
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
