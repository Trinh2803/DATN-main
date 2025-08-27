import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dangky',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule
  ],
  templateUrl: './dangky.component.html',
  styleUrls: ['./dangky.component.css']
})
export class DangkyComponent {
  registrationForm: FormGroup;
  showOtpForm = false;
  submitted = false;
  successMessage: string = '';
  errorMessage: string = '';
  email: string = '';
  countdown: number = 0;
  private countdownInterval: any;

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      otp: [''],
      role: ['customer']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value 
      ? null : { mismatch: true };
  }

  startCountdown(seconds: number) {
    this.countdown = seconds;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  resendOtp() {
    if (this.countdown <= 0) {
      this.userService.resendOtp(this.email).subscribe({
        next: () => {
          this.startCountdown(60);
          this.successMessage = 'Đã gửi lại mã OTP thành công!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = 'Có lỗi xảy ra khi gửi lại mã OTP. Vui lòng thử lại.';
          console.error('Resend OTP error:', error);
        }
      });
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    
    if (this.registrationForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin chính xác!';
      return;
    }

    if (this.showOtpForm) {
      // Handle OTP verification for registration
      const otp = this.registrationForm.get('otp')?.value;
      this.userService.verifyRegistration(this.email, otp).subscribe({
        next: () => {
          this.successMessage = 'Xác thực email thành công! Đang chuyển hướng...';
          setTimeout(() => {
            this.router.navigate(['/dangnhap'], { 
              queryParams: { registered: 'true' } 
            });
          }, 2000);
        },
        error: (error: any) => {
          console.error('Lỗi xác thực OTP:', error);
          this.errorMessage = error.error?.message || 'Mã OTP không chính xác hoặc đã hết hạn!';
        }
      });
    } else {
      // Handle registration
      const userData = this.registrationForm.value;
      this.email = userData.email;
      
      this.userService.register(userData).subscribe({
        next: (response) => {
          console.log('Đăng ký thành công, đang gửi OTP:', response);
          this.showOtpForm = true;
          this.startCountdown(60);
          this.successMessage = 'Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra hộp thư.';
        },
        error: (error) => {
          console.error('Lỗi đăng ký:', error);
          this.errorMessage = error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
        }
      });
    }
  }
}