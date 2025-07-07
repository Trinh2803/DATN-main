import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductInterface, Variant } from './product-interface';

interface CartItem {
  product: ProductInterface;
  quantity: number;
  selectedVariant?: Variant;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    this.loadCartFromLocalStorage();
  }

  private loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems = JSON.parse(savedCart);
      this.cartItemsSubject.next(this.cartItems);
    }
  }

  private saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.cartItemsSubject.next(this.cartItems);
  }

  addToCart(product: ProductInterface) {
    const existingItem = this.cartItems.find((item) =>
      item.product._id === product._id &&
      this.compareVariants(item.selectedVariant, product.selectedVariant)
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cartItems.push({
        product,
        quantity: 1,
        selectedVariant: product.selectedVariant
      });
    }
    this.saveCartToLocalStorage();
  }

  addToCartWithQuantity(product: ProductInterface, quantity: number) {
    const existingItem = this.cartItems.find((item) =>
      item.product._id === product._id &&
      this.compareVariants(item.selectedVariant, product.selectedVariant)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({
        product,
        quantity,
        selectedVariant: product.selectedVariant
      });
    }
    this.saveCartToLocalStorage();
  }

  private compareVariants(variant1?: Variant, variant2?: Variant): boolean {
    if (!variant1 && !variant2) return true;
    if (!variant1 || !variant2) return false;
    return variant1.id === variant2.id;
  }

  updateQuantity(productId: string, quantity: number, selectedVariant?: Variant) {
    const item = this.cartItems.find((item) =>
      item.product._id === productId &&
      this.compareVariants(item.selectedVariant, selectedVariant)
    );

    if (item && quantity > 0) {
      item.quantity = quantity;
      this.saveCartToLocalStorage();
    } else if (item && quantity === 0) {
      this.removeFromCart(productId, selectedVariant);
    }
  }

  removeFromCart(productId: string, selectedVariant?: Variant) {
    this.cartItems = this.cartItems.filter((item) =>
      !(item.product._id === productId && this.compareVariants(item.selectedVariant, selectedVariant))
    );
    this.saveCartToLocalStorage();
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => {
      const price = item.selectedVariant?.salePrice ||
                   item.selectedVariant?.price ||
                   item.product.salePrice ||
                   item.product.price;
      return total + price * item.quantity;
    }, 0);
  }

  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  clearCart() {
    this.cartItems = [];
    this.saveCartToLocalStorage();
  }
}
