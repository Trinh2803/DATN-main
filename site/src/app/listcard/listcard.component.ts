import { Component, Input, OnInit } from '@angular/core';
import { ProductInterface, Variant } from '../product-interface';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../cart.service';
import { WishlistService } from '../wishlist.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listcard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listcard.component.html',
  styleUrls: ['./listcard.component.css']
})
export class ListcardComponent implements OnInit {
  @Input() product!: ProductInterface; // Sửa từ data thành product, bỏ mảng
  @Input() data: ProductInterface[] = [];
  @Input() title = '';
  private wishlistCache = new Map<string, boolean>();

  constructor(
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {}

  // Kiểm tra sản phẩm có phải sale không
  isSaleProduct(product: ProductInterface): boolean {
    return !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  }

  // Kiểm tra sản phẩm có phải mới không (trong 7 ngày)
  isNewProduct(createdAt: string | Date | undefined): boolean {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }

  // Tính % giảm giá, đảm bảo salePrice là number
  calculateDiscountPercentage(price: number, salePrice: number): number {
    return Math.round(((price - salePrice) / price) * 100);
  }

  ngOnInit(): void {
    // Load wishlist status for this product only if product exists
    if (this.product) {
      this.loadWishlistStatus();
    }
  }

  private loadWishlistStatus(): void {
    if (!this.product) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.wishlistService.isInWishlist(this.product._id).subscribe({
      next: (isInWishlist) => {
        this.wishlistCache.set(this.product._id, isInWishlist);
      },
      error: (err) => {
        console.error('Error loading wishlist status:', err);
      }
    });
  }

  // nút yêu thích
  toggleFavorite(product: ProductInterface): void {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        title: 'Thông báo',
        text: 'Vui lòng đăng nhập để sử dụng tính năng yêu thích',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    const isCurrentlyInWishlist = this.wishlistCache.get(product._id) || false;

    if (isCurrentlyInWishlist) {
      // Xóa khỏi wishlist
      this.wishlistService.removeFromWishlist(product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistCache.set(product._id, false);
            Swal.fire({
              title: 'Thành công',
              text: 'Đã xóa khỏi danh sách yêu thích',
              icon: 'success',
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              title: 'Lỗi',
              text: response.message || 'Lỗi khi xóa khỏi danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
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
            Swal.fire({
              title: 'Lỗi',
              text: 'Lỗi khi xóa khỏi danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        }
      });
    } else {
      // Thêm vào wishlist
      this.wishlistService.addToWishlist(product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistCache.set(product._id, true);
            Swal.fire({
              title: 'Thành công',
              text: 'Đã thêm vào danh sách yêu thích',
              icon: 'success',
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              title: 'Lỗi',
              text: response.message || 'Lỗi khi thêm vào danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        },
        error: (err) => {
          console.error('Error adding to wishlist:', err);
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
            Swal.fire({
              title: 'Lỗi',
              text: 'Lỗi khi thêm vào danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        }
      });
    }
  }

  isFavorite(product: ProductInterface): boolean {
    if (!product || !product._id) return false;
    return this.wishlistCache.get(product._id) || false;
  }

  // nút mua ngay - cập nhật để hỗ trợ biến thể
  buyNow(product: ProductInterface) {
    // Kiểm tra nếu sản phẩm có biến thể
    if (product.variants && product.variants.length > 0) {
      // Nếu có biến thể, chuyển đến trang chi tiết để chọn biến thể
      this.router.navigate(['/chitiet', product._id]);
      return;
    }

    // Nếu không có biến thể, thêm trực tiếp vào giỏ hàng
    const productToAdd: ProductInterface = { ...product };
    this.cartService.addToCart(productToAdd);

    // Hiển thị thông báo
    alert(`Đã thêm ${product.name} vào giỏ hàng`);

    // Chuyển đến trang giỏ hàng
    this.router.navigate(['/giohang']);
  }

  // Thêm vào giỏ hàng (nút mới)
  addToCart(product: ProductInterface) {
    // Kiểm tra nếu sản phẩm có biến thể
    if (product.variants && product.variants.length > 0) {
      // Nếu có biến thể, chuyển đến trang chi tiết để chọn biến thể
      this.router.navigate(['/chitiet', product._id]);
      return;
    }

    // Nếu không có biến thể, thêm trực tiếp vào giỏ hàng
    const productToAdd: ProductInterface = { ...product };
    this.cartService.addToCart(productToAdd);
  }

  getCurrentPrice(product: ProductInterface): number {
    if (product.salePrice && product.salePrice > 0) {
      return product.salePrice;
    }
    return product.price;
  }

  getOriginalPrice(product: ProductInterface): number {
    return product.price;
  }

  hasDiscount(product: ProductInterface): boolean {
    if (!product || typeof product.price === 'undefined') return false;
    return !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  }

  calculateDiscount(product: ProductInterface): number {
    if (!product.salePrice || product.salePrice >= product.price) {
      return 0;
    }
    return Math.round(((product.price - product.salePrice) / product.price) * 100);
  }

  isInStock(product: ProductInterface): boolean {
    if (!product) return false;
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.some(v => v && v.stock > 0);
    }
    return (product.stock || 0) > 0;
  }
}
