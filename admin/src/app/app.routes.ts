import { Routes } from '@angular/router';
import { LoginComponent } from './dangnhap/dangnhap.component';
import { ThongkeComponent } from './thongke/thongke.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { QuanlydanhmucComponent } from './quanlydanhmuc/quanlydanhmuc.component';
import { QuanlysanphamComponent } from './quanlysanpham/quanlysanpham.component';
import { QuanlynguoidungComponent } from './quanlynguoidung/quanlynguoidung.component';
import { QuanlydonhangComponent } from './quanlydonhang/quanlydonhang.component';
import { DonhangchitietComponent } from './donhangchitiet/donhangchitiet.component';
import { QuanlygiamgiaComponent } from './quanlygiamgia/quanlygiamgia.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect mặc định đến /login
  { path: 'login', component: LoginComponent },
  { path: 'thongke', component: ThongkeComponent, canActivate: [AdminAuthGuard] },
  { path: 'quanlydanhmuc', component: QuanlydanhmucComponent, canActivate: [AdminAuthGuard] },
  { path: 'quanlysanpham', component: QuanlysanphamComponent, canActivate: [AdminAuthGuard] },
  { path: 'quanlynguoidung', component: QuanlynguoidungComponent, canActivate: [AdminAuthGuard] },
  { path: 'quanlydonhang', component: QuanlydonhangComponent, canActivate: [AdminAuthGuard] },
  { path: 'quanlygiamgia', component: QuanlygiamgiaComponent, canActivate: [AdminAuthGuard] },
  { path: 'order/:id', component: DonhangchitietComponent, canActivate: [AdminAuthGuard] },

  { path: '**', redirectTo: '/login' }, // Fallback route
];