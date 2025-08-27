import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ForgotPasswordComponent {
  email: string = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(private userService: UserService, private router: Router) {}

  submitEmail(form: NgForm) {
    if (form.invalid) {
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.requestPasswordReset(this.email).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = '✅ Mã OTP đã được gửi về email của bạn!';
        // Navigate to verify OTP page with email as query param
        setTimeout(() => {
          this.router.navigate(['/verify-reset-otp'], {
            queryParams: { email: this.email }
          });
        }, 1500);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.';
        console.error('Error requesting password reset:', err);
      }
    });
  }
}
