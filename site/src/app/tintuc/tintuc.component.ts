import { Component, OnInit } from '@angular/core';
import { NewsService, NewsItem } from '../news.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tintuc',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tintuc.component.html',
  styleUrls: ['./tintuc.component.css']
})
export class TintucComponent implements OnInit {
  newsItems: NewsItem[] = [];
  latestPosts: NewsItem[] = [];
  categories = ['Media', 'News', 'People', 'Inspiration', 'Tips', 'Kitchen', 'Báo chí'];

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.newsService.getNews().subscribe(data => {
      this.newsItems = data;
      this.latestPosts = data.slice(0, 5); // Lấy 5 bài mới nhất
    });
  }
}
