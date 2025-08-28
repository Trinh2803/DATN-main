import { Component, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ForgotPasswordComponent {
  email: string = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  private userService = inject(UserService);
  private router = inject(Router);

  submitEmail(form: NgForm) {
    if (form.invalid) {
      // Đánh dấu tất cả các trường là touched để hiển thị thông báo lỗi
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Vui lòng nhập địa chỉ email hợp lệ';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.requestPasswordReset(this.email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.success) {
          this.successMessage = '✅ Mã OTP đã được gửi về email của bạn! Vui lòng kiểm tra hộp thư đến.';
          // Chuyển hướng sau 1.5 giây
          setTimeout(() => {
            this.router.navigate(['/verify-reset-otp'], {
              queryParams: { email: this.email }
            });
          }, 1500);
        } else {
          this.errorMessage = response?.message || 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Lỗi khi yêu cầu đặt lại mật khẩu:', error);
        
        // Xử lý thông báo lỗi chi tiết hơn
        if (error.status === 404) {
          this.errorMessage = 'Không tìm thấy tài khoản với email này.';
        } else if (error.status === 429) {
          this.errorMessage = 'Bạn đã yêu cầu mã OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.';
        }
      }
    });
  }
}
