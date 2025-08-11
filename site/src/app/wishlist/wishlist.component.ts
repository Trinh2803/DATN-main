import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WishlistService, WishlistItem } from '../wishlist.service';
import Swal from 'sweetalert2';

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
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

<<<<<<< HEAD
  loadWishlist(): void {
    this.loading = true;
    this.wishlistService.getUserWishlist().subscribe({
      next: (response) => {
        if (response.success) {
          this.wishlistItems = response.data;
          this.error = null;
        } else {
          this.error = response.message || 'Lỗi khi tải danh sách yêu thích';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading wishlist:', err);
        // Check if token is expired
        if (err.status === 401 || err.status === 403) {
          this.error = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
          // Clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/dangnhap']);
        } else {
          this.error = 'Lỗi khi tải danh sách yêu thích';
        }
        this.loading = false;
      }
    });
=======
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
  const token = localStorage.getItem('token');
  if (!token) {
    this.wishlistItems = []; // Đặt danh sách trống
    this.loading = false;
    return; // Không hiển thị thông báo, chỉ tải giao diện trống
>>>>>>> Trinh
  }
  this.wishlistService.getUserWishlist().subscribe({
    next: (response) => {
      if (response.success) {
        this.wishlistItems = response.data;
        this.error = null;
      } else {
        this.error = response.message || 'Lỗi khi tải danh sách yêu thích';
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Lỗi khi tải danh sách yêu thích:', err);
      if (err.status === 401 || err.status === 403) {
        this.handleAuthError(); // Giữ lại xử lý lỗi xác thực
      } else {
        this.error = 'Lỗi khi tải danh sách yêu thích';
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
        this.wishlistService.removeFromWishlist(productId).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadWishlist();
              Swal.fire('Thành công', 'Đã xóa khỏi danh sách yêu thích', 'success');
            } else {
              Swal.fire('Lỗi', response.message || 'Lỗi khi xóa sản phẩm', 'error');
            }
          },
          error: (err) => {
            console.error('Error removing from wishlist:', err);
            // Check if token is expired
            if (err.status === 401 || err.status === 403) {
              Swal.fire({
                title: 'Phiên đăng nhập hết hạn',
                text: 'Vui lòng đăng nhập lại',
                icon: 'warning',
                confirmButtonText: 'OK'
              });
              // Clear token and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              this.router.navigate(['/dangnhap']);
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
      text: 'Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.wishlistService.clearWishlist().subscribe({
          next: (response) => {
            if (response.success) {
              this.wishlistItems = [];
              Swal.fire('Thành công', 'Đã xóa toàn bộ danh sách yêu thích', 'success');
            } else {
              Swal.fire('Lỗi', response.message || 'Lỗi khi xóa danh sách', 'error');
            }
          },
          error: (err) => {
            console.error('Error clearing wishlist:', err);
            // Check if token is expired
            if (err.status === 401 || err.status === 403) {
              Swal.fire({
                title: 'Phiên đăng nhập hết hạn',
                text: 'Vui lòng đăng nhập lại',
                icon: 'warning',
                confirmButtonText: 'OK'
              });
              // Clear token and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              this.router.navigate(['/dangnhap']);
            } else {
              Swal.fire('Lỗi', 'Lỗi khi xóa danh sách', 'error');
            }
          }
        });
      }
    });
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  getDiscountedPrice(price: number, discountPercent?: number): number {
    if (discountPercent && discountPercent > 0) {
      return price - (price * discountPercent / 100);
    }
    return price;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
} 