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
        this.allProducts = products;
        this.filteredProducts = [...products];
        this.updatePagination();
        this.errorMessage = products.length === 0 ? 'Không có sản phẩm nào để hiển thị.' : '';
      },
      error: (error) => {
        console.error('Error fetching products:', error);
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
    } else {
      this.loadProducts();
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
    this.totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
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
