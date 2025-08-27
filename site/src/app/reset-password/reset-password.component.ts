import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  onSubmit() {
    if (this.passwordMismatch) {
      this.errorMessage = '❌ Mật khẩu xác nhận không khớp!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.resetPasswordAfterOtpVerification(this.email, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '✅ Đặt lại mật khẩu thành công! Đang chuyển hướng...';
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dangnhap']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
        console.error('Reset password error:', error);
      }
    });
  }
}
