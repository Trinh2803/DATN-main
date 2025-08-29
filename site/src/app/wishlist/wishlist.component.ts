import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { ProductService } from '../product.service';
import Swal from 'sweetalert2';

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  thumbnail: string;
  discountPercent?: number;
  discountPrice?: number;
  categoryId: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    thumbnail: string;
    discountPercent?: number;
    categoryId: string;
  };
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  private handleAuthError(): void {
    Swal.fire({
      title: 'Phiên đăng nhập hết hạn',
      text: 'Vui lòng đăng nhập lại',
      icon: 'warning',
      confirmButtonText: 'OK'
    }).then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.router.navigate(['/dangnhap']);
    });
  }

  loadWishlist(): void {
    this.loading = true;
    
    if (!this.userService.isLoggedIn()) {
      this.wishlistItems = [];
      this.loading = false;
      return;
    }
    
    console.log('Đang tải danh sách yêu thích...');
    this.userService.getWishlist().subscribe({
      next: (response: any) => {
        console.log('Phản hồi từ API:', response);
        
        // Handle different response formats
        let wishlistData = Array.isArray(response) ? response : 
                          (response.data || (response.success ? response.wishlist : []));
        
        if (Array.isArray(wishlistData)) {
          // Transform the response data to match our WishlistItem interface
          this.wishlistItems = wishlistData.map((item: any) => {
            // Handle case where product data is nested in productId or directly in item
            const productData = item.productId || item;
            
            return {
              _id: item._id || productData._id,
              name: productData?.name || 'Sản phẩm không xác định',
              price: productData?.price || 0,
              thumbnail: productData?.thumbnail || '',
              discountPercent: productData?.discountPercent,
              categoryId: productData?.categoryId || '',
              productId: {
                _id: productData?._id || '',
                name: productData?.name || 'Sản phẩm không xác định',
                price: productData?.price || 0,
                thumbnail: productData?.thumbnail || '',
                discountPercent: productData?.discountPercent,
                categoryId: productData?.categoryId || ''
              }
            };
          });
          this.error = null;
        } else {
          this.error = response.message || 'Định dạng dữ liệu không hợp lệ';
          console.error('Định dạng dữ liệu không hợp lệ:', response);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách yêu thích:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        
        if (err.status === 401 || err.status === 403) {
          this.handleAuthError();
        } else {
          this.error = `Lỗi khi tải danh sách yêu thích (${err.status || 'Lỗi máy chủ'})`;
          this.loading = false;
        }
      }
    });
  }

  removeFromWishlist(productId: string): void {
    Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.userService.removeFromWishlist(productId).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadWishlist();
              Swal.fire('Thành công', 'Đã xóa khỏi danh sách yêu thích', 'success');
            } else {
              Swal.fire('Lỗi', response.message || 'Lỗi khi xóa sản phẩm', 'error');
            }
          },
          error: (err) => {
            console.error('Lỗi khi xóa khỏi danh sách yêu thích:', err);
            if (err.status === 401 || err.status === 403) {
              this.handleAuthError();
            } else {
              Swal.fire('Lỗi', 'Lỗi khi xóa sản phẩm', 'error');
            }
          }
        });
      }
    });
  }

  clearWishlist(): void {
    if (this.wishlistItems.length === 0) {
      return;
    }

    Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove each item one by one
        const removePromises = this.wishlistItems.map(item => 
          this.userService.removeFromWishlist(item._id).toPromise()
        );

        Promise.all(removePromises)
          .then(() => {
            Swal.fire('Đã xóa', 'Tất cả sản phẩm đã được xóa khỏi danh sách yêu thích', 'success');
            this.loadWishlist();
          })
          .catch(err => {
            console.error('Error clearing wishlist:', err);
            Swal.fire('Lỗi', 'Không thể xóa một số sản phẩm khỏi danh sách yêu thích', 'error');
          });
      }
    });
  }

  addToWishlist(productId: string): void {
    this.userService.addToWishlist(productId).subscribe({
      next: (response: any) => {
        if (response.success) {
          Swal.fire('Thành công', 'Đã thêm vào danh sách yêu thích', 'success');
          this.loadWishlist();
        } else {
          Swal.fire('Lỗi', response.message || 'Có lỗi xảy ra', 'error');
        }
      },
      error: (err) => {
        console.error('Error adding to wishlist:', err);
        Swal.fire('Lỗi', 'Không thể thêm vào danh sách yêu thích', 'error');
      }
    });
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/sanpham', productId]);
  }

  getImageUrl(thumbnail: string): string {
    if (!thumbnail) return 'assets/images/default-product.jpg';
    if (thumbnail.startsWith('http')) return thumbnail;
    return `http://localhost:3000${thumbnail}`;
  }

  getDiscountedPrice(price: number, discountPercent?: number): number {
    if (!discountPercent || discountPercent <= 0) return price;
    return price - (price * discountPercent / 100);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/default-product.jpg';
    }
  }

  navigateToShop(): void {
    this.router.navigate(['/sanpham']);
  }
}
