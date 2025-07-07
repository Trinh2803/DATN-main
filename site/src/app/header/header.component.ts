import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../cart.service';
import { ProductInterface } from '../product-interface';
import { UserService } from '../user.service';

interface CartItem {
  product: ProductInterface;
  quantity: number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  searchQuery: string = '';
  cartItemCount: number = 0;
  isLoggedIn: boolean = false;
  user: any = null;
  showMenu: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this.cartService.cartItems$.subscribe((items: CartItem[]) => {
      this.cartItemCount = this.cartService.getCartItemCount();
    });
    this.userService.user$.subscribe((user) => {
      this.user = user;
      this.isLoggedIn = !!user;
    });
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    this.isLoggedIn = !!token;
    this.user = userData ? JSON.parse(userData) : null;
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/sanpham'], { queryParams: { name: this.searchQuery } });
      this.searchQuery = '';
    }
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu')) {
      this.showMenu = false;
    }
  }

  logout(): void {
    this.userService.clearUser();
    this.isLoggedIn = false;
    this.user = null;
    this.showMenu = false;
    this.router.navigate(['/dangnhap']);
  }
}
