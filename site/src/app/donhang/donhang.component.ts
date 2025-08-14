import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    thumbnail: string;
  };
  quantity: number;
}

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  note: string;
  shippingMethod: string;
  paymentMethod: string;
}

interface OrderData {
  cartItems: CartItem[];
  totalPrice: number;
  shippingInfo: ShippingInfo;
  orderNote: string;
  orderDate: string;
}

@Component({
  selector: 'app-donhang',
  templateUrl: './donhang.component.html',
  styleUrls: ['./donhang.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DonhangComponent implements OnInit {
  order: OrderData | null = null;
  private apiUrl = 'http://localhost:3000/orders';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Lấy orderId từ query params
    const orderId = this.route.snapshot.queryParams['orderId'];
    console.log('Order ID from query params:', orderId);

    if (orderId) {
      // Gọi API để lấy chi tiết đơn hàng
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http.get(`${this.apiUrl}/${orderId}`, { headers }).subscribe({
        next: (response: any) => {
          console.log('Order data from API:', response);
          // Chuyển đổi dữ liệu API thành định dạng OrderData
          this.order = {
            cartItems: response.data.items.map((item: any) => ({
              product: {
                _id: item.productId._id || item.productId,
                name: item.productId.name || item.productName,
                price: item.price,
                salePrice: item.productId.salePrice,
                thumbnail: item.productId.thumbnail || item.thumbnail,
              },
              quantity: item.quantity,
              discountInfo: item.discountInfo || null // lấy discountInfo từ backend
            })),
            totalPrice: response.data.total,
            shippingInfo: {
              fullName: response.data.customerName,
              phone: response.data.customerPhone,
              address: response.data.customerAddress,
              note: response.data.customerNote,
              shippingMethod: 'free', // Giả sử mặc định
              paymentMethod: response.data.paymentMethod || 'cod', // Lấy từ API
            },
            orderNote: response.data.customerNote,
            orderDate: response.data.createdAt,
          };
        },
        error: (err) => {
          console.error('Error fetching order:', err);
          this.router.navigate(['/giohang']);
        },
      });
    } else {
      console.warn('No orderId found in query params');
      this.router.navigate(['/giohang']);
    }
  }

  getDiscountedItemPrice(item: any): number {
    let basePrice = item.product.salePrice || item.product.price;
    if (item.discountInfo) {
      if (item.discountInfo.discountType === 'percentage') {
        return Math.round(basePrice * (1 - item.discountInfo.discountValue / 100));
      } else if (item.discountInfo.discountType === 'fixed') {
        return Math.max(0, basePrice - item.discountInfo.discountValue);
      }
    }
    return basePrice;
  }

  getDiscountedTotal(): number {
    if (!this.order) return 0;
    return this.order.cartItems.reduce((total, item: any) => {
      const price = this.getDiscountedItemPrice(item);
      return total + price * item.quantity;
    }, 0);
  }
}