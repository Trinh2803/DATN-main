import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../cart.service';
import { DiscountService } from '../services/discount.service';
import { ProductInterface, Variant } from '../product-interface';

interface CartItem {
  product: ProductInterface;
  quantity: number;
  selectedVariant?: Variant;
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
  
  // Additional properties for HTML template
  cartItemCount = 0;
  totalPrice = 0;
  orderNote = '';

  discountCode: string = '';
  discountApplied: boolean = false;
  discountError: string = '';
  discountInfo: any = null;

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
    // Calculate subtotal without discount
    const subtotal = this.cartItems.reduce((total, item) => {
      const price = this.getProductPrice(item);
      return total + (price * item.quantity);
    }, 0);
    
    // Apply discount if available
    if (this.discountInfo && this.discountApplied) {
      if (this.discountInfo.discountType === 'percentage') {
        const discountAmount = (subtotal * this.discountInfo.discountValue) / 100;
        this.totalAmount = Math.max(0, subtotal - discountAmount);
      } else if (this.discountInfo.discountType === 'fixed') {
        this.totalAmount = Math.max(0, subtotal - this.discountInfo.discountValue);
      } else {
        this.totalAmount = subtotal;
      }
    } else {
      this.totalAmount = subtotal;
    }
    
    this.totalPrice = this.totalAmount;
  }

  getDiscountedTotal(): number {
    return this.cartItems.reduce((total, item) => {
      const itemPrice = this.getProductPrice(item);
      return total + (itemPrice * item.quantity);
    }, 0);
  }

  // Methods for HTML template
  getItemPrice(item: CartItem): number {
    return this.getProductPrice(item);
  }

  getItemOriginalPrice(item: CartItem): number {
    return this.getProductPrice(item);
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

  applyDiscount() {
    if (!this.discountCode) return;

    this.discountService.checkDiscount(this.discountCode).subscribe({
      next: (response: any) => {
        if (response.success && response.discount) {
          this.discountInfo = response.discount;
          this.discountApplied = true;
          this.discountError = '';
          this.calculateTotal();
          
          // Lưu mã giảm giá vào localStorage để sử dụng khi thanh toán
          localStorage.setItem('appliedDiscount', JSON.stringify(this.discountInfo));
        } else {
          this.discountError = response.error || 'Mã giảm giá không hợp lệ';
          this.discountApplied = false;
          this.discountInfo = null;
          localStorage.removeItem('appliedDiscount');
        }
      },
      error: (error) => {
        this.discountError = error.error?.error || 'Lỗi khi kiểm tra mã giảm giá';
        this.discountApplied = false;
        this.discountInfo = null;
        localStorage.removeItem('appliedDiscount');
      }
    });
  }

  removeDiscount() {
    this.discountCode = '';
    this.discountApplied = false;
    this.discountError = '';
    this.discountInfo = null;
    this.calculateTotal();
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
    let price = item.selectedVariant ? 
      (item.selectedVariant.salePrice || item.selectedVariant.price) : 
      (item.product.salePrice || item.product.price);
    
    // Apply coupon discount if exists
    if (item.discountInfo) {
      if (item.discountInfo.discountType === 'percentage') {
        const discount = price * (item.discountInfo.discountValue / 100);
        price = Math.max(0, price - discount);
      } else if (item.discountInfo.discountType === 'fixed') {
        price = Math.max(0, price - item.discountInfo.discountValue);
      }
    }
    
    return price;
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


  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    // Lưu toàn bộ cartItems (bao gồm discountInfo) vào localStorage
    localStorage.setItem('pendingOrder', JSON.stringify({
      cartItems: this.cartItems,
      totalPrice: this.totalPrice,
      finalAmount: this.totalPrice,
      orderNote: this.orderNote
    }));

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
