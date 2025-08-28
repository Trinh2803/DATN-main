import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule]
})
export class ResetPasswordComponent implements OnInit {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.otp = params['otp'] || '';
      
      if (!this.email || !this.otp) {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  get passwordMismatch(): boolean {
    return !!this.newPassword && !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  get isFormValid(): boolean {
    return !this.passwordMismatch && 
           !!this.newPassword && 
           this.newPassword.length >= 6 &&
           !!this.confirmPassword;
  }

  onSubmit(form: NgForm) {
    // Kiểm tra form hợp lệ
    if (form.invalid) {
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    if (this.passwordMismatch) {
      this.errorMessage = '❌ Mật khẩu xác nhận không khớp!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Gọi service reset mật khẩu
    this.userService.resetPassword(this.email, this.newPassword, this.otp).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.success) {
          this.successMessage = '✅ Đặt lại mật khẩu thành công! Đang chuyển hướng...';
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/dangnhap']);
          }, 2000);
        } else {
          this.errorMessage = response?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        
        // Xử lý thông báo lỗi chi tiết
        if (error.status === 400) {
          this.errorMessage = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else if (error.status === 404) {
          this.errorMessage = 'Không tìm thấy yêu cầu đặt lại mật khẩu. Vui lòng thử lại.';
        } else if (error.status === 410) {
          this.errorMessage = 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã.';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.';
        }
      }
    });
  }
}
