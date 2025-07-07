import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css'],
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule]
})
export class VerifyOtpComponent implements OnInit {
  email: string = '';
  otp: string = '';
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

  submitOtp() {
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.successMessage = '✅ Mã OTP chính xác!';
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email }
          });
        }, 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Xác minh OTP thất bại!';
      }
    });
  }
}
