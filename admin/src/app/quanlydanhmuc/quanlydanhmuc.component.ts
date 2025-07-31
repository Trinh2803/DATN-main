import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CategoryService, Category, ApiResponse } from '../services/category.service';

@Component({
  selector: 'app-quanlydanhmuc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './quanlydanhmuc.component.html',
  styleUrls: ['./quanlydanhmuc.component.css'],
})
export class QuanlydanhmucComponent implements OnInit, AfterViewInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  displayedCategories: Category[] = []; // Danh mục hiển thị trên trang hiện tại
  searchQuery: string = '';
  userAvatar: string = '/assets/images/icon.png';
  errorMessage: string | null = null;
  showForm: boolean = false;
  editMode: boolean = false;
  currentCategory: Category & { imageFile?: File; imageUrl?: string } = { name: '', slug: '' };
  currentPage: number = 1; // Trang hiện tại
  categoriesPerPage: number = 5; // Số danh mục mỗi trang
  totalPages: number = 1; // Tổng số trang

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      this.errorMessage = 'Vui lòng đăng nhập.';
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    this.loadCategories();
    this.loadUserAvatar();
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('.icon').forEach((ico) => {
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  loadCategories(): void {
    console.log('Loading categories with search query:', this.searchQuery);
    this.categoryService.getCategories(this.searchQuery).subscribe({
      next: (response: ApiResponse<Category[]>) => {
        if (response.success) {
          this.categories = response.data || [];
          this.filteredCategories = this.categories;
          this.updatePagination();
          this.errorMessage = null;
          console.log('Categories loaded:', this.categories);
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy danh sách danh mục.';
          console.log('Error response from getCategories:', response.message);
        }
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage = err.status === 401 || err.status === 403
          ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
          : err.error?.message || err.message || 'Lỗi khi lấy danh sách danh mục';
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadUserAvatar(): void {
    const avatar = localStorage.getItem('userAvatar') || '/assets/images/icon.png';
    this.userAvatar = avatar;
    console.log('User avatar loaded:', this.userAvatar);
  }

  search(): void {
    console.log('Search triggered with query:', this.searchQuery);
    this.currentPage = 1; // Reset về trang 1 khi tìm kiếm
    this.loadCategories();
  }

  showAddForm(): void {
    this.showForm = true;
    this.editMode = false;
    this.currentCategory = { name: '', slug: '' };
    console.log('Showing add category form');
  }

  showEditForm(category: Category): void {
    if (!category._id) {
      this.errorMessage = 'Danh mục không có ID hợp lệ.';
      console.log('Invalid category ID:', category);
      return;
    }
    this.showForm = true;
    this.editMode = true;
    this.currentCategory = {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      imageUrl: category.image ? `http://localhost:3000${category.image}` : undefined
    };
    console.log('Showing edit form for category:', this.currentCategory);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.currentCategory.imageFile = input.files[0];
      this.currentCategory.imageUrl = URL.createObjectURL(input.files[0]);
      console.log('Image selected:', this.currentCategory.imageFile.name);
    }
  }

  saveCategory(): void {
    if (!this.currentCategory.name || !this.currentCategory.slug) {
      this.errorMessage = 'Tên và slug danh mục không được để trống.';
      console.log('Missing name or slug:', this.currentCategory);
      return;
    }

    const categoryData = {
      name: this.currentCategory.name,
      slug: this.currentCategory.slug,
      image: this.currentCategory.imageFile
    };
    console.log('Saving category:', categoryData);

    if (this.editMode) {
      if (!this.currentCategory._id) {
        this.errorMessage = 'Không tìm thấy ID danh mục để cập nhật.';
        console.log('Missing category ID for update');
        return;
      }
      this.categoryService.updateCategory(this.currentCategory._id, categoryData).subscribe({
        next: (response: ApiResponse<Category>) => {
          if (response.success) {
            this.loadCategories();
            this.closeForm();
            this.errorMessage = null;
            console.log('Category updated:', response.data);
          } else {
            this.errorMessage = response.message || 'Lỗi khi cập nhật danh mục.';
            console.log('Update category failed:', response.message);
          }
        },
        error: (err) => {
          console.error('Error updating category:', err);
          this.errorMessage = err.error?.message || err.message || 'Lỗi khi cập nhật danh mục';
        },
      });
    } else {
      this.categoryService.addCategory(categoryData).subscribe({
        next: (response: ApiResponse<Category>) => {
          if (response.success) {
            this.loadCategories();
            this.closeForm();
            this.errorMessage = null;
            console.log('Category added:', response.data);
          } else {
            this.errorMessage = response.message || 'Lỗi khi thêm danh mục.';
            console.log('Add category failed:', response.message);
          }
        },
        error: (err) => {
          console.error('Error adding category:', err);
          this.errorMessage = err.error?.message || err.message || 'Lỗi khi thêm danh mục';
        },
      });
    }
  }

  deleteCategory(id: string): void {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
      console.log('Deleting category with ID:', id);
      this.categoryService.deleteCategory(id).subscribe({
        next: (response: ApiResponse<null>) => {
          if (response.success) {
            this.loadCategories();
            this.errorMessage = null;
            console.log('Category deleted:', id);
          } else {
            this.errorMessage = response.message || 'Lỗi khi xóa danh mục.';
            console.log('Delete category failed:', response.message);
          }
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          this.errorMessage = err.error?.message || err.message || 'Lỗi khi xóa danh mục';
        },
      });
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.currentCategory = { name: '', slug: '' };
    console.log('Form closed');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userAvatar');
    console.log('Logging out');
    this.router.navigate(['/login']);
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.categoriesPerPage);
    const startIndex = (this.currentPage - 1) * this.categoriesPerPage;
    const endIndex = startIndex + this.categoriesPerPage;
    this.displayedCategories = this.filteredCategories.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
