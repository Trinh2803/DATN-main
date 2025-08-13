import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductInterface, CategoryInterface } from '../product-interface';
import { ProductService } from '../product.service';
import { ListcardComponent } from '../listcard/listcard.component';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'sanpham',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ListcardComponent],
  templateUrl: './sanpham.component.html',
  styleUrls: ['./sanpham.component.css'],
})
export class SanphamComponent implements OnInit {
  allProducts: ProductInterface[] = [];
  filteredProducts: ProductInterface[] = [];
  displayedProducts: ProductInterface[] = [];
  categories: CategoryInterface[] = [{ _id: '', name: 'Tất cả', slug: '', image: '' }];
  selectedCategory: string = '';
  sortOrder: 'asc' | 'desc' | '' = '';
  searchQuery: string = '';
  errorMessage: string = '';
  private searchSubject = new Subject<string>();
  currentPage: number = 1;
  productsPerPage: number = 12;
  totalPages: number = 1;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.route.queryParams.subscribe((params) => {
      this.searchQuery = params['name'] || '';
      this.currentPage = params['page'] ? +params['page'] : 1;
      if (this.searchQuery) {
        this.onSearchChangeDebounced();
      } else {
        this.loadProducts();
      }
    });
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.onSearchChangeDebounced();
      });
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories: CategoryInterface[]) => {
        this.categories = [{ _id: '', name: 'Tất cả', slug: '', image: '' }, ...categories];
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
        this.errorMessage = 'Không thể tải danh mục. Vui lòng thử lại sau.';
      },
    });
  }

  private loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products: ProductInterface[]) => {
        console.log('API trả về:', products);
        if (!products || !Array.isArray(products)) {
          this.errorMessage = 'API trả về dữ liệu không hợp lệ.';
          this.allProducts = [];
          this.filteredProducts = [];
          this.displayedProducts = [];
          return;
        }
        this.allProducts = products;
        this.filteredProducts = [...products];
        this.updatePagination();
        if (products.length === 0) {
          this.errorMessage = 'Không có sản phẩm nào để hiển thị.';
        } else if (this.displayedProducts.length === 0) {
          this.errorMessage = 'Không có sản phẩm nào hợp lệ để hiển thị.';
        } else {
          this.errorMessage = '';
        }
      },
      error: (error) => {
        console.error('Lỗi API:', error);
        this.allProducts = [];
        this.filteredProducts = [];
        this.displayedProducts = [];
        this.errorMessage = 'Không thể tải sản phẩm. Vui lòng thử lại.';
      },
    });
  }

  onCategoryChange(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.currentPage = 1;
    if (categoryId) {
      this.productService.getProductsByCategory(categoryId).subscribe({
        next: (products) => {
          this.allProducts = products;
          this.filteredProducts = [...products];
          this.updatePagination();
          this.errorMessage = products.length === 0 ? 'Không có sản phẩm nào trong danh mục này.' : '';
        },
        error: (error) => {
          console.error('Error fetching products by category:', error);
          this.filteredProducts = [];
          this.displayedProducts = [];
          this.errorMessage = 'Không thể tải sản phẩm theo danh mục.';
        },
      });
    } else {
      this.loadProducts();
    }
  }

onSortChange(order: 'asc' | 'desc' | ''): void {
  this.sortOrder = order;
  this.currentPage = 1;

  if (order) {
    if (this.selectedCategory) {
      // Nếu có danh mục được chọn, gọi API với danh mục và sắp xếp giá
      this.productService.getProductsByCategoryAndPriceSort(this.selectedCategory, order).subscribe({
        next: (products) => {
          this.allProducts = products;
          this.filteredProducts = [...products];
          this.updatePagination();
          this.errorMessage = products.length === 0 ? 'Không có sản phẩm nào trong danh mục này.' : '';
        },
        error: (error) => {
          console.error('Error fetching products by category and sort:', error);
          this.filteredProducts = [];
          this.displayedProducts = [];
          this.errorMessage = 'Không thể tải sản phẩm theo danh mục và sắp xếp.';
        },
      });
    } else {
      // Nếu không có danh mục được chọn, chỉ sắp xếp theo giá
      this.productService.getProductsByPriceSort(order).subscribe({
        next: (products) => {
          this.allProducts = products;
          this.filteredProducts = [...products];
          this.updatePagination();
          this.errorMessage = products.length === 0 ? 'Không có sản phẩm nào để sắp xếp.' : '';
        },
        error: (error) => {
          console.error('Error sorting products:', error);
          this.filteredProducts = [];
          this.displayedProducts = [];
          this.errorMessage = 'Không thể sắp xếp sản phẩm.';
        },
      });
    }
  } else {
    // Nếu chọn "Mặc định", tải lại sản phẩm theo danh mục (nếu có) hoặc tất cả sản phẩm
    if (this.selectedCategory) {
      this.onCategoryChange(this.selectedCategory);
    } else {
      this.loadProducts();
    }
  }
}

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private onSearchChangeDebounced(): void {
    this.currentPage = 1;
    if (this.searchQuery.trim()) {
      this.productService.searchProductsByName(this.searchQuery).subscribe({
        next: (products) => {
          this.allProducts = products;
          this.filteredProducts = [...products];
          this.updatePagination();
          this.errorMessage = products.length === 0 ? 'Không tìm thấy sản phẩm nào phù hợp.' : '';
        },
        error: (error) => {
          console.error('Error searching products:', error);
          this.filteredProducts = [];
          this.displayedProducts = [];
          this.errorMessage = 'Không thể tìm kiếm sản phẩm. Vui lòng thử lại.';
        },
      });
    } else {
      this.loadProducts();
    }
  }

  updatePagination(): void {
    // Hiển thị tất cả sản phẩm, không lọc theo stock
    const validProducts = this.filteredProducts.filter((p: any) =>
      p && typeof p === 'object' && p._id
    );
    this.totalPages = Math.ceil(validProducts.length / this.productsPerPage);
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    this.displayedProducts = validProducts.slice(startIndex, endIndex);
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
