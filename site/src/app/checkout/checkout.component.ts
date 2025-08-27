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
  email?: string;
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
  finalAmount: number = 0;
  toastVisible: boolean = false;
  shippingInfo: ShippingInfo = {
    email: '',
    fullName: '',
    phone: '',
    address: '',
    note: '',
    shippingMethod: 'free',
    paymentMethod: 'cod',
  };
  private apiUrl = 'http://localhost:3000/api/orders';

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
      // Recalculate totals when cart changes
      this.recalcTotals();

      // Nếu giỏ hàng rỗng, quay về trang giỏ hàng
      if (!items || items.length === 0) {
        this.router.navigate(['/giohang']);
      }
    });

    // finalAmount luôn được tính lại từ giỏ hàng hiện tại
    if (!this.finalAmount) {
      this.recalcTotals();
    }
  }

  onCheckout(): void {
    if (!this.shippingInfo.fullName || !this.shippingInfo.phone || !this.shippingInfo.address) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    // Validate email: required and format
    const email = (this.shippingInfo.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      alert('Vui lòng nhập email hợp lệ để nhận xác nhận đơn hàng.');
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
    
    if (!token) {
      alert('Vui lòng đăng nhập để đặt hàng');
      this.router.navigate(['/dangnhap'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('Sending order data:', orderData);
    console.log('API URL:', this.apiUrl);

    this.http.post(this.apiUrl, orderData, { headers }).subscribe({
      next: (response: any) => {
        console.log('Order creation response:', response);
        
        if (!response.success) {
          alert('Đặt hàng không thành công: ' + response.message);
          return;
        }

        this.cartService.clearCart();
        localStorage.removeItem('pendingOrder');
        const orderId = response.data?._id;
        
        if (!orderId) {
          console.error('Order created but no ID returned:', response);
          alert('Đặt hàng thành công nhưng không thể xem chi tiết đơn hàng');
          this.router.navigate(['/lichsudonhang']);
          return;
        }

        console.log('COD Order created successfully with ID:', orderId);
        this.showToast();
        this.router.navigate(['/donhang'], {
          queryParams: { orderId }
        });
      },
      error: (err) => {
        console.error('Order creation error:', err);
        let errorMessage = 'Đặt hàng thất bại';
        
        if (err.status === 401 || err.status === 403) {
          errorMessage = 'Vui lòng đăng nhập lại để đặt hàng';
          localStorage.removeItem('token');
          this.router.navigate(['/dangnhap'], { queryParams: { returnUrl: '/checkout' } });
        } else if (err.status === 404) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        alert(errorMessage);
      },
    });
  }

  // Recalculate final amount based on total and discount
  private recalcTotals(): void {
    // Tính tổng sau giảm dựa trên từng item (đã tính discountInfo trong getItemPrice)
    const discounted = this.cartItems.reduce((sum, item) => {
      return sum + this.getItemPrice(item) * item.quantity;
    }, 0);
    this.finalAmount = Math.max(0, Math.round(discounted));
  }

  // Discount code UI/logic removed: totals now equal cart total.

  private prepareOrderData(): any {
    const user = this.userService.getCurrentUser();
    return {
      userId: user._id,
      customerName: this.shippingInfo.fullName,
      customerPhone: this.shippingInfo.phone,
      customerAddress: this.shippingInfo.address,
      customerNote: this.orderNote || this.shippingInfo.note,
      customerEmail: (this.shippingInfo.email && this.shippingInfo.email.trim()) ? this.shippingInfo.email.trim() : (user?.email || ''),
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
      if (discountInfo.discountType === 'percentage') {
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

  private showToast(): void {
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  // Helpers cho template: tạm tính và tổng cộng sau giảm
  getDiscountedSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + this.getItemPrice(item) * item.quantity, 0);
  }

  getDiscountedTotal(): number {
    // Hiện tại phí vận chuyển miễn phí, tổng = tạm tính
    return Math.max(0, Math.round(this.getDiscountedSubtotal()));
  }
}
