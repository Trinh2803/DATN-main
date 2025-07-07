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

  constructor(private userService: UserService, private router: Router) {}

  submitEmail() {
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.sendOtp(this.email).subscribe({
      next: () => {
        this.successMessage = '✅ Mã OTP đã được gửi về email!';
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], {
            queryParams: { email: this.email }
          });
        }, 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Lỗi khi gửi mã OTP!';
      }
    });
  }
}
