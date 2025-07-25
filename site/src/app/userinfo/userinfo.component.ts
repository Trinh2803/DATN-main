import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UserService } from '../user.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './userinfo.component.html',
  styleUrls: ['./userinfo.component.css'],
})
export class UserInfoComponent implements OnInit {
  user: any = null;
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    this.user = userData ? JSON.parse(userData) : null;
    if (!this.user) {
      this.router.navigate(['/dangnhap']);
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  updateAvatar(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('avatar', this.selectedFile);
      this.userService.updateAvatar(formData).subscribe(
        (response) => {
          console.log('Update Avatar Response:', response);
          const updatedUser = response.data || response.user;
          this.userService.updateUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.user = updatedUser;
          alert('Cập nhật avatar thành công!');
          this.selectedFile = null; // Reset file input
        },
        (error) => {
          console.error('Lỗi cập nhật avatar:', error);
          alert('Cập nhật avatar thất bại!');
        }
      );
    } else {
      alert('Vui lòng chọn một hình ảnh!');
    }
  }

  updateProfile(): void {
    if (this.user) {
      const profileData = {
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address,
      };
      this.userService.updateProfile(profileData).subscribe(
        (response) => {
          console.log('Update Profile Response:', response);
          const updatedUser = response.data || response.user;
          this.userService.updateUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.user = updatedUser;
          alert('Cập nhật thông tin thành công!');
        },
        (error) => {
          console.error('Lỗi cập nhật thông tin:', error);
          alert('Cập nhật thông tin thất bại!');
        }
      );
    } else {
      alert('Vui lòng điền đầy đủ thông tin!');
    }
  }

  logout(): void {
    this.userService.clearUser();
    this.router.navigate(['/dangnhap']);
  }
}
