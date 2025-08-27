import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-verify-reset-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-reset-otp.component.html',
  styleUrls: ['./verify-reset-otp.component.css']
})
export class VerifyResetOtpComponent implements OnInit {
  otp: string = '';
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  countdown: number = 60;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/forgot-password']);
        return;
      }
      this.startCountdown();
    });
  }

  startCountdown() {
    this.countdown = 60;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  onSubmit() {
    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Vui lòng nhập mã OTP gồm 6 chữ số';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.verifyResetPasswordOtp(this.email, this.otp).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Xác minh OTP thành công! Đang chuyển hướng...';
        
        // Navigate to reset password page with email as query param
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { 
              email: this.email,
              otp: this.otp // Include OTP for additional security
            }
          });
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Xác minh OTP thất bại. Vui lòng thử lại.';
        console.error('OTP verification error:', error);
      }
    });
  }

  resendOtp() {
    if (this.countdown > 0) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Đã gửi lại mã OTP thành công!';
        this.startCountdown();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
      }
    });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
