import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderService, ApiResponse, Order } from '../order.service';
import { ProductReviewComponent } from '../components/product-review/product-review.component';

@Component({
  selector: 'app-donhangchitiet',
  standalone: true,
  imports: [CommonModule, ProductReviewComponent],
  templateUrl: './donhangchitiet.component.html',
  styleUrls: ['./donhangchitiet.component.css']
})
export class DonhangchitietComponent implements OnInit {
  order: any;
  showReviewButton = false;
  showReviewForProduct: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const orderId = params['id'];
      if (orderId) {
        this.loadOrderDetails(orderId);
      }
    });
  }

  loadOrderDetails(orderId: string) {
    this.orderService.getOrderById(orderId).subscribe({
      next: (response: ApiResponse<Order>) => {
        if (response.success && response.data) {
          this.order = {
            ...response.data,
            orderDate: new Date(response.data.createdAt).toLocaleDateString('vi-VN'),
            products: response.data.items.map((item: any) => ({
              productId: item.productId?._id || item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              thumbnail: item.thumbnail || item.productId?.thumbnail || ''
            }))
          };
          // Kiểm tra điều kiện hiển thị nút đánh giá
          this.showReviewButton = this.order.status === 'delivered' && !this.order.isReviewed;
        } else {
          console.error('Invalid order data:', response);
          this.order = null;
        }
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.order = null;
      }
    });
  }

  openReview(productId: string) {
    this.showReviewForProduct = productId;
  }
}