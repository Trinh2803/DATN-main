import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [FormsModule, CommonModule, RouterModule],
  selector: 'app-dangky',
  templateUrl: './dangky.component.html',
  styleUrls: ['./dangky.component.css']
})
export class DangkyComponent {
  user = {
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  };
  submitted = false;
  successMessage: string = 'Đăng ký thành công! Chuyển hướng đến đăng nhập...';
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    this.submitted = true;
    if (form.valid) {
      this.userService.register(this.user).subscribe(
        response => {
          console.log('Đăng ký thành công:', response);
          this.errorMessage = '';
          setTimeout(() => {
            this.router.navigate(['/dangnhap']);
          }, 2000);
        },
        error => {
          console.error('Lỗi đăng ký:', error);
          this.errorMessage = error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
        }
      );
    } else {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin!';
    }
  }
}