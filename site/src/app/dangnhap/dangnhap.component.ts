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
          const token = response?.data?.token;
          const user = response?.data?.user;
          if (token && user) {
            localStorage.setItem('token', token);
            if (this.user.remember) {
              localStorage.setItem('user', JSON.stringify(user));
              console.log('User stored:', localStorage.getItem('user'));
            } else {
              localStorage.removeItem('user');
            }
            console.log('Token stored:', localStorage.getItem('token'));
            this.userService.updateUser(user);

            const fromRegister = this.route.snapshot.queryParams['fromRegister'] === 'true';
            let returnUrl = '/';
            if (!fromRegister) {
              returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            }

            setTimeout(() => {
              this.router.navigate([returnUrl]);
            }, 2000);
          } else {
            this.errorMessage = 'Không nhận được token hoặc thông tin người dùng từ server!';
          }
        },
        error: (error) => {
          console.error('Lỗi đăng nhập:', error);
          this.errorMessage = error.error?.message || 'Đăng nhập thất bại! Vui lòng kiểm tra email hoặc mật khẩu.';
        },
      });
    } else {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin!';
    }
  }
}