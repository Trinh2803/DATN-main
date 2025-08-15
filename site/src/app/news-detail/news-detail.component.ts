import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NewsService, NewsItem } from '../news.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.css']
})
export class NewsDetailComponent implements OnInit {
  newsItem: NewsItem | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private newsService: NewsService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.newsService.getNewsById(id).subscribe({
        next: (data) => {
          if (data && Object.keys(data).length > 0) {
            this.newsItem = data;
          } else {
            this.error = 'Không tìm thấy tin tức.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.status === 404 ? 'Tin tức không tồn tại.' : 'Không thể tải chi tiết tin tức.';
          this.isLoading = false;
          console.error('Error fetching news:', err);
        }
      });
    } else {
      this.error = 'ID tin tức không hợp lệ.';
      this.isLoading = false;
    }
  }
}
