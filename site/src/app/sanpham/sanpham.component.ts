import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductInterface, CategoryInterface } from '../product-interface';
import { ProductService } from '../product.service';
import { UserService } from '../user.service';
import { ListcardComponent } from '../listcard/listcard.component';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

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

  wishlist: string[] = [];

  constructor(
    private productService: ProductService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loadWishlist();
  }

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
        
        // Lọc sản phẩm còn hàng (quantity > 0 hoặc không có quantity)
        const availableProducts = products.filter(product => 
          (product.quantity ?? 1) > 0
        );
        
        this.allProducts = availableProducts;
        this.filteredProducts = [...availableProducts];
        this.updatePagination();
        
        if (availableProducts.length === 0) {
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
          // Lọc sản phẩm còn hàng (quantity > 0 hoặc không có quantity)
          const availableProducts = products.filter(product => 
            (product.quantity ?? 1) > 0
          );
          
          this.allProducts = availableProducts;
          this.filteredProducts = [...availableProducts];
          this.updatePagination();
          this.errorMessage = availableProducts.length === 0 ? 'Không có sản phẩm nào trong danh mục này.' : '';
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
          // Lọc sản phẩm còn hàng (quantity > 0 hoặc không có quantity)
          const availableProducts = products.filter(product => 
            (product.quantity ?? 1) > 0
          );
          
          this.allProducts = availableProducts;
          this.filteredProducts = [...availableProducts];
          this.updatePagination();
          this.errorMessage = availableProducts.length === 0 ? 'Không có sản phẩm nào trong danh mục này.' : '';
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
          // Lọc sản phẩm còn hàng (quantity > 0 hoặc không có quantity)
          const availableProducts = products.filter(product => 
            (product.quantity ?? 1) > 0
          );
          
          this.allProducts = availableProducts;
          this.filteredProducts = [...availableProducts];
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

  loadWishlist(): void {
    if (this.userService.isLoggedIn()) {
      this.userService.getWishlist().subscribe({
        next: (response: any) => {
          if (response.success && Array.isArray(response.wishlist)) {
            this.wishlist = response.wishlist;
            this.updateProductsWishlistStatus();
          }
        },
        error: (error) => {
          console.error('Error loading wishlist:', error);
        }
      });
    }
  }

  // Update isInWishlist status for all products
  private updateProductsWishlistStatus(): void {
    this.allProducts.forEach(product => {
      product.isInWishlist = this.wishlist.includes(product._id);
    });
    // Update the filtered products with the new wishlist status
    this.filteredProducts = [...this.filteredProducts];
  }

  // Handle wishlist toggle from listcard component
  onWishlistToggled(product: ProductInterface): void {
    if (!this.userService.isLoggedIn()) {
      Swal.fire({
        title: 'Thông báo',
        text: 'Vui lòng đăng nhập để sử dụng tính năng yêu thích',
        icon: 'info',
        confirmButtonText: 'OK'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/dangnhap']);
        }
      });
      return;
    }

    const wasInWishlist = product.isInWishlist;
    
    // Optimistic UI update
    product.isInWishlist = !wasInWishlist;
    
    const wishlistAction = wasInWishlist 
      ? this.userService.removeFromWishlist(product._id)
      : this.userService.addToWishlist(product._id);
    
    wishlistAction.subscribe({
      next: (response: any) => {
        if (response.success) {
          // Update the wishlist array
          if (wasInWishlist) {
            this.wishlist = this.wishlist.filter(id => id !== product._id);
          } else {
            this.wishlist.push(product._id);
          }
          
          Swal.fire({
            title: 'Thành công',
            text: wasInWishlist 
              ? 'Đã xóa khỏi danh sách yêu thích' 
              : 'Đã thêm vào danh sách yêu thích',
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          // Revert on error
          product.isInWishlist = wasInWishlist;
          Swal.fire({
            title: 'Lỗi',
            text: response.message || 'Có lỗi xảy ra',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      error: (error) => {
        // Revert on error
        product.isInWishlist = wasInWishlist;
        console.error('Error toggling wishlist:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi cập nhật danh sách yêu thích';
        if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
          // Clear user data and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/dangnhap']);
        }
        
        Swal.fire({
          title: 'Lỗi',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  toggleWishlist(product: ProductInterface): void {
    if (!this.userService.isLoggedIn()) {
      Swal.fire({
        title: 'Yêu cầu đăng nhập',
        text: 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đăng nhập',
        cancelButtonText: 'Hủy'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/dangnhap']);
        }
      });
      return;
    }

    const productId = product._id;
    const wasInWishlist = product.isInWishlist;
    
    // Optimistic update
    product.isInWishlist = !wasInWishlist;
    
    const wishlistAction = wasInWishlist 
      ? this.userService.removeFromWishlist(productId)
      : this.userService.addToWishlist(productId);
    
    wishlistAction.subscribe({
      next: (response: any) => {
        if (response.success) {
          if (wasInWishlist) {
            this.wishlist = this.wishlist.filter(id => id !== productId);
            Swal.fire('Đã xóa', 'Đã xóa khỏi danh sách yêu thích', 'success');
          } else {
            this.wishlist.push(productId);
            Swal.fire('Đã thêm', 'Đã thêm vào danh sách yêu thích', 'success');
          }
        } else {
          // Revert on error
          product.isInWishlist = wasInWishlist;
          Swal.fire('Lỗi', response.message || 'Có lỗi xảy ra', 'error');
        }
      },
      error: (error) => {
        // Revert on error
        product.isInWishlist = wasInWishlist;
        console.error('Error updating wishlist:', error);
        Swal.fire('Lỗi', 'Không thể cập nhật danh sách yêu thích', 'error');
      }
    });
  }
}
