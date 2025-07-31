import { Routes } from '@angular/router';
import { TrangchuComponent } from './trangchu/trangchu.component';
// import { LienheComponent } from './lienhe/lienhe.component';
// import { GioithieuComponent } from './gioithieu/gioithieu.component';
import { SanphamComponent } from './sanpham/sanpham.component';
import { ChiTietSanPhamComponent } from './chitietsanpham/chitietsanpham.component';
import { GiohangComponent } from './giohang/giohang.component';
import { DangkyComponent } from './dangky/dangky.component';
import { DangnhapComponent } from './dangnhap/dangnhap.component';
import { UserInfoComponent } from './userinfo/userinfo.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { DonhangComponent } from './donhang/donhang.component';
import { lichsudonhangComponent } from './lichsudonhang/lichsudonhang.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
// import { TimkiemComponent } from './timkiem/timkiem.component';
// import { DangkyComponent } from './dangky/dangky.component';
// import { DangnhapComponent } from './dangnhap/dangnhap.component';
// import { UserInfoComponent } from './user-info/user-info.component';
import { TintucComponent } from './tintuc/tintuc.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsItem {
  id: number;
  title: string;
  image: string;
  description: string;
  date: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'http://localhost:3000/api/news'; // Đổi lại nếu API khác

  constructor(private http: HttpClient) {}

  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(this.apiUrl);
  }
}


export const routes: Routes = [
    { path: '', component: TrangchuComponent},
    { path: 'trangchu', component: TrangchuComponent},
    { path: 'sanpham', component: SanphamComponent},
    {path : 'chitiet/:id', component: ChiTietSanPhamComponent},
    { path: 'chitietsanpham/:id', component: ChiTietSanPhamComponent },
    { path: 'product/:id', component: ChiTietSanPhamComponent },
    { path: "giohang", component: GiohangComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'verify-otp', component: VerifyOtpComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    // { path: 'lienhe', component: LienheComponent},
    // { path: 'gioithieu', component: GioithieuComponent},
    // { path: 'timkiem', component: TimkiemComponent},
    { path: 'dangky', component: DangkyComponent},
    { path: 'dangnhap', component: DangnhapComponent},
    { path: 'userinfo', component:UserInfoComponent},
    { path: 'checkout', component:CheckoutComponent},
    { path: 'donhang', component:DonhangComponent},
    { path: 'lichsudonhang', component:lichsudonhangComponent},
    { path: 'news', component: TintucComponent },
    { path: 'wishlist', component: WishlistComponent },
];
