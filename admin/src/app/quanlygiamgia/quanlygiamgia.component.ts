import { Component, OnInit, AfterViewInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DiscountService, Discount } from '../services/discount.service';
import { ProductService, Product } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';

@Component({
  selector: 'app-quanlygiamgia',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './quanlygiamgia.component.html',
  styleUrls: ['./quanlygiamgia.component.css']
})
export class QuanlygiamgiaComponent implements OnInit, AfterViewInit {
  discounts: Discount[] = [];
  filteredDiscounts: Discount[] = [];
  searchQuery = '';
  
  // Danh sách sản phẩm và danh mục
  products: Product[] = [];
  categories: Category[] = [];
  
  // Sản phẩm và danh mục đã chọn
  selectedProducts: Product[] = [];
  selectedCategories: Category[] = [];
  
  // Tìm kiếm sản phẩm và danh mục
  productSearchQuery = '';
  categorySearchQuery = '';
  filteredProducts: Product[] = [];
  filteredCategories: Category[] = [];
  
  // Hiển thị modal chọn sản phẩm/danh mục
  showProductModal = false;
  showCategoryModal = false;
  
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
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadProducts();
    this.loadCategories();
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

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
        this.filteredCategories = response.data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
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
    this.updateSelectedItems();
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
    this.selectedProducts = [];
    this.selectedCategories = [];
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

  // Quản lý sản phẩm
  showProductSelectionModal(): void {
    this.showProductModal = true;
    this.productSearchQuery = '';
    this.filteredProducts = this.products;
  }

  hideProductModal(): void {
    this.showProductModal = false;
    this.productSearchQuery = '';
  }

  searchProducts(): void {
    if (!this.productSearchQuery.trim()) {
      this.filteredProducts = this.products;
    } else {
      const query = this.productSearchQuery.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }
  }

  selectProduct(product: Product): void {
    if (!this.selectedProducts.find(p => p._id === product._id)) {
      this.selectedProducts.push(product);
      this.newDiscount.applicableProducts.push(product._id!);
    }
  }

  removeProduct(productId: string): void {
    this.selectedProducts = this.selectedProducts.filter(p => p._id !== productId);
    this.newDiscount.applicableProducts = this.newDiscount.applicableProducts.filter(id => id !== productId);
  }

  // Quản lý danh mục
  showCategorySelectionModal(): void {
    this.showCategoryModal = true;
    this.categorySearchQuery = '';
    this.filteredCategories = this.categories;
  }

  hideCategoryModal(): void {
    this.showCategoryModal = false;
    this.categorySearchQuery = '';
  }

  searchCategories(): void {
    if (!this.categorySearchQuery.trim()) {
      this.filteredCategories = this.categories;
    } else {
      const query = this.categorySearchQuery.toLowerCase();
      this.filteredCategories = this.categories.filter(category =>
        category.name.toLowerCase().includes(query)
      );
    }
  }

  selectCategory(category: Category): void {
    if (!this.selectedCategories.find(c => c._id === category._id)) {
      this.selectedCategories.push(category);
      this.newDiscount.applicableCategories.push(category._id!);
    }
  }

  removeCategory(categoryId: string): void {
    this.selectedCategories = this.selectedCategories.filter(c => c._id !== categoryId);
    this.newDiscount.applicableCategories = this.newDiscount.applicableCategories.filter(id => id !== categoryId);
  }

  // Cập nhật form khi chỉnh sửa
  updateSelectedItems(): void {
    // Cập nhật sản phẩm đã chọn
    this.selectedProducts = this.products.filter(product => 
      this.newDiscount.applicableProducts.includes(product._id!)
    );
    
    // Cập nhật danh mục đã chọn
    this.selectedCategories = this.categories.filter(category => 
      this.newDiscount.applicableCategories.includes(category._id!)
    );
  }

  // Lấy tên sản phẩm theo ID
  getProductName(productId: string): string {
    const product = this.products.find(p => p._id === productId);
    return product ? product.name : 'Sản phẩm không tồn tại';
  }

  // Lấy tên danh mục theo ID
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Danh mục không tồn tại';
  }

  // Kiểm tra sản phẩm đã được chọn
  isProductSelected(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.selectedProducts.some(p => p._id === productId);
  }

  // Kiểm tra danh mục đã được chọn
  isCategorySelected(categoryId: string | undefined): boolean {
    if (!categoryId) return false;
    return this.selectedCategories.some(c => c._id === categoryId);
  }
}
