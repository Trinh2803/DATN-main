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
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}