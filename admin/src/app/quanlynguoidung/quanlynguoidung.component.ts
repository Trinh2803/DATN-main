import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User, ApiResponse } from '../services/user.service';

@Component({
  selector: 'app-quanlynguoidung',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './quanlynguoidung.component.html',
  styleUrls: ['./quanlynguoidung.component.css'],
})
export class QuanlynguoidungComponent implements OnInit, AfterViewInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  displayedUsers: User[] = []; // Người dùng hiển thị trên trang hiện tại
  searchQuery: string = '';
  userAvatar: string = '/assets/images/icon.png';
  errorMessage: string | null = null;
  currentPage: number = 1; // Trang hiện tại
  usersPerPage: number = 8 // Số người dùng mỗi trang
  totalPages: number = 1; // Tổng số trang

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      this.errorMessage = 'Vui lòng đăng nhập.';
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
    this.loadUserAvatar();
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('.icon').forEach((ico) => {
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  loadUsers(): void {
    console.log('Loading users with search query:', this.searchQuery);
    this.userService.getUsers(this.searchQuery).subscribe({
      next: (response: ApiResponse<User[]>) => {
        if (response.success) {
          this.users = response.data || [];
          this.filteredUsers = this.users;
          this.updatePagination();
          this.errorMessage = null;
          console.log('Users loaded:', this.users);
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy danh sách người dùng.';
          console.log('Error response from getUsers:', response.message);
        }
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.errorMessage = err.status === 401 || err.status === 403
          ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
          : err.error?.message || err.message || 'Lỗi khi lấy danh sách người dùng';
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('adminToken');
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadUserAvatar(): void {
    const avatar = localStorage.getItem('userAvatar') || '/assets/images/icon.png';
    this.userAvatar = avatar;
    console.log('User avatar loaded:', this.userAvatar);
  }

  search(): void {
    console.log('Search triggered with query:', this.searchQuery);
    this.currentPage = 1; // Reset về trang 1 khi tìm kiếm
    this.loadUsers();
  }

  changeUserRole(userId: string, newRole: 'admin' | 'customer'): void {
    if (confirm(`Bạn có chắc muốn thay đổi vai trò thành ${newRole === 'admin' ? 'Quản trị viên' : 'Khách hàng'}?`)) {
      console.log('Changing role for user:', userId, 'to', newRole);
      this.userService.changeUserRole(userId, newRole).subscribe({
        next: (response: ApiResponse<User>) => {
          if (response.success) {
            this.loadUsers();
            this.errorMessage = null;
            console.log('User role changed:', response.data);
          } else {
            this.errorMessage = response.message || 'Lỗi khi thay đổi vai trò.';
            console.log('Change role failed:', response.message);
          }
        },
        error: (err) => {
          console.error('Error changing user role:', err);
          this.errorMessage = err.error?.message || err.message || 'Lỗi khi thay đổi vai trò';
        },
      });
    }
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userAvatar');
    console.log('Logging out');
    this.router.navigate(['/login']);
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    const endIndex = startIndex + this.usersPerPage;
    this.displayedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
