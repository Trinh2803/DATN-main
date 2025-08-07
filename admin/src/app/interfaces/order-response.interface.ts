export interface Order {
  _id?: string;
  userId?: string; // Thêm userId nhưng không bắt buộc
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string; // Đổi thành string
  customerNote?: string;
  items: {
    productId: string;
    productName?: string; // Tùy chọn vì dữ liệu cũ có thể thiếu
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'Chờ xác nhận' | 'Đang chuẩn bị' | 'Đang giao' | 'Đã giao' | 'Đã hủy' | 'Đã hoàn thành';
  adminNote?: string;
  createdAt?: string; // Thay đổi kiểu dữ liệu thành string
  
  // Thêm các trường cho tích hợp VNPay
  paymentMethod?: 'cod' | 'vnpay';
  paymentStatus?: 'pending' | 'completed' | 'failed';
  vnpayInfo?: {
    vnp_TxnRef: string;
    vnp_TransactionNo?: string;
    vnp_Amount: number;
    vnp_OrderInfo: string;
    vnp_ResponseCode: string;
    vnp_TransactionStatus: string;
    vnp_PayDate?: string;
    vnp_BankCode?: string;
    vnp_CardType?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}