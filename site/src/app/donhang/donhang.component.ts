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
                _id: item.productId._id,
                name: item.productId.name,
                price: item.price,
                salePrice: item.productId.salePrice,
                thumbnail: item.productId.thumbnail,
              },
              quantity: item.quantity,
            })),
            totalPrice: response.data.total,
            shippingInfo: {
              fullName: response.data.customerName,
              phone: response.data.customerPhone,
              address: response.data.customerAddress,
              note: response.data.customerNote,
              shippingMethod: 'free', // Giả sử mặc định
              paymentMethod: 'cod', // Giả sử mặc định
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
}