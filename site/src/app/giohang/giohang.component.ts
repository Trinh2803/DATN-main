import { Component, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductInterface, Variant } from '../product-interface';

interface CartItem {
  product: ProductInterface;
  quantity: number;
  selectedVariant?: Variant;
}

@Component({
  imports: [FormsModule, CommonModule, RouterModule],
  selector: 'app-giohang',
  templateUrl: './giohang.component.html',
  styleUrls: ['./giohang.component.css'],
})
export class GiohangComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartItemCount: number = 0;
  totalPrice: number = 0;
  orderNote: string = '';

  constructor(
    private cartService: CartService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Không yêu cầu đăng nhập để xem giỏ hàng
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.cartItemCount = this.cartService.getCartItemCount();
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  updateQuantity(productId: string, quantity: number, selectedVariant?: Variant): void {
    this.cartService.updateQuantity(productId, quantity, selectedVariant);
  }

  removeFromCart(productId: string, selectedVariant?: Variant): void {
    console.log('Attempting to remove product:', productId, 'with variant:', selectedVariant);
    console.log('Current cart items:', this.cartItems);
    
    const item = this.cartItems.find(item => 
      item.product._id === productId && 
      this.compareVariants(item.selectedVariant, selectedVariant)
    );
    
    console.log('Found item to remove:', item);
    
    if (item) {
      const confirmMessage = `Bạn có chắc muốn xóa "${item.product.name}"${item.selectedVariant ? ` (${item.selectedVariant.size})` : ''} khỏi giỏ hàng?`;
      if (confirm(confirmMessage)) {
        console.log('User confirmed removal, calling cart service...');
        this.cartService.removeFromCart(productId, selectedVariant);
        console.log('Cart service called successfully');
      } else {
        console.log('User cancelled removal');
      }
    } else {
      console.log('Item not found, calling cart service anyway...');
      this.cartService.removeFromCart(productId, selectedVariant);
    }
  }

  // Phương thức helper để so sánh biến thể
  private compareVariants(variant1?: Variant, variant2?: Variant): boolean {
    if (!variant1 && !variant2) return true;
    if (!variant1 || !variant2) return false;
    return variant1.id === variant2.id;
  }

  // Xóa tất cả sản phẩm trong giỏ hàng
  clearCart(): void {
    if (this.cartItems.length > 0) {
      if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
        this.cartService.clearCart();
      }
    }
  }

  // Phương thức test để kiểm tra chức năng xóa
  testRemove(): void {
    if (this.cartItems.length > 0) {
      const firstItem = this.cartItems[0];
      console.log('Testing removal of first item:', firstItem);
      this.removeFromCart(firstItem.product._id, firstItem.selectedVariant);
    }
  }

  // Lấy giá hiện tại cho item trong giỏ hàng
  getItemPrice(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.salePrice || item.selectedVariant.price;
    }
    return item.product.salePrice || item.product.price;
  }

  // Lấy giá gốc cho item trong giỏ hàng
  getItemOriginalPrice(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.price;
    }
    return item.product.price;
  }

  // Kiểm tra item có giảm giá không
  hasDiscount(item: CartItem): boolean {
    if (item.selectedVariant) {
      return !!(item.selectedVariant.salePrice && item.selectedVariant.salePrice < item.selectedVariant.price);
    }
    return !!(item.product.salePrice && item.product.salePrice < item.product.price);
  }

  // Tính % giảm giá cho item
  calculateDiscountPercentage(item: CartItem): number {
    if (item.selectedVariant) {
      if (!item.selectedVariant.salePrice || item.selectedVariant.salePrice >= item.selectedVariant.price) {
        return 0;
      }
      return Math.round(((item.selectedVariant.price - item.selectedVariant.salePrice) / item.selectedVariant.price) * 100);
    }
    if (!item.product.salePrice || item.product.salePrice >= item.product.price) {
      return 0;
    }
    return Math.round(((item.product.price - item.product.salePrice) / item.product.price) * 100);
  }

  // Lấy thông tin biến thể để hiển thị
  getVariantInfo(item: CartItem): string {
    if (item.selectedVariant) {
      return `${item.selectedVariant.size}`;
    }
    return '';
  }

  checkout(): void {
    // Kiểm tra giỏ hàng trống
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.');
      return;
    }

    // Lưu thông tin giỏ hàng vào localStorage
    const orderData = {
      cartItems: this.cartItems,
      totalPrice: this.totalPrice,
      orderNote: this.orderNote,
    };
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Chuyển hướng đến checkout (sẽ kiểm tra đăng nhập ở CheckoutComponent)
    this.router.navigate(['/checkout']);
  }

  // Tăng số lượng
  increaseQuantity(item: CartItem): void {
    if (this.canIncreaseQuantity(item)) {
      const newQuantity = item.quantity + 1;
      this.updateQuantity(item.product._id, newQuantity, item.selectedVariant);
    } else {
      alert('Đã đạt giới hạn số lượng có sẵn!');
    }
  }

  // Giảm số lượng
  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      this.updateQuantity(item.product._id, newQuantity, item.selectedVariant);
    } else {
      // Nếu giảm xuống 0, xóa sản phẩm khỏi giỏ hàng
      this.removeFromCart(item.product._id, item.selectedVariant);
    }
  }

  // Kiểm tra item có còn hàng không
  isInStock(item: CartItem): boolean {
    if (item.selectedVariant) {
      return item.selectedVariant.stock > 0;
    }
    return true; // Nếu không có biến thể, coi như còn hàng
  }

  // Lấy số lượng tồn kho
  getStockQuantity(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.stock;
    }
    return 999; // Nếu không có biến thể, coi như không giới hạn
  }

  // Kiểm tra có thể tăng số lượng không
  canIncreaseQuantity(item: CartItem): boolean {
    if (item.selectedVariant) {
      return item.quantity < item.selectedVariant.stock;
    }
    return true; // Nếu không có biến thể, coi như không giới hạn
  }

  // Xử lý khi người dùng thay đổi số lượng trực tiếp
  onQuantityChange(item: CartItem, event: any): void {
    const newQuantity = parseInt(event.target.value);
    if (isNaN(newQuantity) || newQuantity < 1) {
      event.target.value = item.quantity; // Khôi phục giá trị cũ
      return;
    }
    
    const maxStock = this.getStockQuantity(item);
    if (newQuantity > maxStock) {
      event.target.value = maxStock;
      this.updateQuantity(item.product._id, maxStock, item.selectedVariant);
      alert(`Số lượng tối đa có thể mua là ${maxStock}`);
    } else {
      this.updateQuantity(item.product._id, newQuantity, item.selectedVariant);
    }
  }

  // Xử lý khi người dùng rời khỏi input
  onQuantityBlur(item: CartItem): void {
    // Đảm bảo giá trị hợp lệ khi blur
    if (item.quantity < 1) {
      this.updateQuantity(item.product._id, 1, item.selectedVariant);
    }
  }
}
