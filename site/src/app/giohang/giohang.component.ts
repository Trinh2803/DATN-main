import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../cart.service';
import { DiscountService } from '../discount.service';
import { ProductInterface, Variant } from '../product-interface';

interface CartItem {
  product: ProductInterface;
  quantity: number;
  selectedVariant?: Variant;
  discountCode?: string;
  discountInfo?: any;
}

@Component({
  selector: 'app-giohang',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './giohang.component.html',
  styleUrls: ['./giohang.component.css']
})
export class GiohangComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalAmount = 0;
  discountCode = '';
  discountAmount = 0;
  finalAmount = 0;
  appliedDiscount: any = null;
  discountError = '';
  discountSuccess = '';
  
  // Additional properties for HTML template
  cartItemCount = 0;
  totalPrice = 0;
  cartDiscountCode = '';
  cartDiscountInfo: any = null;
  orderNote = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private discountService: DiscountService
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.cartItemCount = items.length;
      this.calculateTotal();
    });
  }

  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce((total, item) => {
      const price = item.selectedVariant ? 
        (item.selectedVariant.salePrice || item.selectedVariant.price) :
        (item.product.salePrice || item.product.price);
      return total + (price * item.quantity);
    }, 0);
    
    this.totalPrice = this.totalAmount;
    this.finalAmount = this.totalAmount - this.discountAmount;
  }

  // Methods for HTML template
  getItemPrice(item: CartItem): number {
    return this.getProductPrice(item);
  }

  getItemOriginalPrice(item: CartItem): number {
    return this.getProductOriginalPrice(item);
  }

  getVariantInfo(item: CartItem): string | null {
    if (item.selectedVariant) {
      return `${item.selectedVariant.size} - ${(item.selectedVariant.salePrice || item.selectedVariant.price).toLocaleString('vi-VN')}đ`;
    }
    return null;
  }

  onQuantityChange(item: CartItem, event: any): void {
    const newQuantity = parseInt(event.target.value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      this.updateQuantity(item.product._id, newQuantity, item.selectedVariant);
    }
  }

  onQuantityBlur(item: CartItem): void {
    // Validate quantity on blur
    if (item.quantity < 1) {
      this.updateQuantity(item.product._id, 1, item.selectedVariant);
    }
  }

  getStockQuantity(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.stock;
    }
    return 999;
  }

  canIncreaseQuantity(item: CartItem): boolean {
    const maxStock = this.getMaxQuantity(item);
    return item.quantity < maxStock;
  }

  applyDiscount(item: CartItem): void {
    if (!item.discountCode?.trim()) {
      alert('Vui lòng nhập mã giảm giá');
      return;
    }
    
    // Apply discount logic for individual item
    this.discountService.checkDiscountCode(item.discountCode, this.getItemPrice(item) * item.quantity, [item.product._id]).subscribe({
      next: (response) => {
        if (response.success) {
          item.discountInfo = response.discount;
          this.calculateTotal();
        }
      },
      error: (error) => {
        alert(error.error?.message || 'Mã giảm giá không hợp lệ');
      }
    });
  }

  applyCartDiscount(): void {
    this.checkDiscountCode();
  }

  checkout(): void {
    this.proceedToCheckout();
  }

  testRemove(): void {
    // Test method for removing items
    if (this.cartItems.length > 0) {
      this.removeFromCart(this.cartItems[0].product._id, this.cartItems[0].selectedVariant);
    }
  }

  updateQuantity(productId: string, newQuantity: number, selectedVariant?: Variant): void {
    if (newQuantity <= 0) {
      this.removeFromCart(productId, selectedVariant);
      return;
    }

    const item = this.cartItems.find(item => 
      item.product._id === productId && 
      this.compareVariants(item.selectedVariant, selectedVariant)
    );

    if (item) {
      // Kiểm tra stock nếu có biến thể
      if (selectedVariant && selectedVariant.stock < newQuantity) {
        alert(`Chỉ còn ${selectedVariant.stock} sản phẩm trong kho`);
        return;
      }

      item.quantity = newQuantity;
      this.cartService.updateQuantity(productId, newQuantity, selectedVariant);
      this.calculateTotal();
    }
  }

  removeFromCart(productId: string, selectedVariant?: Variant): void {
    const item = this.cartItems.find(item => 
      item.product._id === productId && 
      this.compareVariants(item.selectedVariant, selectedVariant)
    );

    if (item) {
      this.cartItems = this.cartItems.filter(item => 
        !(item.product._id === productId && this.compareVariants(item.selectedVariant, selectedVariant))
      );
      this.cartService.removeFromCart(productId, selectedVariant);
      this.calculateTotal();
    }
  }

  compareVariants(variant1?: Variant, variant2?: Variant): boolean {
    if (!variant1 && !variant2) return true;
    if (!variant1 || !variant2) return false;
    return variant1._id === variant2._id;
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartService.clearCart();
    this.calculateTotal();
  }

  getProductPrice(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.salePrice || item.selectedVariant.price;
    }
    return item.product.salePrice || item.product.price;
  }

  getProductOriginalPrice(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.price;
    }
    return item.product.price;
  }

  hasDiscount(item: CartItem): boolean {
    if (item.selectedVariant) {
      return !!item.selectedVariant.salePrice && item.selectedVariant.salePrice < item.selectedVariant.price;
    }
    return !!item.product.salePrice && item.product.salePrice < item.product.price;
  }

  calculateDiscountPercentage(item: CartItem): number {
    const originalPrice = this.getProductOriginalPrice(item);
    const currentPrice = this.getProductPrice(item);
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  getVariantDisplayName(variant: Variant): string {
    return `${variant.size} - ${(variant.salePrice || variant.price).toLocaleString('vi-VN')}đ`;
  }

  isVariantInStock(variant: Variant): boolean {
    return variant.stock > 0;
  }

  getMaxQuantity(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.stock;
    }
    return 999; // Không giới hạn nếu không có biến thể
  }

  // Discount code functionality
  checkDiscountCode(): void {
    if (!this.discountCode.trim()) {
      this.discountError = 'Vui lòng nhập mã giảm giá';
      return;
    }

    const productIds = this.cartItems.map(item => item.product._id);
    
    this.discountService.checkDiscountCode(this.discountCode, this.totalAmount, productIds).subscribe({
      next: (response) => {
        if (response.success) {
          this.appliedDiscount = response.discount;
          this.discountAmount = response.discount.discountAmount;
          this.finalAmount = this.totalAmount - this.discountAmount;
          this.discountSuccess = `Áp dụng mã giảm giá thành công! Giảm ${this.discountAmount.toLocaleString('vi-VN')}đ`;
          this.discountError = '';
          
          // Update cart discount info
          this.cartDiscountInfo = {
            code: response.discount.code,
            discountAmount: response.discount.discountAmount,
            finalAmount: this.finalAmount
          };
        }
      },
      error: (error) => {
        this.discountError = error.error?.message || 'Mã giảm giá không hợp lệ';
        this.discountSuccess = '';
        this.appliedDiscount = null;
        this.discountAmount = 0;
        this.finalAmount = this.totalAmount;
        this.cartDiscountInfo = null;
      }
    });
  }

  removeDiscount(): void {
    this.discountCode = '';
    this.appliedDiscount = null;
    this.discountAmount = 0;
    this.finalAmount = this.totalAmount;
    this.discountError = '';
    this.discountSuccess = '';
    this.cartDiscountInfo = null;
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    // Lưu thông tin discount vào localStorage để sử dụng ở checkout
    if (this.appliedDiscount) {
      localStorage.setItem('appliedDiscount', JSON.stringify(this.appliedDiscount));
    }

    this.router.navigate(['/checkout']);
  }

  // Quantity controls
  increaseQuantity(item: CartItem): void {
    const maxStock = this.getMaxQuantity(item);
    const newQuantity = item.quantity + 1;
    
    if (newQuantity <= maxStock) {
      this.updateQuantity(item.product._id, newQuantity, item.selectedVariant);
    } else {
      alert(`Chỉ có thể mua tối đa ${maxStock} sản phẩm`);
    }
  }

  decreaseQuantity(item: CartItem): void {
    const newQuantity = item.quantity - 1;
    if (newQuantity >= 1) {
      this.updateQuantity(item.product._id, newQuantity, item.selectedVariant);
    } else {
      this.removeFromCart(item.product._id, item.selectedVariant);
    }
  }

  setQuantityToMax(item: CartItem): void {
    const maxStock = this.getMaxQuantity(item);
    this.updateQuantity(item.product._id, maxStock, item.selectedVariant);
  }

  setQuantityToOne(item: CartItem): void {
    this.updateQuantity(item.product._id, 1, item.selectedVariant);
  }
}
