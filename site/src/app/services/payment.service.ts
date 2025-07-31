import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentRequest {
  amount: number;
  bankCode?: string;
  language?: string;
  orderInfo?: string;
}

export interface PaymentResponse {
  code: string;
  message: string;
  data: string;
  orderId: string;
  amount: number;
}

export interface PaymentReturnResponse {
  code: string;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:3000/payment';

  constructor(private http: HttpClient) { }

  /**
   * Tạo URL thanh toán VNPay
   * @param paymentData Dữ liệu thanh toán
   * @returns Observable<PaymentResponse>
   */
  createPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/create_payment_url`, paymentData);
  }

  /**
   * Xử lý kết quả trả về từ VNPay
   * @param params Tham số từ VNPay
   * @returns Observable<PaymentReturnResponse>
   */
  handlePaymentReturn(params: any): Observable<PaymentReturnResponse> {
    return this.http.get<PaymentReturnResponse>(`${this.apiUrl}/vnpay_return`, { params });
  }

  /**
   * Mở trang thanh toán VNPay
   * @param paymentUrl URL thanh toán
   */
  openPaymentPage(paymentUrl: string): void {
    window.open(paymentUrl, '_blank');
  }

  /**
   * Kiểm tra kết quả thanh toán
   * @param responseCode Mã phản hồi từ VNPay
   * @returns boolean
   */
  isPaymentSuccessful(responseCode: string): boolean {
    return responseCode === '00';
  }

  /**
   * Lấy thông báo lỗi thanh toán
   * @param responseCode Mã phản hồi từ VNPay
   * @returns string
   */
  getPaymentErrorMessage(responseCode: string): string {
    const errorMessages: { [key: string]: string } = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking (Ngân hàng)',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chuyển tiền tự động. Vui lòng liên hệ ngân hàng để hỗ trợ',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '20': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã tạm thời bị khóa vì vi phạm quy định bảo mật giao dịch. Vui lòng liên hệ ngân hàng để được hỗ trợ hoặc thực hiện giao dịch khác.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Vui lòng thực hiện lại giao dịch.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
      '97': 'Chữ ký không hợp lệ'
    };

    return errorMessages[responseCode] || 'Lỗi không xác định';
  }
} 