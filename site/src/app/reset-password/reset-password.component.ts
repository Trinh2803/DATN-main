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
  newPassword: string = '';
  confirmPassword: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  get passwordMismatch(): boolean {
    return !!this.newPassword && !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  submitNewPassword() {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.passwordMismatch) {
      this.errorMessage = '❌ Mật khẩu xác nhận không khớp!';
      return;
    }

    this.userService.resetPassword(this.email, this.newPassword).subscribe({
      next: () => {
        this.successMessage = '✅ Đặt lại mật khẩu thành công! Đang chuyển hướng...';
        setTimeout(() => {
          this.router.navigate(['/dangnhap']);
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Lỗi khi đặt lại mật khẩu!';
      }
    });
  }
}
