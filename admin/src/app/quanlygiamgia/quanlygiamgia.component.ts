import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DiscountService, Discount } from '../services/discount.service';

@Component({
  selector: 'app-quanlygiamgia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './quanlygiamgia.component.html',
  styleUrls: ['./quanlygiamgia.component.css']
})
export class QuanlygiamgiaComponent implements OnInit, AfterViewInit {
  discounts: Discount[] = [];
  filteredDiscounts: Discount[] = [];
  searchQuery = '';
  newDiscount: Discount = {
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 0,
    usedCount: 0,
    isActive: true,
    applicableProducts: [],
    applicableCategories: []
  };
  
  editingDiscount: Discount | null = null;
  isEditing = false;
  showForm = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private discountService: DiscountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDiscounts();
  }

  ngAfterViewInit(): void {
    // Xử lý icons trong sidebar
    document.querySelectorAll('.icon').forEach((ico) => {
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    this.router.navigate(['/login']);
  }

  search(): void {
    if (!this.searchQuery.trim()) {
      this.filteredDiscounts = this.discounts;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredDiscounts = this.discounts.filter(discount =>
        discount.code.toLowerCase().includes(query) ||
        discount.name.toLowerCase().includes(query) ||
        discount.description.toLowerCase().includes(query)
      );
    }
  }

  loadDiscounts(): void {
    this.loading = true;
    this.discountService.getAllDiscounts().subscribe({
      next: (data) => {
        this.discounts = data;
        this.filteredDiscounts = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading discounts:', error);
        this.errorMessage = 'Lỗi khi tải danh sách mã giảm giá';
        this.loading = false;
      }
    });
  }

  showAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingDiscount = null;
    this.resetForm();
  }

  showEditForm(discount: Discount): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingDiscount = { ...discount };
    this.newDiscount = { ...discount };
  }

  hideForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingDiscount = null;
    this.resetForm();
    this.clearMessages();
  }

  resetForm(): void {
    this.newDiscount = {
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 0,
      usedCount: 0,
      isActive: true,
      applicableProducts: [],
      applicableCategories: []
    };
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  validateForm(): boolean {
    if (!this.newDiscount.code || !this.newDiscount.name || 
        !this.newDiscount.startDate || !this.newDiscount.endDate) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin bắt buộc';
      return false;
    }

    if (this.newDiscount.discountType === 'percentage' && 
        (this.newDiscount.discountValue <= 0 || this.newDiscount.discountValue > 100)) {
      this.errorMessage = 'Phần trăm giảm giá phải từ 1-100%';
      return false;
    }

    if (this.newDiscount.discountType === 'fixed' && this.newDiscount.discountValue <= 0) {
      this.errorMessage = 'Số tiền giảm giá phải lớn hơn 0';
      return false;
    }

    const startDate = new Date(this.newDiscount.startDate);
    const endDate = new Date(this.newDiscount.endDate);
    if (startDate >= endDate) {
      this.errorMessage = 'Ngày kết thúc phải sau ngày bắt đầu';
      return false;
    }

    return true;
  }

  saveDiscount(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.clearMessages();

    if (this.isEditing && this.editingDiscount?._id) {
      this.discountService.updateDiscount(this.editingDiscount._id, this.newDiscount).subscribe({
        next: () => {
          this.successMessage = 'Cập nhật mã giảm giá thành công';
          this.loadDiscounts();
          this.hideForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating discount:', error);
          this.errorMessage = error.error?.message || 'Lỗi khi cập nhật mã giảm giá';
          this.loading = false;
        }
      });
    } else {
      this.discountService.createDiscount(this.newDiscount).subscribe({
        next: () => {
          this.successMessage = 'Tạo mã giảm giá thành công';
          this.loadDiscounts();
          this.hideForm();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating discount:', error);
          this.errorMessage = error.error?.message || 'Lỗi khi tạo mã giảm giá';
          this.loading = false;
        }
      });
    }
  }

  deleteDiscount(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      this.loading = true;
      this.discountService.deleteDiscount(id).subscribe({
        next: () => {
          this.successMessage = 'Xóa mã giảm giá thành công';
          this.loadDiscounts();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error deleting discount:', error);
          this.errorMessage = error.error?.message || 'Lỗi khi xóa mã giảm giá';
          this.loading = false;
        }
      });
    }
  }

  toggleActive(discount: Discount): void {
    const updatedDiscount = { ...discount, isActive: !discount.isActive };
    this.discountService.updateDiscount(discount._id!, updatedDiscount).subscribe({
      next: () => {
        this.loadDiscounts();
      },
      error: (error) => {
        console.error('Error toggling discount status:', error);
        this.errorMessage = 'Lỗi khi cập nhật trạng thái mã giảm giá';
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + 'đ';
  }

  getDiscountTypeText(type: string): string {
    return type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Hoạt động' : 'Vô hiệu hóa';
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }
}
