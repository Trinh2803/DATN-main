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
    // Component initialization
  }

  // nút yêu thích
  toggleFavorite(product: ProductInterface): void {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng yêu thích', 'info');
      return;
    }

    this.wishlistService.isInWishlist(product._id).subscribe({
      next: (isInWishlist) => {
        if (isInWishlist) {
          // Xóa khỏi wishlist
          this.wishlistService.removeFromWishlist(product._id).subscribe({
            next: (response) => {
              if (response.success) {
                Swal.fire('Thành công', 'Đã xóa khỏi danh sách yêu thích', 'success');
              } else {
                Swal.fire('Lỗi', response.message || 'Lỗi khi xóa khỏi danh sách yêu thích', 'error');
              }
            },
            error: (err) => {
              console.error('Error removing from wishlist:', err);
              Swal.fire('Lỗi', 'Lỗi khi xóa khỏi danh sách yêu thích', 'error');
            }
          });
        } else {
          // Thêm vào wishlist
          this.wishlistService.addToWishlist(product._id).subscribe({
            next: (response) => {
              if (response.success) {
                Swal.fire('Thành công', 'Đã thêm vào danh sách yêu thích', 'success');
              } else {
                Swal.fire('Lỗi', response.message || 'Lỗi khi thêm vào danh sách yêu thích', 'error');
              }
            },
            error: (err) => {
              console.error('Error adding to wishlist:', err);
              Swal.fire('Lỗi', 'Lỗi khi thêm vào danh sách yêu thích', 'error');
            }
          });
        }
      },
      error: (err) => {
        console.error('Error checking wishlist status:', err);
        Swal.fire('Lỗi', 'Lỗi khi kiểm tra trạng thái yêu thích', 'error');
      }
    });
  }

  isFavorite(product: ProductInterface): boolean {
    let isFavorite = false;
    this.wishlistService.isInWishlist(product._id).subscribe({
      next: (inWishlist) => {
        isFavorite = inWishlist;
      }
    });
    return isFavorite;
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

    // Hiển thị thông báo
    alert(`Đã thêm ${product.name} vào giỏ hàng`);
  }

  // Lấy giá hiện tại (có thể là giá biến thể hoặc giá sản phẩm)
  getCurrentPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      // Nếu có biến thể, hiển thị giá thấp nhất
      const minPrice = Math.min(...product.variants.map(v => v.salePrice || v.price));
      return minPrice;
    }
    return product.salePrice || product.price;
  }

  // Lấy giá gốc (không giảm giá)
  getOriginalPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      // Nếu có biến thể, hiển thị giá gốc thấp nhất
      const minOriginalPrice = Math.min(...product.variants.map(v => v.price));
      return minOriginalPrice;
    }
    return product.price;
  }

  // Kiểm tra sản phẩm có giảm giá không (bao gồm biến thể)
  hasDiscount(product: ProductInterface): boolean {
    if (product.variants && product.variants.length > 0) {
      // Kiểm tra xem có biến thể nào có giảm giá không
      return product.variants.some(v => v.salePrice && v.salePrice < v.price);
    }
    return this.isSaleProduct(product);
  }

  // Tính % giảm giá (bao gồm biến thể)
  calculateDiscount(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      // Tìm biến thể có % giảm giá cao nhất
      const maxDiscount = Math.max(...product.variants.map(v => {
        if (!v.salePrice || v.salePrice >= v.price) return 0;
        return Math.round(((v.price - v.salePrice) / v.price) * 100);
      }));
      return maxDiscount;
    }
    return this.calculateDiscountPercentage(product.price, product.salePrice || 0);
  }

  // Kiểm tra sản phẩm có còn hàng không
  isInStock(product: ProductInterface): boolean {
    if (product.variants && product.variants.length > 0) {
      // Kiểm tra xem có biến thể nào còn hàng không
      return product.variants.some(v => v.stock > 0);
    }
    return true; // Nếu không có biến thể, coi như còn hàng
  }
}
