// src/app/components/product-review/product-review.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-product-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form *ngIf="canReview" [formGroup]="reviewForm" (ngSubmit)="submitReview()" class="review-form">
      <label>
        Đánh giá:
        <input type="number" formControlName="rating" min="1" max="5">
      </label>
      <label>
        Bình luận:
        <textarea formControlName="comment"></textarea>
      </label>
      <button type="submit" [disabled]="isSubmitting">Gửi đánh giá</button>
    </form>
    <p *ngIf="!canReview">Bạn đã đánh giá sản phẩm này hoặc không thể đánh giá.</p>
  `,
  styles: [`
    .review-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      margin: 20px 0;
    }
    input, textarea {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class ProductReviewComponent implements OnInit {
  @Input() productId!: string;
  @Input() orderId!: string;

  reviewForm: FormGroup;
  canReview = false;
  isSubmitting = false;

  constructor(
    private reviewService: ReviewService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.checkCanReview();
  }

  checkCanReview() {
    this.reviewService.canReviewProduct(this.productId, this.orderId)
      .subscribe({
        next: (response: { canReview: boolean }) => {
          this.canReview = response.canReview;
        },
        error: (error) => {
          console.error('Error checking review status:', error);
        }
      });
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }

  submitReview() {
    if (this.reviewForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const reviewData = {
        productId: this.productId,
        orderId: this.orderId,
        ...this.reviewForm.value
      };

      this.reviewService.createReview(reviewData)
        .subscribe({
          next: (response) => {
            alert('Đánh giá sản phẩm thành công!');
            this.canReview = false;
            this.reviewForm.reset();
          },
          error: (error) => {
            console.error('Error submitting review:', error);
            alert('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
    }
  }
}