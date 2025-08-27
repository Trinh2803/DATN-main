import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../user.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [FormsModule, CommonModule, RouterModule],
  selector: 'app-dangnhap',
  templateUrl: './dangnhap.component.html',
  styleUrls: ['./dangnhap.component.css'],
  standalone: true,
})
export class DangnhapComponent {
  user = {
    email: '',
    password: '',
    remember: false,
  };
  submitted = false;
  successMessage: string = 'Đăng nhập thành công! Đang chuyển hướng...';
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onSubmit(form: NgForm) {
    this.submitted = true;
    if (form.valid) {
      const credentials = {
        email: this.user.email,
        password: this.user.password,
      };
      this.userService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login API Response:', response);
          this.errorMessage = '';
            
          // The service now handles token and user storage
          this.userService.updateUser(response.user || response.data?.user);

          const fromRegister = this.route.snapshot.queryParams['fromRegister'] === 'true';
          let returnUrl = '/';
          if (!fromRegister) {
            returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          }

          // Show success message and redirect
          this.successMessage = 'Đăng nhập thành công! Đang chuyển hướng...';
          setTimeout(() => {
            this.router.navigate([returnUrl]);
          }, 1000);
        },
        error: (error) => {
          console.error('Lỗi đăng nhập:', error);
          if (error.status === 400) {
            this.errorMessage = 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
          } else if (error.status === 401) {
            this.errorMessage = 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email của bạn.';
          } else {
            this.errorMessage = error.error?.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.';
          }
        },
      });
    } else {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin!';
    }
  }
}