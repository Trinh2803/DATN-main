import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../product.service';
import { CartService } from '../cart.service';
import { CommonModule } from '@angular/common';
import { ProductInterface, Variant } from '../product-interface';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
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
        },
        error: (err: any) => {
          console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
        },
      });
    }
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
      if (
        !this.product.salePrice ||
        this.product.salePrice >= this.product.price
      ) {
        return 0;
      }
      return Math.round(
        ((this.product.price - this.product.salePrice) / this.product.price) * 100
      );
    }
    return 0;
  }

  // Thêm phương thức mới để tính phần trăm giảm giá cho biến thể
  calculateVariantDiscount(variant: Variant): number {
    if (!variant.salePrice || variant.salePrice >= variant.price) {
      return 0;
    }
    return Math.round(((variant.price - variant.salePrice) / variant.price) * 100);
  }

  increaseQuantity(): void {
    if (this.selectedVariant && this.quantity < (this.selectedVariant.stock ?? Infinity)) {
      this.quantity++;
    } else if (!this.selectedVariant && this.product) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0 && !this.selectedVariant) {
        alert('Vui lòng chọn một biến thể sản phẩm!');
        return;
      }
      const productToAdd: ProductInterface = {
        ...this.product,
        selectedVariant: this.selectedVariant ?? undefined,
      };
      this.cartService.addToCartWithQuantity(productToAdd, this.quantity);
      alert(
        `Đã thêm ${this.quantity} ${this.product.name} ${
          this.selectedVariant ? `(${this.selectedVariant.size || 'Mặc định'})` : ''
        } vào giỏ hàng`
      );
    }
  }

  buyNow(): void {
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0 && !this.selectedVariant) {
        alert('Vui lòng chọn một biến thể sản phẩm!');
        return;
      }
      this.addToCart();
      this.router.navigate(['/giohang']);
    }
  }

  // Lấy giá hiện tại (có thể là giá biến thể hoặc giá sản phẩm)
  getCurrentPrice(): number {
    if (this.selectedVariant) {
      // Nếu đã chọn biến thể, hiển thị giá của biến thể đó
      return this.selectedVariant.salePrice || this.selectedVariant.price;
    }
    if (this.product) {
      // Nếu có biến thể nhưng chưa chọn, hiển thị giá thấp nhất (đồng nhất với trang chủ)
      if (this.product.variants && this.product.variants.length > 0) {
        const minPrice = Math.min(...this.product.variants.map(v => v.salePrice || v.price));
        return minPrice;
      }
      // Nếu không có biến thể, hiển thị giá sản phẩm chính
      return this.product.salePrice || this.product.price;
    }
    return 0;
  }

  // Lấy giá gốc (không giảm giá)
  getOriginalPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.price;
    }
    if (this.product) {
      // Nếu có biến thể, hiển thị giá gốc thấp nhất (đồng nhất với trang chủ)
      if (this.product.variants && this.product.variants.length > 0) {
        const minOriginalPrice = Math.min(...this.product.variants.map(v => v.price));
        return minOriginalPrice;
      }
      return this.product.price;
    }
    return 0;
  }

  // Kiểm tra xem biến thể có còn hàng không
  isVariantInStock(variant: Variant): boolean {
    return variant.stock > 0;
  }

  // Lấy số lượng tồn kho hiện tại
  getCurrentStock(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.stock;
    }
    return Infinity; // Nếu không có biến thể, coi như không giới hạn
  }
}
