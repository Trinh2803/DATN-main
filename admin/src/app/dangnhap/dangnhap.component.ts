import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './dangnhap.component.html',
  styleUrls: ['./dangnhap.component.css'],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  accessError: string | null = null;
  formError: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.accessError = localStorage.getItem('accessError');
    if (this.accessError) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi truy cập',
        text: this.accessError,
        confirmButtonText: 'Đóng',
      });
      localStorage.removeItem('accessError');
    }
  }

  login() {
    this.formError = null;

    if (!this.email || !this.password) {
      this.formError = 'Vui lòng nhập đầy đủ email và mật khẩu';
      return;
    }

    this.authService.adminLogin(this.email, this.password).subscribe(
      (response) => {
        // Không tự lưu token nữa, AuthService đã tự lưu
        if (this.authService.isAdmin()) {
          Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công',
            text: 'Chào mừng bạn đến với trang quản trị!',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/thongke']);
          });
        } else {
          // Nếu không phải admin, xóa token và báo lỗi
          this.authService.logout();
          Swal.fire({
            icon: 'error',
            title: 'Đăng nhập thất bại',
            text: 'Chỉ tài khoản admin mới có thể đăng nhập vào hệ thống này',
            confirmButtonText: 'Đóng',
          });
        }
      },
      (error) => {
        console.error('Login failed', error);
        Swal.fire({
          icon: 'error',
          title: 'Đăng nhập thất bại',
          text: error?.error?.message || 'Email hoặc mật khẩu không đúng',
          confirmButtonText: 'Đóng',
        });
      }
    );
  }
}