import { Component, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { ProductInterface, Variant } from '../product-interface';
import { UserService } from '../user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../services/payment.service';

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
  discountCode: string = '';
  discountInfo: any = null;
  finalAmount: number = 0;
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
    private router: Router,
    private paymentService: PaymentService
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
      this.discountCode = orderData.discountCode || '';
      this.discountInfo = orderData.discountInfo || null;
      this.finalAmount = orderData.finalAmount || this.totalPrice;
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

    // Nếu chọn thanh toán VNPay
    if (this.shippingInfo.paymentMethod === 'vnpay') {
      this.processVNPayPayment();
      return;
    }

    // Xử lý thanh toán COD (Cash on Delivery)
    this.processCODOrder();
  }

  private processVNPayPayment(): void {
    const paymentData = {
      amount: this.finalAmount,
      bankCode: '', // Để trống để hiển thị tất cả ngân hàng
      language: 'vn',
      orderInfo: `Thanh toán đơn hàng MOHO - ${this.shippingInfo.fullName}`
    };

    this.paymentService.createPayment(paymentData).subscribe({
      next: (response) => {
        if (response.code === '00') {
          // Lưu thông tin đơn hàng để xử lý sau khi thanh toán thành công
          const orderData = this.prepareOrderData();
          localStorage.setItem('pendingVNPayOrder', JSON.stringify(orderData));

          // Chuyển đến trang thanh toán VNPay
          this.paymentService.openPaymentPage(response.data);
        } else {
          alert('Không thể tạo URL thanh toán: ' + response.message);
        }
      },
      error: (error) => {
        alert('Lỗi kết nối thanh toán: ' + error.message);
        console.error('VNPay payment error:', error);
      }
    });
  }

  private processCODOrder(): void {
    const orderData = this.prepareOrderData();
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.post(this.apiUrl, orderData, { headers }).subscribe({
      next: (response: any) => {
        this.cartService.clearCart();
        localStorage.removeItem('pendingOrder');
        const orderId = response.data._id;
        console.log('COD Order created with ID:', orderId);
        
        // Hiển thị thông báo thành công
        alert('Đơn hàng COD đã được tạo thành công! Đang chuyển đến trang đơn hàng...');
        
        // Chuyển đến trang đơn hàng để hiển thị thông tin chi tiết
        this.router.navigate(['/donhang'], {
          queryParams: { orderId },
        });
      },
      error: (err) => {
        alert('Đặt hàng thất bại: ' + (err.error?.message || 'Vui lòng thử lại sau'));
      },
    });
  }

  private prepareOrderData(): any {
    const user = this.userService.getCurrentUser();
    return {
      userId: user._id,
      customerName: this.shippingInfo.fullName,
      customerPhone: this.shippingInfo.phone,
      customerAddress: this.shippingInfo.address,
      customerNote: this.orderNote || this.shippingInfo.note,
      customerEmail: user.email || '',
      items: this.cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: this.getItemPrice(item),
        variantId: item.selectedVariant?._id,
        variantSize: item.selectedVariant?.size,
        discountInfo: (item as any).discountInfo || null
      })),
      total: this.totalPrice,
      finalAmount: this.finalAmount,
      discountCode: this.discountCode,
      discountInfo: this.discountInfo,
      status: 'Chờ xác nhận',
      adminNote: '',
      paymentMethod: this.shippingInfo.paymentMethod
    };
  }

  // Thêm phương thức public để quay lại giỏ hàng
  goToCart(): void {
    this.router.navigate(['/giohang']);
  }

  // Lấy giá hiện tại cho item trong checkout
  getItemPrice(item: CartItem): number {
    let basePrice = item.selectedVariant ? (item.selectedVariant.salePrice || item.selectedVariant.price) : (item.product.salePrice || item.product.price);
    if ((item as any).discountInfo) {
      const discountInfo = (item as any).discountInfo;
      if (discountInfo.discountType === 'percent') {
        return Math.round(basePrice * (1 - discountInfo.discountValue / 100));
      } else if (discountInfo.discountType === 'fixed') {
        return Math.max(0, basePrice - discountInfo.discountValue);
      }
    }
    return basePrice;
  }

  // Lấy thông tin biến thể để hiển thị
  getVariantInfo(item: CartItem): string {
    if (item.selectedVariant) {
      return `${item.selectedVariant.size}`;
    }
    return '';
  }
}
