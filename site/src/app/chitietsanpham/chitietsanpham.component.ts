import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../product.service';
import { CartService } from '../cart.service';
import { CommonModule } from '@angular/common';
import { ProductInterface, Variant } from '../product-interface';
import { WishlistService } from '../wishlist.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-chitietsanpham',
  templateUrl: './chitietsanpham.component.html',
  styleUrls: ['./chitietsanpham.component.css'],
})
export class ChiTietSanPhamComponent implements OnInit {
  product: ProductInterface | null = null;
  selectedVariant: Variant | null = null;
  quantity: number = 1;
  selectedImage: string | null = null;  //Thêm biến lưu ảnh chính
  relatedProducts: ProductInterface[] = []; // Thêm sản phẩm liên quan
  private wishlistCache = new Map<string, boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductById(productId).subscribe({
        next: (data: ProductInterface) => {
          this.product = data;
          this.selectedVariant = data.selectedVariant || null;
          this.selectedImage = data.thumbnail;
          console.log('Processed product data:', data);
          // Lấy sản phẩm liên quan sau khi có thông tin sản phẩm
          this.loadRelatedProducts();
          // Load wishlist status
          this.loadWishlistStatus();
        },
        error: (err: any) => {
          console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
        },
      });
    }
  }

  private loadWishlistStatus(): void {
    if (!this.product) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    this.wishlistService.isInWishlist(this.product._id).subscribe({
      next: (isInWishlist) => {
        this.wishlistCache.set(this.product!._id, isInWishlist);
      },
      error: (err) => {
        console.error('Error loading wishlist status:', err);
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  selectVariant(variant: Variant): void {
    this.selectedVariant = variant;
    if (this.product) {
      this.product = { ...this.product, selectedVariant: variant };
    }
    this.quantity = 1;
  }

  isSaleProduct(): boolean {
    if (this.selectedVariant) {
      return (
        this.selectedVariant.salePrice != null &&
        this.selectedVariant.salePrice < this.selectedVariant.price
      );
    }
    if (this.product) {
      // Nếu có biến thể, kiểm tra xem có biến thể nào có giảm giá không (đồng nhất với trang chủ)
      if (this.product.variants && this.product.variants.length > 0) {
        return this.product.variants.some(v => v.salePrice && v.salePrice < v.price);
      }
      return (
        this.product.salePrice != null &&
        this.product.salePrice < this.product.price
      );
    }
    return false;
  }

  calculateDiscountPercentage(): number {
    if (this.selectedVariant) {
      if (
        !this.selectedVariant.salePrice ||
        this.selectedVariant.salePrice >= this.selectedVariant.price
      ) {
        return 0;
      }
      return Math.round(
        ((this.selectedVariant.price - this.selectedVariant.salePrice) /
          this.selectedVariant.price) * 100
      );
    }
    if (this.product) {
      // Nếu có biến thể, tìm % giảm giá cao nhất (đồng nhất với trang chủ)
      if (this.product.variants && this.product.variants.length > 0) {
        const maxDiscount = Math.max(...this.product.variants.map(v => {
          if (!v.salePrice || v.salePrice >= v.price) return 0;
          return Math.round(((v.price - v.salePrice) / v.price) * 100);
        }));
        return maxDiscount;
      }
      if (!this.product.salePrice || this.product.salePrice >= this.product.price) {
        return 0;
      }
      return Math.round(
        ((this.product.price - this.product.salePrice) / this.product.price) * 100
      );
    }
    return 0;
  }

  calculateVariantDiscount(variant: Variant): number {
    if (!variant.salePrice || variant.salePrice >= variant.price) {
      return 0;
    }
    return Math.round(((variant.price - variant.salePrice) / variant.price) * 100);
  }

  increaseQuantity(): void {
    if (this.quantity < this.getCurrentStock()) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    const productToAdd: ProductInterface = { ...this.product };
    if (this.selectedVariant) {
      productToAdd.selectedVariant = this.selectedVariant;
    }

    this.cartService.addToCartWithQuantity(productToAdd, this.quantity);
    Swal.fire({
      title: 'Thành công',
      text: `Đã thêm ${this.quantity} sản phẩm vào giỏ hàng`,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }

  buyNow(): void {
    if (!this.product) return;

    const productToAdd: ProductInterface = { ...this.product };
    if (this.selectedVariant) {
      productToAdd.selectedVariant = this.selectedVariant;
    }

    this.cartService.addToCartWithQuantity(productToAdd, this.quantity);
    this.router.navigate(['/checkout']);
  }

  getCurrentPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.salePrice || this.selectedVariant.price;
    }
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0) {
        const minPrice = Math.min(...this.product.variants.map(v => v.salePrice || v.price));
        return minPrice;
      }
      return this.product.salePrice || this.product.price;
    }
    return 0;
  }

  getOriginalPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.price;
    }
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0) {
        const minOriginalPrice = Math.min(...this.product.variants.map(v => v.price));
        return minOriginalPrice;
      }
      return this.product.price;
    }
    return 0;
  }

  isVariantInStock(variant: Variant): boolean {
    return variant.stock > 0;
  }

  getCurrentStock(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.stock;
    }
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0) {
        return Math.max(...this.product.variants.map(v => v.stock));
      }
      return this.product.stock || 0;
    }
    return 0;
  }

  loadRelatedProducts(): void {
    if (!this.product) return;

    this.productService.getAllProducts().subscribe({
      next: (products: ProductInterface[]) => {
        // Lọc sản phẩm cùng danh mục và loại bỏ sản phẩm hiện tại
        this.relatedProducts = products
          .filter((p: ProductInterface) => p.categoryId === this.product!.categoryId && p._id !== this.product!._id)
          .slice(0, 4); // Chỉ lấy 4 sản phẩm liên quan
      },
      error: (err: any) => {
        console.error('Error loading related products:', err);
      }
    });
  }

  goToProduct(id: string): void {
    this.router.navigate(['/chitiet', id]);
  }

  // Lấy giá hiện tại của sản phẩm liên quan
  getRelatedProductPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      const minPrice = Math.min(...product.variants.map(v => v.salePrice || v.price));
      return minPrice;
    }
    return product.salePrice || product.price;
  }

  // Lấy giá gốc của sản phẩm liên quan
  getRelatedProductOriginalPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      const minOriginalPrice = Math.min(...product.variants.map(v => v.price));
      return minOriginalPrice;
    }
    return product.price;
  }

  // Kiểm tra sản phẩm liên quan có giảm giá không
  isRelatedProductOnSale(product: ProductInterface): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some(v => v.salePrice && v.salePrice < v.price);
    }
    return product.salePrice != null && product.salePrice < product.price;
  }

  // Xử lý lỗi ảnh
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  // Wishlist methods
  toggleFavorite(): void {
    if (!this.product) return;

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

    const isCurrentlyInWishlist = this.wishlistCache.get(this.product._id) || false;

    if (isCurrentlyInWishlist) {
      // Xóa khỏi wishlist
      this.wishlistService.removeFromWishlist(this.product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistCache.set(this.product!._id, false);
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
      this.wishlistService.addToWishlist(this.product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistCache.set(this.product!._id, true);
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

  isFavorite(): boolean {
    if (!this.product) return false;
    return this.wishlistCache.get(this.product._id) || false;
  }
}
