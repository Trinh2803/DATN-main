import { Component, OnInit } from '@angular/core';
import { Discount, DiscountService } from '../services/discount.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quanlygiamgia',
  templateUrl: './quanlygiamgia.component.html',
  styleUrls: ['./quanlygiamgia.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class QuanlygiamgiaComponent implements OnInit {
  discounts: Discount[] = [];
  selectedDiscount: Discount = this.getEmptyDiscount();
  isEditMode = false;
  loading = false;
  errorMsg = '';

  constructor(private discountService: DiscountService) {}

  ngOnInit() {
    this.loadDiscounts();
  }

  getEmptyDiscount(): Discount {
    return {
      code: '',
      description: '',
      discountType: 'percent',
      discountValue: 0,
      startDate: '',
      endDate: '',
      active: true
    };
  }

  loadDiscounts() {
    this.loading = true;
    this.discountService.getDiscounts().subscribe({
      next: (data) => {
        this.discounts = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Không thể tải danh sách mã giảm giá';
        this.loading = false;
      }
    });
  }

  selectDiscount(discount: Discount) {
    this.selectedDiscount = { ...discount };
    this.isEditMode = true;
  }

  saveDiscount() {
    if (this.isEditMode && this.selectedDiscount.id) {
      this.discountService.updateDiscount(this.selectedDiscount.id, this.selectedDiscount).subscribe({
        next: () => {
          this.loadDiscounts();
          this.resetForm();
        },
        error: () => this.errorMsg = 'Cập nhật mã giảm giá thất bại'
      });
    } else {
      this.discountService.createDiscount(this.selectedDiscount).subscribe({
        next: () => {
          this.loadDiscounts();
          this.resetForm();
        },
        error: () => this.errorMsg = 'Thêm mã giảm giá thất bại'
      });
    }
  }

  deleteDiscount(id: string | undefined) {
    if (!id) return;
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    this.discountService.deleteDiscount(id).subscribe({
      next: () => this.loadDiscounts(),
      error: () => this.errorMsg = 'Xóa mã giảm giá thất bại'
    });
  }

  resetForm() {
    this.selectedDiscount = this.getEmptyDiscount();
    this.isEditMode = false;
    this.errorMsg = '';
  }
}
