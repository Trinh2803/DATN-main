import { Component, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { ProductInterface, Variant } from '../product-interface';
import { UserService } from '../user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface CartItem {
  product: ProductInterface;
  quantity: number;
  selectedVariant?: Variant;
}

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  note: string;
  shippingMethod: string;
  paymentMethod: string;
}

@Component({
  imports: [FormsModule, CommonModule, RouterModule],
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  orderNote: string = '';
  shippingInfo: ShippingInfo = {
    fullName: '',
    phone: '',
    address: '',
    note: '',
    shippingMethod: 'free',
    paymentMethod: 'cod',
  };
  private apiUrl = 'http://localhost:3000/orders';

  constructor(
    private cartService: CartService,
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['/dangnhap'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
    });

    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      const orderData = JSON.parse(pendingOrder);
      this.orderNote = orderData.orderNote || '';
      this.cartItems = orderData.cartItems || [];
      this.totalPrice = orderData.totalPrice || 0;
    } else {
      this.router.navigate(['/giohang']);
    }
  }

  onCheckout(): void {
    if (!this.shippingInfo.fullName || !this.shippingInfo.phone || !this.shippingInfo.address) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    const user = this.userService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/dangnhap'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    const orderData = {
      userId: user.id,
      customerName: this.shippingInfo.fullName,
      customerPhone: this.shippingInfo.phone,
      customerAddress: this.shippingInfo.address,
      customerNote: this.orderNote || this.shippingInfo.note,
      customerEmail: user.email || '',
      items: this.cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: this.getItemPrice(item),
        variantId: item.selectedVariant?.id,
        variantSize: item.selectedVariant?.size,
      })),
      total: this.totalPrice,
      status: 'Chờ xác nhận',
      adminNote: '',
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.post(this.apiUrl, orderData, { headers }).subscribe({
      next: (response: any) => {
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrder');
        const orderId = response.data._id;
        console.log('Order created with ID:', orderId);
        this.router.navigate(['/donhang'], {
          queryParams: { orderId },
        });
      },
      error: (err) => {
        alert('Đặt hàng thất bại: ' + (err.error?.message || 'Vui lòng thử lại sau'));
      },
    });
  }

  // Thêm phương thức public để quay lại giỏ hàng
  goToCart(): void {
    this.router.navigate(['/giohang']);
  }

  // Lấy giá hiện tại cho item trong checkout
  getItemPrice(item: CartItem): number {
    if (item.selectedVariant) {
      return item.selectedVariant.salePrice || item.selectedVariant.price;
    }
    return item.product.salePrice || item.product.price;
  }

  // Lấy thông tin biến thể để hiển thị
  getVariantInfo(item: CartItem): string {
    if (item.selectedVariant) {
      return `${item.selectedVariant.size}`;
    }
    return '';
  }
}
